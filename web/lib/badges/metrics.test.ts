import assert from "node:assert/strict";
import test from "node:test";
import type { AnswerResult, ProgressState, SrsState } from "@/types/progress";
import type { ToeicReadingPart } from "@/types/question";
import {
  deriveBadgeMetrics,
  groupAnswersIntoSessions,
  sessionGapMs,
} from "./metrics.ts";

function createAnswer(params: {
  questionId?: string;
  part?: ToeicReadingPart;
  correct?: boolean;
  answeredAt?: string;
  tags?: string[];
  sessionId?: string;
}): AnswerResult {
  return {
    questionId: params.questionId ?? "part5-001",
    part: params.part ?? "part5",
    selectedChoiceId: "A",
    correct: params.correct ?? true,
    answeredAt: params.answeredAt ?? "2026-06-25T10:00:00.000Z",
    elapsedMs: 1000,
    tags: params.tags ?? [],
    ...(params.sessionId ? { sessionId: params.sessionId } : {}),
  };
}

function createState(
  answers: AnswerResult[],
  extra?: {
    srs?: Record<string, SrsState>;
    currentStreakDays?: number;
    totalAnswered?: number;
    totalCorrect?: number;
  },
): ProgressState {
  return {
    version: 3,
    totalAnswered: extra?.totalAnswered ?? answers.length,
    totalCorrect:
      extra?.totalCorrect ?? answers.filter((answer) => answer.correct).length,
    currentStreakDays: extra?.currentStreakDays ?? 0,
    answers,
    srs: extra?.srs ?? {},
    bookmarkedQuestionIds: [],
    questionNotes: {},
    unlockedBadges: {},
  };
}

// 回答時刻を「ローカル時刻の hour 時」に固定した ISO 文字列を返す（時間帯判定のTZ依存を排除）。
function isoAtLocalHour(hour: number): string {
  return new Date(2026, 5, 25, hour, 0, 0, 0).toISOString();
}

test("同じ問題への複数回答は回答済み問題数を1問として数える", () => {
  const state = createState([
    createAnswer({ questionId: "part5-001" }),
    createAnswer({ questionId: "part5-001" }),
  ]);
  const metrics = deriveBadgeMetrics(state);

  assert.equal(metrics.totalAnswered, 2);
  assert.equal(metrics.distinctAnswered, 1);
  assert.equal(metrics.answeredByPart.part5, 1);
});

test("回答済みでSRSに残っていない問題だけを定着済みとして数える", () => {
  const state = createState(
    [
      createAnswer({ questionId: "part5-001" }),
      createAnswer({ questionId: "part5-002" }),
    ],
    {
      srs: {
        "part5-002": {
          questionId: "part5-002",
          intervalDays: 1,
          dueDate: "2026-06-26",
          correctStreak: 1,
          lastAnsweredAt: "2026-06-25T10:00:00.000Z",
        },
      },
    },
  );
  const metrics = deriveBadgeMetrics(state);

  assert.equal(metrics.masteredCount, 1);
});

test("回答数が0のとき累積正答率は0になる", () => {
  const metrics = deriveBadgeMetrics(createState([]));

  assert.equal(metrics.cumulativeAccuracy, 0);
});

test("累積正答率はしきい値を早く満たさないよう切り捨てる", () => {
  const metrics = deriveBadgeMetrics(
    createState([], { totalAnswered: 200, totalCorrect: 139 }),
  );

  assert.equal(metrics.cumulativeAccuracy, 69);
});

test("回答した Part の数を数える", () => {
  const state = createState([
    createAnswer({ questionId: "part5-001", part: "part5" }),
    createAnswer({ questionId: "part6-001", part: "part6" }),
  ]);
  const metrics = deriveBadgeMetrics(state);

  assert.equal(metrics.answeredPartCount, 2);
});

test("空き時間が閾値ちょうどなら同一セッションとして区切らない", () => {
  const answers = [
    createAnswer({ answeredAt: "2026-06-25T10:00:00.000Z" }),
    createAnswer({
      answeredAt: new Date(
        new Date("2026-06-25T10:00:00.000Z").getTime() + sessionGapMs,
      ).toISOString(),
    }),
  ];
  const groups = groupAnswersIntoSessions(answers);

  assert.equal(groups.length, 1);
});

test("空き時間が閾値を超えると別セッションに区切る", () => {
  const answers = [
    createAnswer({ answeredAt: "2026-06-25T10:00:00.000Z" }),
    createAnswer({
      answeredAt: new Date(
        new Date("2026-06-25T10:00:00.000Z").getTime() + sessionGapMs + 1000,
      ).toISOString(),
    }),
  ];
  const groups = groupAnswersIntoSessions(answers);

  assert.equal(groups.length, 2);
});

test("sessionId付き回答は空き時間ではなく実セッションごとに区切る", () => {
  const base = new Date("2026-06-25T10:00:00.000Z").getTime();
  const answers = [
    createAnswer({
      answeredAt: new Date(base).toISOString(),
      sessionId: "session-a",
    }),
    createAnswer({
      answeredAt: new Date(base + sessionGapMs + 1000).toISOString(),
      sessionId: "session-a",
    }),
    createAnswer({
      answeredAt: new Date(base + sessionGapMs + 2000).toISOString(),
      sessionId: "session-b",
    }),
  ];
  const groups = groupAnswersIntoSessions(answers);

  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups.map((group) => group.map((answer) => answer.sessionId)),
    [
      ["session-a", "session-a"],
      ["session-b"],
    ],
  );
});

