import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";
import type { ProgressState } from "@/types/progress";
import type { BadgeMetrics, BadgeView } from "./types.ts";

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

const { buildBadgeViews, countUnlockedBadges, evaluateUnlockedBadgeIds } =
  await import("./evaluate.ts");
const { questionCountsByPart } = await import("../progress/dailyMissions.ts");

const totalQuestionCount =
  questionCountsByPart.part5 +
  questionCountsByPart.part6 +
  questionCountsByPart.part7;

const zeroMetrics: BadgeMetrics = {
  currentStreakDays: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  cumulativeAccuracy: 0,
  distinctAnswered: 0,
  answeredByPart: { part5: 0, part6: 0, part7: 0 },
  answeredPartCount: 0,
  masteredCount: 0,
  perfectSessionCount: 0,
  overcameWeakTag: false,
  hasEarlyMorningAnswer: false,
  hasLateNightAnswer: false,
};

function makeMetrics(partial: Partial<BadgeMetrics>): BadgeMetrics {
  return { ...zeroMetrics, ...partial };
}

function createState(params: {
  currentStreakDays?: number;
  totalAnswered?: number;
  totalCorrect?: number;
  unlockedBadges?: Record<string, string>;
}): ProgressState {
  return {
    version: 3,
    totalAnswered: params.totalAnswered ?? 0,
    totalCorrect: params.totalCorrect ?? 0,
    currentStreakDays: params.currentStreakDays ?? 0,
    answers: [],
    srs: {},
    bookmarkedQuestionIds: [],
    questionNotes: {},
    unlockedBadges: params.unlockedBadges ?? {},
  };
}

function findView(views: BadgeView[], id: string): BadgeView {
  const view = views.find((item) => item.definition.id === id);
  assert.ok(view, `ビューが見つからない: ${id}`);
  return view;
}

test("連続学習日数のしきい値ちょうどで解除する", () => {
  assert.equal(
    evaluateUnlockedBadgeIds(makeMetrics({ currentStreakDays: 6 })).has(
      "streak-7",
    ),
    false,
  );
  assert.equal(
    evaluateUnlockedBadgeIds(makeMetrics({ currentStreakDays: 7 })).has(
      "streak-7",
    ),
    true,
  );
});

test("全問制覇は到達数が総数に達して初めて解除する", () => {
  assert.equal(
    evaluateUnlockedBadgeIds(
      makeMetrics({ distinctAnswered: totalQuestionCount - 1 }),
    ).has("reach-all"),
    false,
  );
  assert.equal(
    evaluateUnlockedBadgeIds(
      makeMetrics({ distinctAnswered: totalQuestionCount }),
    ).has("reach-all"),
    true,
  );
});

test("精度バッジは最小回答数ゲートを満たさないと解除しない", () => {
  assert.equal(
    evaluateUnlockedBadgeIds(
      makeMetrics({ totalAnswered: 49, cumulativeAccuracy: 100 }),
    ).has("accuracy-70"),
    false,
  );
  assert.equal(
    evaluateUnlockedBadgeIds(
      makeMetrics({ totalAnswered: 50, cumulativeAccuracy: 70 }),
    ).has("accuracy-70"),
    true,
  );
});

test("未獲得のマイルストーンには進捗が入り、獲得済みには入らない", () => {
  const views = buildBadgeViews(createState({ currentStreakDays: 7 }));

  const streak7 = findView(views, "streak-7");
  assert.equal(streak7.unlocked, true);
  assert.equal(streak7.progress, undefined);

  const streak14 = findView(views, "streak-14");
  assert.equal(streak14.unlocked, false);
  assert.deepEqual(streak14.progress, { current: 7, target: 14 });
});

test("精度バッジの未獲得進捗は束縛中の条件を示す", () => {
  // 回答数ゲート未達: 正答率が高くても回答数の進捗を示し、満杯にならない。
  const lowVolumeViews = buildBadgeViews(
    createState({
      totalAnswered: 20,
      totalCorrect: 18,
    }),
  );
  const lowVolumeAccuracy = findView(lowVolumeViews, "accuracy-70");
  assert.equal(lowVolumeAccuracy.unlocked, false);
  assert.deepEqual(lowVolumeAccuracy.progress, { current: 20, target: 50 });

  // ゲート達成後・正答率未達: 正答率の進捗を示す。
  const gateMetViews = buildBadgeViews(
    createState({
      totalAnswered: 100,
      totalCorrect: 60,
    }),
  );
  const gateMetAccuracy = findView(gateMetViews, "accuracy-70");
  assert.equal(gateMetAccuracy.unlocked, false);
  assert.deepEqual(gateMetAccuracy.progress, { current: 60, target: 70 });
});

test("記録済みのバッジは現在条件を満たさなくても獲得済みになる", () => {
  const views = buildBadgeViews(
    createState({
      currentStreakDays: 0,
      unlockedBadges: { "streak-7": "2026-06-25T10:00:00.000Z" },
    }),
  );

  const streak7 = findView(views, "streak-7");
  assert.equal(streak7.unlocked, true);
  assert.equal(streak7.unlockedAt, "2026-06-25T10:00:00.000Z");
  assert.equal(streak7.progress, undefined);
});

test("獲得数の集計は定義にない孤児IDを数えない", () => {
  const state = createState({
    unlockedBadges: {
      "streak-3": "2026-06-25T10:00:00.000Z",
      "ghost-badge": "2026-06-25T10:00:00.000Z",
    },
  });

  assert.equal(countUnlockedBadges(state).unlocked, 1);
});
