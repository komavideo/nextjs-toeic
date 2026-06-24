import assert from "node:assert/strict";
import test from "node:test";
import type { ProgressState } from "@/types/progress";
import { getDueSrsItems } from "./due.ts";

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
