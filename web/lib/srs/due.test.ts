import assert from "node:assert/strict";
import test from "node:test";
import type { ProgressState, SrsState } from "@/types/progress";
import {
  getDueSrsItems,
  getSrsDueDateGroups,
  getSrsDueDateSummary,
} from "./due.ts";

function createSrsState(questionId: string, dueDate: string): SrsState {
  return {
    questionId,
    intervalDays: 1,
    dueDate,
    correctStreak: 0,
    lastAnsweredAt: "2026-06-24T10:00:00.000Z",
  };
}

test("今日以前の復習予定だけを期限到来として日付順に返す", () => {
  const srs: ProgressState["srs"] = {
    "q-003": {
      questionId: "q-003",
      intervalDays: 7,
      dueDate: "2026-06-24",
      correctStreak: 3,
      lastAnsweredAt: "2026-06-17T10:00:00.000Z",
    },
    "q-001": {
      questionId: "q-001",
      intervalDays: 1,
      dueDate: "2026-06-23",
      correctStreak: 1,
      lastAnsweredAt: "2026-06-22T10:00:00.000Z",
    },
    "q-002": {
      questionId: "q-002",
      intervalDays: 3,
      dueDate: "2026-06-25",
      correctStreak: 2,
      lastAnsweredAt: "2026-06-22T10:00:00.000Z",
    },
  };

  const dueItems = getDueSrsItems(srs, "2026-06-24");

  assert.deepEqual(
    dueItems.map((item) => item.questionId),
    ["q-001", "q-003"],
  );
});

test("SRS復習予定を期限切れ、今日、明日以降に分類する", () => {
  const srs: ProgressState["srs"] = {
    "q-003": createSrsState("q-003", "2026-06-25"),
    "q-001": createSrsState("q-001", "2026-06-23"),
    "q-004": createSrsState("q-004", "2026-07-24"),
    "q-002": createSrsState("q-002", "2026-06-24"),
  };

  const groups = getSrsDueDateGroups(srs, "2026-06-24");

  assert.deepEqual(
    groups.overdue.map((item) => item.questionId),
    ["q-001"],
  );
  assert.deepEqual(
    groups.today.map((item) => item.questionId),
    ["q-002"],
  );
  assert.deepEqual(
    groups.future.map((item) => item.questionId),
    ["q-003", "q-004"],
  );
});

test("日付キーを文字列のまま比較し、明日以降を期限到来に含めない", () => {
  const srs: ProgressState["srs"] = {
    "q-001": createSrsState("q-001", "2026-06-24"),
    "q-002": createSrsState("q-002", "2026-06-25"),
  };

  assert.deepEqual(
    getDueSrsItems(srs, "2026-06-24").map((item) => item.questionId),
    ["q-001"],
  );
});

test("SRS期限サマリーは復習開始可否と予定総数を返す", () => {
  const emptySummary = getSrsDueDateSummary({
    overdue: [],
    today: [],
    future: [],
  });
  const futureOnlySummary = getSrsDueDateSummary({
    overdue: [],
    today: [],
    future: [createSrsState("q-001", "2026-06-25")],
  });
  const dueSummary = getSrsDueDateSummary({
    overdue: [createSrsState("q-002", "2026-06-23")],
    today: [createSrsState("q-003", "2026-06-24")],
    future: [createSrsState("q-004", "2026-06-25")],
  });

  assert.deepEqual(emptySummary, {
    counts: { overdue: 0, today: 0, future: 0 },
    dueCount: 0,
    scheduledCount: 0,
    hasDueItems: false,
    hasScheduledItems: false,
  });
  assert.deepEqual(futureOnlySummary, {
    counts: { overdue: 0, today: 0, future: 1 },
    dueCount: 0,
    scheduledCount: 1,
    hasDueItems: false,
    hasScheduledItems: true,
  });
  assert.deepEqual(dueSummary, {
    counts: { overdue: 1, today: 1, future: 1 },
    dueCount: 2,
    scheduledCount: 3,
    hasDueItems: true,
    hasScheduledItems: true,
  });
});
