import assert from "node:assert/strict";
import test from "node:test";
import part5Entries from "../../data/part5.json" with { type: "json" };
import part6Entries from "../../data/part6.json" with { type: "json" };
import part7Entries from "../../data/part7.json" with { type: "json" };
import type { AnswerResult, ProgressState } from "@/types/progress";
import type { QuestionBankEntry, ToeicReadingPart } from "@/types/question";
import { flattenQuestionBankEntries } from "../question-bank/flatten.ts";
import { createInitialProgressState } from "./initialState.ts";
import {
  calculateQuestionReach,
  type QuestionReachQuestion,
} from "./questionReach.ts";

const questionRefs: QuestionReachQuestion[] = flattenQuestionBankEntries([
  ...(part5Entries as QuestionBankEntry[]),
  ...(part6Entries as QuestionBankEntry[]),
  ...(part7Entries as QuestionBankEntry[]),
]).map((question) => ({
  questionId: question.questionId,
  part: question.part,
}));

function createAnswer(
  questionId: string,
  part: ToeicReadingPart,
): AnswerResult {
  return {
    questionId,
    part,
    selectedChoiceId: "A",
    correct: true,
    answeredAt: "2026-06-24T10:00:00.000Z",
    elapsedMs: 10000,
    tags: ["grammar"],
  };
}

function createProgressState(answers: AnswerResult[]): ProgressState {
  return {
    ...createInitialProgressState(),
    totalAnswered: answers.length,
    totalCorrect: answers.filter((answer) => answer.correct).length,
    answers,
  };
}

test("進捗なし状態では全体到達率を0件として集計する", () => {
  const summary = calculateQuestionReach(createInitialProgressState(), questionRefs);

  assert.equal(summary.total, 304);
  assert.equal(summary.answered, 0);
  assert.equal(summary.unanswered, 304);
  assert.equal(summary.mastered, 0);
  assert.equal(summary.answeredRate, 0);
});

test("同じ問題へ複数回回答しても回答済み数は1問として集計する", () => {
  const question = questionRefs[0];
  const state = createProgressState([
    createAnswer(question.questionId, question.part),
    createAnswer(question.questionId, question.part),
  ]);
  const summary = calculateQuestionReach(state, questionRefs);

  assert.equal(summary.answered, 1);
  assert.equal(summary.parts[0].answered, 1);
});

test("Part 6とPart 7はパッセージ数ではなく設問数で集計する", () => {
  const summary = calculateQuestionReach(createInitialProgressState(), questionRefs);

  assert.deepEqual(
    summary.parts.map((part) => [part.part, part.total]),
    [
      ["part5", 220],
      ["part6", 42],
      ["part7", 42],
    ],
  );
});

test("問題データ追加時は総数と未回答数が渡された問題参照に合わせて増える", () => {
  const extendedQuestionRefs: QuestionReachQuestion[] = [
    ...questionRefs,
    { questionId: "new-part5-question", part: "part5" },
  ];
  const summary = calculateQuestionReach(
    createInitialProgressState(),
    extendedQuestionRefs,
  );

  assert.equal(summary.total, 305);
  assert.equal(summary.unanswered, 305);
  assert.equal(summary.parts[0].total, 221);
});

test("回答済みでSRS予定がない問題だけを定着済みとして集計する", () => {
  const [masteredQuestion, scheduledQuestion] = questionRefs;
  const state: ProgressState = {
    ...createProgressState([
      createAnswer(masteredQuestion.questionId, masteredQuestion.part),
      createAnswer(scheduledQuestion.questionId, scheduledQuestion.part),
    ]),
    srs: {
      [scheduledQuestion.questionId]: {
        questionId: scheduledQuestion.questionId,
        intervalDays: 30,
        dueDate: "2026-07-24",
        correctStreak: 5,
        lastAnsweredAt: "2026-06-24T10:00:00.000Z",
      },
    },
  };
  const summary = calculateQuestionReach(state, questionRefs);

  assert.equal(summary.answered, 2);
  assert.equal(summary.mastered, 1);
  assert.equal(summary.parts[0].mastered, 1);
});
