import assert from "node:assert/strict";
import test from "node:test";
import { updateSrsState } from "./updateSrs.ts";

test("初回正解では1日後に復習予定を作る", () => {
  const answeredAt = new Date(2026, 5, 24, 0, 30).toISOString();
  const result = updateSrsState({
    questionId: "q-001",
    correct: true,
    answeredAt,
  });

  assert.equal(result.status, "scheduled");

  if (result.status === "scheduled") {
    assert.equal(result.state.intervalDays, 1);
    assert.equal(result.state.dueDate, "2026-06-25");
    assert.equal(result.state.correctStreak, 1);
  }
});

test("正解時はSRS間隔を1日、3日、7日、14日、30日の順に進める", () => {
  const cases = [
    {
      currentIntervalDays: 1,
      currentStreak: 1,
      expectedIntervalDays: 3,
      expectedDueDate: "2026-06-27",
    },
    {
      currentIntervalDays: 3,
      currentStreak: 2,
      expectedIntervalDays: 7,
      expectedDueDate: "2026-07-01",
    },
    {
      currentIntervalDays: 7,
      currentStreak: 3,
      expectedIntervalDays: 14,
      expectedDueDate: "2026-07-08",
    },
    {
      currentIntervalDays: 14,
      currentStreak: 4,
      expectedIntervalDays: 30,
      expectedDueDate: "2026-07-24",
    },
  ] as const;

  for (const testCase of cases) {
    const result = updateSrsState({
      questionId: "q-001",
      correct: true,
      answeredAt: new Date(2026, 5, 24, 10, 0).toISOString(),
      currentState: {
        questionId: "q-001",
        intervalDays: testCase.currentIntervalDays,
        dueDate: "2026-06-24",
        correctStreak: testCase.currentStreak,
        lastAnsweredAt: "2026-06-17T10:00:00.000Z",
      },
    });

    assert.equal(result.status, "scheduled");

    if (result.status === "scheduled") {
      assert.equal(result.state.intervalDays, testCase.expectedIntervalDays);
      assert.equal(result.state.dueDate, testCase.expectedDueDate);
      assert.equal(result.state.correctStreak, testCase.currentStreak + 1);
    }
  }
});

test("不正解時は1日間隔と連続正解数0に戻す", () => {
  const result = updateSrsState({
    questionId: "q-001",
    correct: false,
    answeredAt: "2026-06-24T10:00:00.000Z",
    currentState: {
      questionId: "q-001",
      intervalDays: 14,
      dueDate: "2026-06-24",
      correctStreak: 4,
      lastAnsweredAt: "2026-06-10T10:00:00.000Z",
    },
  });

  assert.equal(result.status, "scheduled");

  if (result.status === "scheduled") {
    assert.equal(result.state.intervalDays, 1);
    assert.equal(result.state.correctStreak, 0);
    assert.equal(result.state.dueDate, "2026-06-25");
  }
});

test("30日間隔で正解した問題は定着済みにする", () => {
  const result = updateSrsState({
    questionId: "q-001",
    correct: true,
    answeredAt: "2026-06-24T10:00:00.000Z",
    currentState: {
      questionId: "q-001",
      intervalDays: 30,
      dueDate: "2026-06-24",
      correctStreak: 5,
      lastAnsweredAt: "2026-05-25T10:00:00.000Z",
    },
  });

  assert.deepEqual(result, { status: "mastered", questionId: "q-001" });
});
