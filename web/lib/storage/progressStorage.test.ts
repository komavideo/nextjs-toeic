import assert from "node:assert/strict";
import { register } from "node:module";
import test, { afterEach } from "node:test";
import type {
  ProgressState,
  ProgressStateV1,
  ProgressStateV2,
} from "@/types/progress";

// node:test で直接実行するため、テスト内で tsconfig の `@/` alias を解決する。
const webRootUrl = new URL("../../", import.meta.url);
const aliasLoaderCode = `
const webRootUrl = ${JSON.stringify(webRootUrl.href)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return {
      shortCircuit: true,
      url: new URL(specifier.slice(2) + ".ts", webRootUrl).href,
    };
  }

  return nextResolve(specifier, context);
}
`;
register(`data:text/javascript,${encodeURIComponent(aliasLoaderCode)}`, import.meta.url);

const {
  clearProgressState,
  legacyProgressStorageKey,
  loadProgressState,
  progressStorageKey,
  progressStorageKeyV2,
  saveProgressState,
} = await import("./progressStorage.ts");

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.items.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

function createProgressState(): ProgressState {
  return {
    version: 3,
    totalAnswered: 1,
    totalCorrect: 1,
    currentStreakDays: 1,
    lastStudiedDate: "2026-06-25",
    answers: [
      {
        questionId: "part5-001",
        part: "part5",
        selectedChoiceId: "A",
        correct: true,
        answeredAt: "2026-06-25T10:00:00.000Z",
        elapsedMs: 12000,
        tags: ["word-form"],
      },
    ],
    srs: {
      "part5-001": {
        questionId: "part5-001",
        intervalDays: 1,
        dueDate: "2026-06-26",
        correctStreak: 1,
        lastAnsweredAt: "2026-06-25T10:00:00.000Z",
      },
    },
    bookmarkedQuestionIds: ["part5-001"],
    questionNotes: {
      "part5-001": "品詞の見落としに注意する。",
    },
    unlockedBadges: {
      "streak-3": "2026-06-25T10:00:00.000Z",
    },
  };
}

function createProgressStateV2(): ProgressStateV2 {
  const { unlockedBadges: _unlockedBadges, ...v2State } = createProgressState();

  return { ...v2State, version: 2 };
}

function toProgressStateV2ForTest(state: ProgressState): ProgressStateV2 {
  const { unlockedBadges: _unlockedBadges, ...v2State } = state;

  return { ...v2State, version: 2 };
}

function createLegacyProgressState(): ProgressStateV1 {
  const {
    bookmarkedQuestionIds: _bookmarkedQuestionIds,
    questionNotes: _questionNotes,
    unlockedBadges: _unlockedBadges,
    ...legacyState
  } = createProgressState();

  return { ...legacyState, version: 1 };
}

function setWindowStorage(storage: Storage): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
}

function setUnavailableWindow(): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      get localStorage() {
        throw new Error("localStorage unavailable");
      },
    },
  });
}

afterEach(() => {
  delete (globalThis as { window?: Window }).window;
});

test("保存した進捗状態をlocalStorageから復元する", () => {
  const storage = new MemoryStorage();
  const progressState = createProgressState();
  setWindowStorage(storage);

  assert.deepEqual(saveProgressState(progressState), { ok: true });
  assert.deepEqual(loadProgressState(), {
    ok: true,
    state: progressState,
    source: "storage",
  });
  assert.deepEqual(
    JSON.parse(storage.getItem(progressStorageKeyV2) ?? ""),
    toProgressStateV2ForTest(progressState),
  );
});

test("保存データがない場合は初期状態を返す", () => {
  setWindowStorage(new MemoryStorage());

  assert.deepEqual(loadProgressState(), {
    ok: true,
    state: {
      version: 3,
      totalAnswered: 0,
      totalCorrect: 0,
      currentStreakDays: 0,
      answers: [],
      srs: {},
      bookmarkedQuestionIds: [],
      questionNotes: {},
      unlockedBadges: {},
    },
    source: "empty",
  });
});

test("v2保存データをv3へ移行し、ロールバック用にv2キーを保持する", () => {
  const storage = new MemoryStorage();
  const v2State = createProgressStateV2();
  setWindowStorage(storage);
  storage.setItem(progressStorageKeyV2, JSON.stringify(v2State));

  const expectedState: ProgressState = {
    ...v2State,
    version: 3,
    unlockedBadges: {},
  };

  assert.deepEqual(loadProgressState(), {
    ok: true,
    state: expectedState,
    source: "migration",
  });
  assert.deepEqual(
    JSON.parse(storage.getItem(progressStorageKey) ?? ""),
    expectedState,
  );
  assert.deepEqual(
    JSON.parse(storage.getItem(progressStorageKeyV2) ?? ""),
    v2State,
  );
});

