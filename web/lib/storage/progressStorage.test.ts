import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import type { ProgressState } from "@/types/progress";
import {
  clearProgressState,
  loadProgressState,
  progressStorageKey,
  saveProgressState,
} from "./progressStorage.ts";

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
    version: 1,
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
  };
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
});

test("保存データがない場合は初期状態を返す", () => {
  setWindowStorage(new MemoryStorage());

  assert.deepEqual(loadProgressState(), {
    ok: true,
    state: {
      version: 1,
      totalAnswered: 0,
      totalCorrect: 0,
      currentStreakDays: 0,
      answers: [],
      srs: {},
    },
    source: "empty",
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
    JSON.stringify({ ...createProgressState(), version: 2 }),
  );
  setWindowStorage(storage);

  assert.deepEqual(loadProgressState(), {
    ok: false,
    reason: "version-mismatch",
  });
});

test("version=1でも構造が壊れているデータはversion-mismatchとして扱う", () => {
  const storage = new MemoryStorage();
  // JSONとしては妥当だが answers が配列でない（version は 1 のまま）構造破損データ
  const corruptedValue = { ...createProgressState(), answers: "broken" };
  storage.setItem(progressStorageKey, JSON.stringify(corruptedValue));
  setWindowStorage(storage);

  assert.deepEqual(loadProgressState(), {
    ok: false,
    reason: "version-mismatch",
  });
});

test("回答履歴に不正な値が含まれる場合はversion-mismatchとして扱う", () => {
  const base = createProgressState();
  const invalidAnswers: unknown[] = [
    { ...base.answers[0], part: "part8" }, // 許可外のPart
    { ...base.answers[0], selectedChoiceId: "E" }, // 許可外の選択肢ID
    { ...base.answers[0], elapsedMs: "fast" }, // 数値でない経過時間
    { ...base.answers[0], tags: [1] }, // 文字列以外を含むタグ
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
  setWindowStorage(storage);

  assert.deepEqual(clearProgressState(), { ok: true });
  assert.equal(storage.getItem(progressStorageKey), null);
});
