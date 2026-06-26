import assert from "node:assert/strict";
import test from "node:test";
import type { AnswerResult } from "@/types/progress";
import {
  calculateRecentDailyAnswerCounts,
  calculateTagDetailStatistic,
  type TagDetailQuestion,
} from "./statistics.ts";

function createAnswer(
  answeredAt: string,
  overrides: Partial<AnswerResult> = {},
): AnswerResult {
  return {
    questionId: `q-${answeredAt}`,
    part: "part5",
    selectedChoiceId: "A",
    correct: true,
    answeredAt,
    elapsedMs: 10000,
    tags: ["word-form"],
    ...overrides,
  };
}

test("既定では今日を含む直近7日の回答数を古い日付から集計する", () => {
  const today = new Date(2026, 5, 26, 12, 0);
  const answers = [
    createAnswer(new Date(2026, 5, 24, 9, 0).toISOString()),
    createAnswer(new Date(2026, 5, 24, 21, 0).toISOString()),
    createAnswer(new Date(2026, 5, 26, 8, 0).toISOString()),
  ];

  assert.deepEqual(calculateRecentDailyAnswerCounts(answers, today), [
    { date: "2026-06-20", count: 0 },
    { date: "2026-06-21", count: 0 },
    { date: "2026-06-22", count: 0 },
    { date: "2026-06-23", count: 0 },
    { date: "2026-06-24", count: 2 },
    { date: "2026-06-25", count: 0 },
    { date: "2026-06-26", count: 1 },
  ]);
});

test("任意の日数で今日を含む範囲を集計する", () => {
  const today = new Date(2026, 0, 3, 12, 0);
  const answers = [
    createAnswer(new Date(2025, 11, 7, 10, 0).toISOString()),
    createAnswer(new Date(2025, 11, 31, 22, 0).toISOString()),
    createAnswer(new Date(2026, 0, 1, 8, 0).toISOString()),
    createAnswer(new Date(2026, 0, 3, 7, 0).toISOString()),
  ];
  const counts = calculateRecentDailyAnswerCounts(answers, today, 28);

  assert.equal(counts.length, 28);
  assert.deepEqual(counts[0], { date: "2025-12-07", count: 1 });
  assert.deepEqual(counts[24], { date: "2025-12-31", count: 1 });
  assert.deepEqual(counts[25], { date: "2026-01-01", count: 1 });
  assert.deepEqual(counts[27], { date: "2026-01-03", count: 1 });
});

test("回答履歴が空でも指定日数分の空状態を返す", () => {
  const today = new Date(2026, 5, 26, 12, 0);
  const counts = calculateRecentDailyAnswerCounts([], today, 28);

  assert.equal(counts.length, 28);
  assert.equal(counts[0].date, "2026-05-30");
  assert.equal(counts[27].date, "2026-06-26");
  assert.equal(counts.every((item) => item.count === 0), true);
});

test("タグ詳細は複数Partの回答数と最弱Partを集計する", () => {
  const tag = "grammar";
  const questions: TagDetailQuestion[] = [
    {
      questionId: "p5-1",
      part: "part5",
      sentence: "The report was reviewed carefully.",
      prompt: "Choose the correct word.",
      tags: [tag],
    },
    {
      questionId: "p6-1",
      part: "part6",
      title: "Office notice",
      prompt: "What is the purpose of the notice?",
      tags: [tag],
    },
  ];
  const answers = [
    createAnswer("2026-06-24T09:00:00.000Z", {
      questionId: "p5-1",
      part: "part5",
      correct: true,
      tags: [tag],
    }),
    createAnswer("2026-06-24T10:00:00.000Z", {
      questionId: "p5-2",
      part: "part5",
      correct: false,
      tags: [tag],
    }),
    createAnswer("2026-06-24T11:00:00.000Z", {
      questionId: "p6-1",
      part: "part6",
      correct: false,
      tags: [tag],
    }),
    createAnswer("2026-06-24T12:00:00.000Z", {
      questionId: "p6-2",
      part: "part6",
      correct: false,
      tags: [tag],
    }),
    createAnswer("2026-06-24T13:00:00.000Z", {
      questionId: "p7-1",
      part: "part7",
      correct: false,
      tags: ["other"],
    }),
  ];

  const detail = calculateTagDetailStatistic(answers, questions, tag);

  assert.equal(detail.answered, 4);
  assert.equal(detail.correct, 1);
  assert.equal(detail.accuracy, 25);
  assert.deepEqual(detail.partStatistics, [
    { part: "part5", answered: 2, correct: 1, accuracy: 50 },
    { part: "part6", answered: 2, correct: 0, accuracy: 0 },
    { part: "part7", answered: 0, correct: 0, accuracy: 0 },
  ]);
  assert.equal(detail.weakestPart, "part6");
  assert.equal(detail.firstAvailablePart, "part5");
  assert.equal(detail.practicePart, "part6");
  assert.deepEqual(detail.relatedParts, ["part5", "part6"]);
});