test("questionNotesがないv2保存データをv3へ移行して補完する", () => {
  const storage = new MemoryStorage();
  const {
    questionNotes: _questionNotes,
    ...v2StateWithoutQuestionNotes
  } = createProgressStateV2();
  setWindowStorage(storage);
  storage.setItem(
    progressStorageKeyV2,
    JSON.stringify(v2StateWithoutQuestionNotes),
  );

  const expectedState: ProgressState = {
    ...v2StateWithoutQuestionNotes,
    version: 3,
    questionNotes: {},
    unlockedBadges: {},
  };

  assert.deepEqual(loadProgressState(), {
    ok: true,
    state: expectedState,
    source: "migration",
  });
  assert.deepEqual(
    JSON.parse(storage.getItem(progressStorageKey) ?? ""),
    expectedState,
  );
  assert.deepEqual(
    JSON.parse(storage.getItem(progressStorageKeyV2) ?? ""),
    toProgressStateV2ForTest(expectedState),
  );
});

test("v1保存データをv3へ移行し、旧キーを自動削除しない", () => {
  const storage = new MemoryStorage();
  const legacyState = createLegacyProgressState();
  setWindowStorage(storage);
  storage.setItem(legacyProgressStorageKey, JSON.stringify(legacyState));

  const expectedState: ProgressState = {
    ...legacyState,
    version: 3,
    bookmarkedQuestionIds: [],
    questionNotes: {},
    unlockedBadges: {},
  };

  assert.deepEqual(loadProgressState(), {
    ok: true,
    state: expectedState,
    source: "migration",
  });
  assert.deepEqual(
    JSON.parse(storage.getItem(progressStorageKey) ?? ""),
    expectedState,
  );
  assert.deepEqual(
    JSON.parse(storage.getItem(progressStorageKeyV2) ?? ""),
    toProgressStateV2ForTest(expectedState),
  );
  assert.deepEqual(
    JSON.parse(storage.getItem(legacyProgressStorageKey) ?? ""),
    legacyState,
  );
});

test("移行保存に失敗しても移行後の進捗を読み込める", () => {
  const storage = new MemoryStorage();
  const legacyState = createLegacyProgressState();
  setWindowStorage(storage);
  storage.setItem(legacyProgressStorageKey, JSON.stringify(legacyState));
  // 移行時の v3 保存だけを失敗させ、読み込み自体は成功扱いになることを確認する。
  storage.setItem = () => {
    throw new Error("write failed");
  };

  const expectedState: ProgressState = {
    ...legacyState,
    version: 3,
    bookmarkedQuestionIds: [],
    questionNotes: {},
    unlockedBadges: {},
  };

  assert.deepEqual(loadProgressState(), {
    ok: true,
    state: expectedState,
    source: "migration",
  });
});

test("v3キーが存在する場合は旧キーへフォールバックしない", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    progressStorageKey,
    JSON.stringify({ ...createProgressState(), version: 4 }),
  );
  storage.setItem(progressStorageKeyV2, JSON.stringify(createProgressStateV2()));
  storage.setItem(
    legacyProgressStorageKey,
    JSON.stringify(createLegacyProgressState()),
  );
  setWindowStorage(storage);

  assert.deepEqual(loadProgressState(), {
    ok: false,
    reason: "version-mismatch",
  });
});

test("v3キーより新しいv2キーがあればv2を再移行してバッジ記録を引き継ぐ", () => {
  const storage = new MemoryStorage();
  const v3State = createProgressState();
  const firstAnswer = v3State.answers[0];
  assert.ok(firstAnswer);
  const extraAnswer = {
    ...firstAnswer,
    questionId: "part5-002",
    answeredAt: "2026-06-26T10:00:00.000Z",
  };
  const newerV2State: ProgressStateV2 = {
    ...createProgressStateV2(),
    totalAnswered: 2,
    totalCorrect: 2,
    answers: [...v3State.answers, extraAnswer],
  };
  setWindowStorage(storage);
  storage.setItem(progressStorageKey, JSON.stringify(v3State));
  storage.setItem(progressStorageKeyV2, JSON.stringify(newerV2State));

  const expectedState: ProgressState = {
    ...newerV2State,
    version: 3,
    unlockedBadges: v3State.unlockedBadges,
  };

  assert.deepEqual(loadProgressState(), {
    ok: true,
    state: expectedState,
    source: "migration",
  });
  assert.deepEqual(
    JSON.parse(storage.getItem(progressStorageKey) ?? ""),
    expectedState,
  );
});

