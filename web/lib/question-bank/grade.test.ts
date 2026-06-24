import assert from "node:assert/strict";
import test from "node:test";
import type { FlatQuestion } from "./flatten.ts";
import { gradeQuestion } from "./grade.ts";

const question: FlatQuestion = {
  questionId: "q-001",
  entryId: "q-001",
  part: "part5",
  sentence: "The report was submitted on time.",
  prompt: "Choose the best answer.",
  choices: [
    { id: "A", text: "submit" },
    { id: "B", text: "submitted" },
    { id: "C", text: "submitting" },
    { id: "D", text: "submission" },
  ],
  correctChoiceId: "B",
  explanation: "受動態のため submitted が適切です。",
  difficulty: "easy",
  tags: ["passive"],
};

test("選択肢が正解と一致する場合は正解として採点する", () => {
  const result = gradeQuestion(
    question,
    "B",
    12000,
    "2026-06-24T10:00:00.000Z",
  );

  assert.equal(result.correct, true);
  assert.equal(result.correctChoiceId, "B");
  assert.equal(result.elapsedMs, 12000);
  assert.deepEqual(result.tags, ["passive"]);
});

test("選択肢が正解と異なる場合は不正解として採点する", () => {
  const result = gradeQuestion(
    question,
    "A",
    8000,
    "2026-06-24T10:00:00.000Z",
  );

  assert.equal(result.correct, false);
  assert.equal(result.correctChoiceId, "B");
});