test("最小設問数以上で全問正解のセッションだけをパーフェクトに数える", () => {
  const base = new Date("2026-06-25T10:00:00.000Z").getTime();
  const answers = Array.from({ length: 5 }, (_, index) =>
    createAnswer({
      questionId: `part5-${index}`,
      correct: true,
      answeredAt: new Date(base + index * 1000).toISOString(),
    }),
  );
  const metrics = deriveBadgeMetrics(createState(answers));

  assert.equal(metrics.perfectSessionCount, 1);
});

test("連続して解いた複数の全問正解セッションをsessionIdで別々に数える", () => {
  const base = new Date("2026-06-25T10:00:00.000Z").getTime();
  const answers = Array.from({ length: 10 }, (_, index) =>
    createAnswer({
      questionId: `part5-${index}`,
      correct: true,
      answeredAt: new Date(base + index * 1000).toISOString(),
      sessionId: index < 5 ? "session-a" : "session-b",
    }),
  );
  const metrics = deriveBadgeMetrics(createState(answers));

  assert.equal(metrics.perfectSessionCount, 2);
});

test("設問数が最小未満ならパーフェクトに数えない", () => {
  const base = new Date("2026-06-25T10:00:00.000Z").getTime();
  const answers = Array.from({ length: 4 }, (_, index) =>
    createAnswer({
      questionId: `part5-${index}`,
      correct: true,
      answeredAt: new Date(base + index * 1000).toISOString(),
    }),
  );
  const metrics = deriveBadgeMetrics(createState(answers));

  assert.equal(metrics.perfectSessionCount, 0);
});

test("1問でも誤答があればパーフェクトに数えない", () => {
  const base = new Date("2026-06-25T10:00:00.000Z").getTime();
  const answers = Array.from({ length: 5 }, (_, index) =>
    createAnswer({
      questionId: `part5-${index}`,
      correct: index !== 2,
      answeredAt: new Date(base + index * 1000).toISOString(),
    }),
  );
  const metrics = deriveBadgeMetrics(createState(answers));

  assert.equal(metrics.perfectSessionCount, 0);
});

test("前半が苦手で直近が連続正解のタグを克服済みと判定する", () => {
  const base = new Date("2026-06-25T10:00:00.000Z").getTime();
  const pattern = [false, false, false, true, true, true, true, true];
  const answers = pattern.map((correct, index) =>
    createAnswer({
      questionId: `part5-${index}`,
      correct,
      tags: ["preposition"],
      answeredAt: new Date(base + index * 1000).toISOString(),
    }),
  );
  const metrics = deriveBadgeMetrics(createState(answers));

  assert.equal(metrics.overcameWeakTag, true);
});

test("最小回答数に満たないタグは克服済みと判定しない", () => {
  const base = new Date("2026-06-25T10:00:00.000Z").getTime();
  const pattern = [false, false, true, true, true, true, true];
  const answers = pattern.map((correct, index) =>
    createAnswer({
      questionId: `part5-${index}`,
      correct,
      tags: ["preposition"],
      answeredAt: new Date(base + index * 1000).toISOString(),
    }),
  );
  const metrics = deriveBadgeMetrics(createState(answers));

  assert.equal(metrics.overcameWeakTag, false);
});

test("前半の正答率が5割以上なら克服済みと判定しない", () => {
  const base = new Date("2026-06-25T10:00:00.000Z").getTime();
  const pattern = [true, true, false, true, true, true, true, true];
  const answers = pattern.map((correct, index) =>
    createAnswer({
      questionId: `part5-${index}`,
      correct,
      tags: ["preposition"],
      answeredAt: new Date(base + index * 1000).toISOString(),
    }),
  );
  const metrics = deriveBadgeMetrics(createState(answers));

  assert.equal(metrics.overcameWeakTag, false);
});

test("前半が苦手でも直近の連続正解が崩れていれば克服済みと判定しない", () => {
  const base = new Date("2026-06-25T10:00:00.000Z").getTime();
  // 前半は 0/4 で苦手だが、直近 5 問(index 3-7)に誤答(index 7)が混じる。
  const pattern = [false, false, false, false, true, true, true, false];
  const answers = pattern.map((correct, index) =>
    createAnswer({
      questionId: `part5-${index}`,
      correct,
      tags: ["preposition"],
      answeredAt: new Date(base + index * 1000).toISOString(),
    }),
  );
  const metrics = deriveBadgeMetrics(createState(answers));

  assert.equal(metrics.overcameWeakTag, false);
});

test("早朝・深夜の回答有無を時間帯で判定する", () => {
  const earlyState = createState([
    createAnswer({ answeredAt: isoAtLocalHour(6) }),
  ]);
  const lateState = createState([
    createAnswer({ answeredAt: isoAtLocalHour(23) }),
  ]);
  const dayState = createState([
    createAnswer({ answeredAt: isoAtLocalHour(14) }),
  ]);

  const earlyMetrics = deriveBadgeMetrics(earlyState);
  const lateMetrics = deriveBadgeMetrics(lateState);
  const dayMetrics = deriveBadgeMetrics(dayState);

  assert.equal(earlyMetrics.hasEarlyMorningAnswer, true);
  assert.equal(earlyMetrics.hasLateNightAnswer, false);
  assert.equal(lateMetrics.hasLateNightAnswer, true);
  assert.equal(lateMetrics.hasEarlyMorningAnswer, false);
  assert.equal(dayMetrics.hasEarlyMorningAnswer, false);
  assert.equal(dayMetrics.hasLateNightAnswer, false);
});