test("タグ詳細の誤答履歴は直近5件を設問概要付きで返す", () => {
  const tag = "preposition";
  const questions: TagDetailQuestion[] = [
    {
      questionId: "q-6",
      part: "part6",
      title: "Travel policy",
      prompt: "Choose the best sentence.",
      tags: [tag],
    },
  ];
  const answers = Array.from({ length: 6 }, (_, index) =>
    createAnswer(`2026-06-24T0${index}:00:00.000Z`, {
      questionId: `q-${index + 1}`,
      part: "part6",
      correct: false,
      tags: [tag],
    }),
  );

  const detail = calculateTagDetailStatistic(answers, questions, tag);

  assert.deepEqual(
    detail.incorrectAnswers.map((answer) => answer.questionId),
    ["q-6", "q-5", "q-4", "q-3", "q-2"],
  );
  assert.equal(detail.incorrectAnswers[0].summary, "Travel policy");
});

test("タグ詳細は回答履歴と誤答履歴がない場合に空状態を返す", () => {
  const tag = "句動詞 / A&B";
  const questions: TagDetailQuestion[] = [
    {
      questionId: "p7-1",
      part: "part7",
      prompt: "What is implied in the email?",
      tags: [tag],
    },
  ];

  const detail = calculateTagDetailStatistic([], questions, tag);

  assert.equal(detail.answered, 0);
  assert.equal(detail.correct, 0);
  assert.equal(detail.accuracy, 0);
  assert.equal(detail.weakestPart, undefined);
  assert.equal(detail.firstAvailablePart, "part7");
  assert.equal(detail.practicePart, "part7");
  assert.deepEqual(detail.relatedParts, ["part7"]);
  assert.deepEqual(detail.incorrectAnswers, []);
});

test("タグ詳細は最弱Partに現行問題がない場合に練習可能なPartへフォールバックする", () => {
  const tag = "stale-tag";
  const questions: TagDetailQuestion[] = [
    {
      questionId: "p5-1",
      part: "part5",
      sentence: "The invoice was attached.",
      prompt: "Choose the best word.",
      tags: [tag],
    },
  ];
  const answers = [
    createAnswer("2026-06-24T09:00:00.000Z", {
      questionId: "old-p6-1",
      part: "part6",
      correct: false,
      tags: [tag],
    }),
    createAnswer("2026-06-24T10:00:00.000Z", {
      questionId: "p5-1",
      part: "part5",
      correct: true,
      tags: [tag],
    }),
  ];

  const detail = calculateTagDetailStatistic(answers, questions, tag);

  assert.equal(detail.weakestPart, "part6");
  assert.equal(detail.firstAvailablePart, "part5");
  assert.equal(detail.practicePart, "part5");
});

test("タグ詳細は現行問題に該当タグがない場合は練習対象を持たない", () => {
  const tag = "removed-tag";
  const questions: TagDetailQuestion[] = [
    {
      questionId: "p5-1",
      part: "part5",
      sentence: "The invoice was attached.",
      prompt: "Choose the best word.",
      tags: ["other"],
    },
  ];
  const answers = [
    createAnswer("2026-06-24T09:00:00.000Z", {
      questionId: "old-p6-1",
      part: "part6",
      correct: false,
      tags: [tag],
    }),
  ];

  const detail = calculateTagDetailStatistic(answers, questions, tag);

  assert.equal(detail.answered, 1);
  assert.deepEqual(detail.relatedParts, []);
  assert.equal(detail.firstAvailablePart, undefined);
  assert.equal(detail.practicePart, undefined);
});

test("タグ詳細の誤答概要は設問が見つからなければ questionId、prompt のみなら prompt を使う", () => {
  const tag = "fallback-tag";
  const questions: TagDetailQuestion[] = [
    {
      questionId: "p7-1",
      part: "part7",
      prompt: "Read the passage and answer.",
      tags: [tag],
    },
  ];
  const answers = [
    createAnswer("2026-06-24T09:00:00.000Z", {
      questionId: "p7-1",
      part: "part7",
      correct: false,
      tags: [tag],
    }),
    createAnswer("2026-06-24T08:00:00.000Z", {
      questionId: "deleted-1",
      part: "part7",
      correct: false,
      tags: [tag],
    }),
  ];

  const detail = calculateTagDetailStatistic(answers, questions, tag);

  // 直近順に並ぶ: p7-1(09:00) は prompt フォールバック、deleted-1(08:00) は設問が無く questionId フォールバック。
  assert.equal(detail.incorrectAnswers[0].summary, "Read the passage and answer.");
  assert.equal(detail.incorrectAnswers[1].summary, "deleted-1");
});