test("questionNotesがない既存v3保存データを補完して保存する", () => {
  const storage = new MemoryStorage();
  const {
    questionNotes: _questionNotes,
    ...progressStateWithoutQuestionNotes
  } = createProgressState();
  setWindowStorage(storage);
  storage.setItem(
    progressStorageKey,
    JSON.stringify(progressStateWithoutQuestionNotes),
  );

  const expectedState: ProgressState = {
    ...progressStateWithoutQuestionNotes,
    questionNotes: {},
  };

  assert.deepEqual(loadProgressState(), {
    ok: true,
    state: expectedState,
    source: "storage",
  });
  assert.deepEqual(
    JSON.parse(storage.getItem(progressStorageKey) ?? ""),
    expectedState,
  );
});

test("unlockedBadgesが壊れていても進捗は読み込み空オブジェクトにフォールバックする", () => {
  const storage = new MemoryStorage();
  setWindowStorage(storage);
  storage.setItem(
    progressStorageKey,
    JSON.stringify({ ...createProgressState(), unlockedBadges: "broken" }),
  );

  const result = loadProgressState();

  assert.equal(result.ok, true);
  assert.deepEqual(result.ok && result.state.unlockedBadges, {});
  assert.deepEqual(
    JSON.parse(storage.getItem(progressStorageKey) ?? "").unlockedBadges,
    {},
  );
});

test("unlockedBadgesの不正なエントリだけを除外して読み込む", () => {
  const storage = new MemoryStorage();
  setWindowStorage(storage);
  storage.setItem(
    progressStorageKey,
    JSON.stringify({
      ...createProgressState(),
      unlockedBadges: {
        "streak-3": "2026-06-25T10:00:00.000Z",
        "bad-date": "not-a-date",
        "": "2026-06-25T10:00:00.000Z",
      },
    }),
  );

  const result = loadProgressState();

  assert.equal(result.ok, true);
  assert.deepEqual(result.ok && result.state.unlockedBadges, {
    "streak-3": "2026-06-25T10:00:00.000Z",
  });
});

test("破損JSONはparse-errorとして扱う", () => {
  const storage = new MemoryStorage();
  storage.setItem(progressStorageKey, "{broken");
  setWindowStorage(storage);

  assert.deepEqual(loadProgressState(), {
    ok: false,
    reason: "parse-error",
  });
});

test("version不一致はversion-mismatchとして扱う", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    progressStorageKey,
    JSON.stringify({ ...createProgressState(), version: 4 }),
  );
  setWindowStorage(storage);

  assert.deepEqual(loadProgressState(), {
    ok: false,
    reason: "version-mismatch",
  });
});

test("version=3でも構造が壊れているデータはversion-mismatchとして扱う", () => {
  const storage = new MemoryStorage();
  // JSONとしては妥当だが answers が配列でない（version は 3 のまま）構造破損データ
  const corruptedValue = { ...createProgressState(), answers: "broken" };
  storage.setItem(progressStorageKey, JSON.stringify(corruptedValue));
  setWindowStorage(storage);

  assert.deepEqual(loadProgressState(), {
    ok: false,
    reason: "version-mismatch",
  });
});

test("ブックマークIDが配列でない場合はversion-mismatchとして扱う", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    progressStorageKey,
    JSON.stringify({
      ...createProgressState(),
      bookmarkedQuestionIds: "part5-001",
    }),
  );
  setWindowStorage(storage);

  assert.deepEqual(loadProgressState(), {
    ok: false,
    reason: "version-mismatch",
  });
});

test("学習メモが不正な場合はversion-mismatchとして扱う", () => {
  const base = createProgressState();
  const invalidQuestionNotes: unknown[] = [
    "part5-001",
    { "part5-001": "" },
    { "part5-001": " ".repeat(3) },
    { "part5-001": "a".repeat(201) },
    { "part5-001": 123 },
  ];

  for (const questionNotes of invalidQuestionNotes) {
    const storage = new MemoryStorage();
    storage.setItem(
      progressStorageKey,
      JSON.stringify({ ...base, questionNotes }),
    );
    setWindowStorage(storage);

    assert.deepEqual(loadProgressState(), {
      ok: false,
      reason: "version-mismatch",
    });
  }
});

test("回答履歴に不正な値が含まれる場合はversion-mismatchとして扱う", () => {
  const base = createProgressState();
  const invalidAnswers: unknown[] = [
    { ...base.answers[0], part: "part8" }, // 許可外のPart
    { ...base.answers[0], selectedChoiceId: "E" }, // 許可外の選択肢ID
    { ...base.answers[0], answeredAt: "invalid-date" }, // ISO日時でない回答日時
    { ...base.answers[0], elapsedMs: "fast" }, // 数値でない経過時間
    { ...base.answers[0], elapsedMs: -1 }, // 負の経過時間
    { ...base.answers[0], tags: [1] }, // 文字列以外を含むタグ
    { ...base.answers[0], sessionId: "" }, // 空のセッションID
  ];

  for (const answer of invalidAnswers) {
    const storage = new MemoryStorage();
    storage.setItem(
      progressStorageKey,
      JSON.stringify({ ...base, answers: [answer] }),
    );
    setWindowStorage(storage);

    assert.deepEqual(loadProgressState(), {
      ok: false,
      reason: "version-mismatch",
    });
  }
});

