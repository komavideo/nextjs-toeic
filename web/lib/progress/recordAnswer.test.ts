import assert from "node:assert/strict";
import test from "node:test";
import type { AnswerResult } from "@/types/progress";
import { createInitialProgressState } from "./initialState.ts";
import { recordAnswer } from "./recordAnswer.ts";

function createAnswer(answeredAt: string, correct = true): AnswerResult {
  return {
    questionId: "q-001",
    part: "part5",
    selectedChoiceId: "A",
    correct,
    answeredAt,
    elapsedMs: 10000,
    tags: ["word-form"],
  };
}

test("初回回答を合計・正答数・学習日に反映する", () => {
  const answeredAt = new Date(2026, 5, 24, 0, 30).toISOString();
  const nextState = recordAnswer(
    createInitialProgressState(),
    createAnswer(answeredAt),
  );

  assert.equal(nextState.totalAnswered, 1);
  assert.equal(nextState.totalCorrect, 1);
  assert.equal(nextState.currentStreakDays, 1);
  assert.equal(nextState.lastStudiedDate, "2026-06-24");
  assert.equal(nextState.answers.length, 1);
});

test("同じローカル日付の複数回答では連続学習日数を増やさない", () => {
  const firstAnsweredAt = new Date(2026, 5, 24, 0, 30).toISOString();
  const secondAnsweredAt = new Date(2026, 5, 24, 8, 30).toISOString();
  const firstState = recordAnswer(
    createInitialProgressState(),
    createAnswer(firstAnsweredAt),
  );
  const secondState = recordAnswer(
    firstState,
    createAnswer(secondAnsweredAt, false),
  );

  assert.equal(secondState.totalAnswered, 2);
  assert.equal(secondState.totalCorrect, 1);
  assert.equal(secondState.currentStreakDays, 1);
  assert.equal(secondState.lastStudiedDate, "2026-06-24");
});

test("翌日の回答では連続学習日数を増やす", () => {
  const firstAnsweredAt = new Date(2026, 5, 24, 23, 0).toISOString();
  const secondAnsweredAt = new Date(2026, 5, 25, 7, 0).toISOString();
  const firstState = recordAnswer(
    createInitialProgressState(),
    createAnswer(firstAnsweredAt),
  );
  const secondState = recordAnswer(firstState, createAnswer(secondAnsweredAt));

  assert.equal(secondState.currentStreakDays, 2);
  assert.equal(secondState.lastStudiedDate, "2026-06-25");
});

test("学習していない日を挟んだ回答では連続学習日数を1日に戻す", () => {
  const firstState = recordAnswer(
    createInitialProgressState(),
    createAnswer(new Date(2026, 5, 24, 10, 0).toISOString()),
  );
  const secondState = recordAnswer(
    firstState,
    createAnswer(new Date(2026, 5, 26, 10, 0).toISOString()),
  );

  assert.equal(secondState.currentStreakDays, 1);
  assert.equal(secondState.lastStudiedDate, "2026-06-26");
});
