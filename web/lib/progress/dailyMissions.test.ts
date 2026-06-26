import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";
import part5Entries from "../../data/part5.json" with { type: "json" };
import part6Entries from "../../data/part6.json" with { type: "json" };
import part7Entries from "../../data/part7.json" with { type: "json" };
import type { AnswerResult, ProgressState } from "@/types/progress";
import type { QuestionBankEntry, ToeicReadingPart } from "@/types/question";
import { flattenQuestionBankEntries } from "../question-bank/flatten.ts";
import { createInitialProgressState } from "./initialState.ts";
import { createDailyMissions, questionCountsByPart } from "./dailyMissions.ts";

// node:test で sessionQueue を直接確認するため、テスト内で tsconfig の `@/` alias を解決する。
const webRootUrl = new URL("../../", import.meta.url);
const aliasLoaderCode = `
const webRootUrl = ${JSON.stringify(webRootUrl.href)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const path = specifier.slice(2);

    return {
      shortCircuit: true,
      url: new URL(path.endsWith(".json") ? path : path + ".ts", webRootUrl).href,
    };
  }

  return nextResolve(specifier, context);
}
`;
register(`data:text/javascript,${encodeURIComponent(aliasLoaderCode)}`, import.meta.url);

const { createPartSessionQueue } = await import("../question-bank/sessionQueue.ts");

const questionBankEntriesByPart: Record<ToeicReadingPart, QuestionBankEntry[]> = {
  part5: part5Entries as QuestionBankEntry[],
  part6: part6Entries as QuestionBankEntry[],
  part7: part7Entries as QuestionBankEntry[],
};

const questionsByPart = {
  part5: flattenQuestionBankEntries(questionBankEntriesByPart.part5),
  part6: flattenQuestionBankEntries(questionBankEntriesByPart.part6),
  part7: flattenQuestionBankEntries(questionBankEntriesByPart.part7),
};

function firstQuestion(part: ToeicReadingPart) {
  const question = questionsByPart[part][0];

  assert.ok(question, `${part} のテスト用問題が必要です。`);

  return question;
}

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

test("未回答数の軽量メタデータは問題データの設問数と一致する", () => {
  assert.deepEqual(questionCountsByPart, {
    part5: questionsByPart.part5.length,
    part6: questionsByPart.part6.length,
    part7: questionsByPart.part7.length,
  });
});

test("復習期限がある場合は復習ミッションを最優先にする", () => {
  const question = firstQuestion("part5");
  const state: ProgressState = {
    ...createProgressState([
      createAnswer({
        questionId: question.questionId,
        part: "part5",
        correct: false,
        tags: question.tags,
      }),
    ]),
    srs: {
      [question.questionId]: {
        questionId: question.questionId,
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
  const part5Question = firstQuestion("part5");
  const part6Question = firstQuestion("part6");
  const part7Question = firstQuestion("part7");
  const state = createProgressState([
    createAnswer({
      questionId: part5Question.questionId,
      part: "part5",
      correct: true,
      tags: part5Question.tags,
    }),
    createAnswer({
      questionId: part6Question.questionId,
      part: "part6",
      correct: false,
      tags: part6Question.tags,
    }),
    createAnswer({
      questionId: part7Question.questionId,
      part: "part7",
      correct: true,
      tags: part7Question.tags,
    }),
  ]);
  const missions = createDailyMissions(state, "2026-06-25");

  assert.equal(missions[0].kind, "weak-part");
  assert.equal(missions[0].href, "/practice?mode=part&part=part6");
});

test("苦手タグのミッションはタグ付きのPart演習へ直接つなぐ", () => {
  const part5Question = firstQuestion("part5");
  const part6Question = firstQuestion("part6");
  const weakTag = part5Question.tags[0];
  const otherTag = part6Question.tags[0];
  const state = createProgressState([
    createAnswer({
      questionId: part5Question.questionId,
      part: "part5",
      correct: false,
      tags: [weakTag],
    }),
    createAnswer({
      questionId: part6Question.questionId,
      part: "part6",
      correct: true,
      tags: [otherTag],
    }),
  ]);
  const missions = createDailyMissions(state, "2026-06-25");
  const tagMission = missions.find((mission) => mission.kind === "weak-tag");
  const searchParams = new URLSearchParams({ tag: weakTag });

  assert.equal(
    tagMission?.href,
    `/practice?mode=part&part=part5&${searchParams.toString()}`,
  );
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

test("候補が4種そろっても最大3件で復習を先頭にし未回答ミッションを除外する", () => {
  // 復習・苦手Part・苦手タグ・未回答の4候補が同時に成立する状態を作る。
  const part5Question = firstQuestion("part5");
  const part6Question = firstQuestion("part6");
  const part7Question = firstQuestion("part7");
  const state: ProgressState = {
    ...createProgressState([
      createAnswer({
        questionId: part5Question.questionId,
        part: "part5",
        correct: true,
        tags: part5Question.tags,
      }),
      createAnswer({
        questionId: part6Question.questionId,
        part: "part6",
        correct: false,
        tags: part6Question.tags,
      }),
      createAnswer({
        questionId: part7Question.questionId,
        part: "part7",
        correct: true,
        tags: part7Question.tags,
      }),
    ]),
    srs: {
      [part5Question.questionId]: {
        questionId: part5Question.questionId,
        intervalDays: 1,
        dueDate: "2026-06-24",
        correctStreak: 0,
        lastAnsweredAt: "2026-06-24T10:00:00.000Z",
      },
    },
  };
  const missions = createDailyMissions(state, "2026-06-25");

  assert.equal(missions.length, 3);
  assert.equal(missions[0].kind, "review");
  assert.equal(missions.some((mission) => mission.kind === "unanswered"), false);
});

test("未回答ミッションは未回答優先導線で既回答より未回答を先に出す", () => {
  const question = firstQuestion("part5");
  const state = createProgressState([
    createAnswer({
      questionId: question.questionId,
      part: "part5",
      correct: false,
      tags: question.tags,
    }),
  ]);
  const missions = createDailyMissions(state, "2026-06-25");
  const unansweredMission = missions.find(
    (mission) => mission.kind === "unanswered",
  );

  assert.ok(unansweredMission);

  const searchParams = new URLSearchParams(unansweredMission.href.split("?")[1]);
  const part = searchParams.get("part") as ToeicReadingPart;
  const expectedUnansweredQuestion = questionsByPart.part5.find(
    (item) => item.questionId !== question.questionId,
  );
  const queue = createPartSessionQueue({
    part,
    progressState: state,
  });

  assert.ok(expectedUnansweredQuestion);
  assert.equal(unansweredMission.href, "/practice?mode=part&part=part5&unanswered=1");
  assert.equal(searchParams.get("unanswered"), "1");
  assert.equal(queue.length, 5);
  assert.equal(queue[0].questionId, expectedUnansweredQuestion.questionId);
});
