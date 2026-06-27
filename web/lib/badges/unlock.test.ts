import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";
import type { AnswerResult, ProgressState } from "@/types/progress";

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

const { reconcileBadges, applySessionBadgeUnlocks, reconcileAndPersistBadges } =
  await import("./unlock.ts");
const { recordAnswer } = await import("@/lib/progress/recordAnswer");

const now = new Date("2026-06-27T00:00:00.000Z");
const nowIso = now.toISOString();
const laterDay = new Date("2026-06-28T00:00:00.000Z");

function createState(params: {
  currentStreakDays?: number;
  unlockedBadges?: Record<string, string>;
}): ProgressState {
  return {
    version: 3,
    totalAnswered: 0,
    totalCorrect: 0,
    currentStreakDays: params.currentStreakDays ?? 0,
    answers: [],
    srs: {},
    bookmarkedQuestionIds: [],
    questionNotes: {},
    unlockedBadges: params.unlockedBadges ?? {},
  };
}

function createAnswer(index: number): AnswerResult {
  return {
    questionId: `part5-${index}`,
    part: "part5",
    selectedChoiceId: "A",
    correct: true,
    answeredAt: new Date(
      new Date("2026-06-25T10:00:00.000Z").getTime() + index * 1000,
    ).toISOString(),
    elapsedMs: 1000,
    tags: [],
    sessionId: "session-1",
  };
}

test("遡及解除は条件達成済みを記録し、2回目は冪等になる", () => {
  const state = createState({ currentStreakDays: 7 });

  const first = reconcileBadges(state, now);
  assert.equal(first.changed, true);
  assert.equal(first.state.unlockedBadges["streak-3"], nowIso);
  assert.equal(first.state.unlockedBadges["streak-7"], nowIso);

  const second = reconcileBadges(first.state, laterDay);
  assert.equal(second.changed, false);
  assert.deepEqual(second.newlyUnlocked, []);
  // 解除日時は最初の値を保持し、上書きしない。
  assert.equal(second.state.unlockedBadges["streak-7"], nowIso);
});

test("セッション解除は今回新たに満たした分のみお祝いする", () => {
  const before = createState({ currentStreakDays: 6 });
  const after = createState({ currentStreakDays: 7 });

  const result = applySessionBadgeUnlocks(before, after, now);
  const celebratedIds = result.celebrated.map((definition) => definition.id);

  // streak-3 はセッション前から達成済みなのでお祝い対象外。
  assert.deepEqual(celebratedIds, ["streak-7"]);
  // 記録には遡及分(streak-3)も静かに反映される。
  assert.equal(result.state.unlockedBadges["streak-3"], nowIso);
  assert.equal(result.state.unlockedBadges["streak-7"], nowIso);
});

test("既存の解除日時は上書きせず、新規分だけ現在時刻で記録する", () => {
  const oldIso = "2026-06-20T00:00:00.000Z";
  const before = createState({ currentStreakDays: 0 });
  const after = createState({
    currentStreakDays: 7,
    unlockedBadges: { "streak-3": oldIso },
  });

  const result = applySessionBadgeUnlocks(before, after, now);
  const celebratedIds = result.celebrated.map((definition) => definition.id);

  // streak-3 は過去に記録済みのため、再達成してもお祝い対象に含めない。
  assert.deepEqual(celebratedIds, ["streak-7"]);
  assert.equal(result.state.unlockedBadges["streak-3"], oldIso);
  assert.equal(result.state.unlockedBadges["streak-7"], nowIso);
});

test("定義にない孤児IDは保持し、判定では無視する", () => {
  const state = createState({
    currentStreakDays: 7,
    unlockedBadges: { "ghost-badge": "2026-06-20T00:00:00.000Z" },
  });

  const result = reconcileBadges(state, now);

  assert.equal(result.changed, true);
  assert.equal(
    result.state.unlockedBadges["ghost-badge"],
    "2026-06-20T00:00:00.000Z",
  );
  assert.equal(result.state.unlockedBadges["streak-7"], nowIso);
});

test("回答記録後のセッション完了で新規バッジを保存し結果表示対象にする", () => {
  const before = createState({});
  const after = Array.from({ length: 5 }, (_, index) =>
    createAnswer(index),
  ).reduce(recordAnswer, before);

  const result = applySessionBadgeUnlocks(before, after, now);
  const celebratedIds = result.celebrated.map((definition) => definition.id);

  assert.deepEqual(celebratedIds, ["perfect-1", "special-first"]);
  assert.equal(result.state.unlockedBadges["perfect-1"], nowIso);
  assert.equal(result.state.unlockedBadges["special-first"], nowIso);
});

test("遡及記録があれば永続化し、遡及後の状態を返す", () => {
  const state = createState({ currentStreakDays: 7 });
  const persisted: ProgressState[] = [];

  const result = reconcileAndPersistBadges(
    state,
    (next) => persisted.push(next),
    now,
  );

  assert.equal(persisted.length, 1);
  assert.equal(result.unlockedBadges["streak-7"], nowIso);
  assert.equal(persisted[0], result);
});

test("遡及記録がなければ永続化せず、元の状態をそのまま返す", () => {
  const state = createState({
    currentStreakDays: 7,
    unlockedBadges: { "streak-3": nowIso, "streak-7": nowIso },
  });
  const persisted: ProgressState[] = [];

  const result = reconcileAndPersistBadges(
    state,
    (next) => persisted.push(next),
    now,
  );

  assert.equal(persisted.length, 0);
  assert.equal(result, state);
});