test("集計値に不正な値が含まれる場合はversion-mismatchとして扱う", () => {
  const base = createProgressState();
  const invalidStates: unknown[] = [
    { ...base, totalAnswered: -1 }, // 負の回答数
    { ...base, totalAnswered: 1.5 }, // 小数の回答数
    { ...base, totalAnswered: 2 }, // 回答履歴件数との不一致
    { ...base, totalCorrect: -1 }, // 負の正答数
    { ...base, totalCorrect: 2 }, // 実際の正答数との不一致
    { ...base, currentStreakDays: -1 }, // 負の連続学習日数
  ];

  for (const progressState of invalidStates) {
    const storage = new MemoryStorage();
    storage.setItem(progressStorageKey, JSON.stringify(progressState));
    setWindowStorage(storage);

    assert.deepEqual(loadProgressState(), {
      ok: false,
      reason: "version-mismatch",
    });
  }
});

test("日付文字列が不正な場合はversion-mismatchとして扱う", () => {
  const base = createProgressState();
  const invalidStates: unknown[] = [
    { ...base, lastStudiedDate: "2026-99-99" }, // 存在しない学習日
    {
      ...base,
      srs: {
        "part5-001": { ...base.srs["part5-001"], dueDate: "2026-99-99" },
      },
    },
    {
      ...base,
      srs: {
        "part5-001": {
          ...base.srs["part5-001"],
          lastAnsweredAt: "invalid-date",
        },
      },
    },
  ];

  for (const progressState of invalidStates) {
    const storage = new MemoryStorage();
    storage.setItem(progressStorageKey, JSON.stringify(progressState));
    setWindowStorage(storage);

    assert.deepEqual(loadProgressState(), {
      ok: false,
      reason: "version-mismatch",
    });
  }
});

test("SRS状態に不正な間隔が含まれる場合はversion-mismatchとして扱う", () => {
  const base = createProgressState();
  const storage = new MemoryStorage();
  // 許可外の復習間隔（1/3/7/14/30 以外）
  const corruptedValue = {
    ...base,
    srs: { "part5-001": { ...base.srs["part5-001"], intervalDays: 2 } },
  };
  storage.setItem(progressStorageKey, JSON.stringify(corruptedValue));
  setWindowStorage(storage);

  assert.deepEqual(loadProgressState(), {
    ok: false,
    reason: "version-mismatch",
  });
});

test("localStorageを取得できない場合はunavailableを返す", () => {
  setUnavailableWindow();

  assert.deepEqual(loadProgressState(), {
    ok: false,
    reason: "unavailable",
  });
  assert.deepEqual(saveProgressState(createProgressState()), {
    ok: false,
    reason: "unavailable",
  });
  assert.deepEqual(clearProgressState(), {
    ok: false,
    reason: "unavailable",
  });
});

test("localStorage操作失敗時は操作別の失敗理由を返す", () => {
  const storage = new MemoryStorage();
  setWindowStorage(storage);
  storage.setItem(progressStorageKey, JSON.stringify(createProgressState()));

  storage.getItem = () => {
    throw new Error("read failed");
  };
  assert.deepEqual(loadProgressState(), {
    ok: false,
    reason: "unavailable",
  });

  storage.getItem = MemoryStorage.prototype.getItem.bind(storage);
  storage.setItem = () => {
    throw new Error("write failed");
  };
  assert.deepEqual(saveProgressState(createProgressState()), {
    ok: false,
    reason: "write-failed",
  });

  storage.setItem = MemoryStorage.prototype.setItem.bind(storage);
  storage.removeItem = () => {
    throw new Error("remove failed");
  };
  assert.deepEqual(clearProgressState(), {
    ok: false,
    reason: "remove-failed",
  });
});

test("初期化時に保存キーを削除する", () => {
  const storage = new MemoryStorage();
  storage.setItem(progressStorageKey, JSON.stringify(createProgressState()));
  storage.setItem(progressStorageKeyV2, JSON.stringify(createProgressStateV2()));
  storage.setItem(
    legacyProgressStorageKey,
    JSON.stringify(createLegacyProgressState()),
  );
  setWindowStorage(storage);

  assert.deepEqual(clearProgressState(), { ok: true });
  assert.equal(storage.getItem(progressStorageKey), null);
  assert.equal(storage.getItem(progressStorageKeyV2), null);
  assert.equal(storage.getItem(legacyProgressStorageKey), null);
});
