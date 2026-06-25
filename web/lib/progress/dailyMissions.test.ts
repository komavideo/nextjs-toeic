import assert from "node:assert/strict";
import test from "node:test";
import part5Entries from "../../data/part5.json" with { type: "json" };
import part6Entries from "../../data/part6.json" with { type: "json" };
import part7Entries from "../../data/part7.json" with { type: "json" };
import type { AnswerResult, ProgressState } from "@/types/progress";
import type { QuestionBankEntry, ToeicReadingPart } from "@/types/question";
import { flattenQuestionBankEntries } from "../question-bank/flatten.ts";
import { createInitialProgressState } from "./initialState.ts";
import { createDailyMissions } from "./dailyMissions.ts";

function createAnswer({
  questionId,
  part,
  correct,
  tags = ["grammar"],
}: {
  questionId: string;
  part: ToeicReadingPart;
  correct: boolean;
  tags?: string[];
}): AnswerResult {
  return {
    questionId,
    part,
    selectedChoiceId: "A",
    correct,
    answeredAt: "2026-06-24T10:00:00.000Z",
    elapsedMs: 10000,
    tags,
  };
}

function createProgressState(answers: AnswerResult[]): ProgressState {
  return {
    ...createInitialProgressState(),
    answers,
    totalAnswered: answers.length,
    totalCorrect: answers.filter((answer) => answer.correct).length,
  };
}

test("進捗がない場合はPart 5の5問クイックを促す", () => {
  const missions = createDailyMissions(createInitialProgressState(), "2026-06-25");

  assert.equal(missions.length, 1);
  assert.equal(missions[0].kind, "quick");
  assert.equal(missions[0].href, "/practice?mode=quick&part=part5");
});

test("復習期限がある場合は復習ミッションを最優先にする", () => {
  const state: ProgressState = {
    ...createProgressState([
      createAnswer({
        questionId: "part5-001",
        part: "part5",
        correct: false,
      }),
    ]),
    srs: {
      "part5-001": {
        questionId: "part5-001",
        intervalDays: 1,
        dueDate: "2026-06-24",
        correctStreak: 0,
        lastAnsweredAt: "2026-06-24T10:00:00.000Z",
      },
    },
  };
  const missions = createDailyMissions(state, "2026-06-25");

  assert.equal(missions[0].kind, "review");
  assert.equal(missions[0].href, "/practice?mode=review");
});

test("復習期限がない場合は苦手Partを未回答Partより優先する", () => {
  const state = createProgressState([
    createAnswer({
      questionId: "part5-001",
      part: "part5",
      correct: true,
    }),
    createAnswer({
      questionId: "part6-001-1",
      part: "part6",
      correct: false,
    }),
    createAnswer({
      questionId: "part7-001-1",
      part: "part7",
      correct: true,
    }),
  ]);
  const missions = createDailyMissions(state, "2026-06-25");

  assert.equal(missions[0].kind, "weak-part");
  assert.equal(missions[0].href, "/practice?mode=part&part=part6");
});

test("苦手タグのミッションはタグ付きのPart演習へ直接つなぐ", () => {
  const state = createProgressState([
    createAnswer({
      questionId: "part5-001",
      part: "part5",
      correct: false,
      tags: ["word form"],
    }),
    createAnswer({
      questionId: "part6-001-1",
      part: "part6",
      correct: true,
      tags: ["context"],
    }),
  ]);
  const missions = createDailyMissions(state, "2026-06-25");
  const tagMission = missions.find((mission) => mission.kind === "weak-tag");

  assert.equal(tagMission?.href, "/practice?mode=part&part=part5&tag=word+form");
});

test("全問回答済みで未回答Partがない場合は未回答ミッションを出さない", () => {
  const allEntries = [
    ...(part5Entries as QuestionBankEntry[]),
    ...(part6Entries as QuestionBankEntry[]),
    ...(part7Entries as QuestionBankEntry[]),
  ];
  const allQuestions = flattenQuestionBankEntries(allEntries);
  const answers = allQuestions.map((question) =>
    createAnswer({
      questionId: question.questionId,
      part: question.part,
      correct: true,
      tags: question.tags,
    }),
  );
  const missions = createDailyMissions(createProgressState(answers), "2026-06-25");

  assert.equal(missions[0].kind, "weak-part");
  assert.equal(missions.some((mission) => mission.kind === "unanswered"), false);
});
