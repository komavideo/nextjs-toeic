import assert from "node:assert/strict";
import test from "node:test";
import type { AnswerResult } from "@/types/progress";
import { calculateRecentDailyAnswerCounts } from "./statistics.ts";

function createAnswer(answeredAt: string): AnswerResult {
  return {
    questionId: `q-${answeredAt}`,
    part: "part5",
    selectedChoiceId: "A",
    correct: true,
    answeredAt,
    elapsedMs: 10000,
    tags: ["word-form"],
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
