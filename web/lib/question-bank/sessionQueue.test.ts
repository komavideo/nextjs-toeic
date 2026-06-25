import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";
import part5Entries from "../../data/part5.json" with { type: "json" };
import part6Entries from "../../data/part6.json" with { type: "json" };
import part7Entries from "../../data/part7.json" with { type: "json" };
import type { AnswerResult, ProgressState } from "../../types/progress.ts";
import type { QuestionBankEntry, ToeicReadingPart } from "../../types/question.ts";
import type { FlatQuestion } from "./flatten.ts";

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

const { flattenQuestionBankEntries } = await import("./flatten.ts");
const {
  createPartSessionQueue,
  createQuickSessionQueue,
  createWeaknessSessionQueue,
} = await import("./sessionQueue.ts");

const questionBankEntriesByPart: Record<ToeicReadingPart, QuestionBankEntry[]> = {
  part5: part5Entries as QuestionBankEntry[],
  part6: part6Entries as QuestionBankEntry[],
  part7: part7Entries as QuestionBankEntry[],
};

const questionsByPart: Record<ToeicReadingPart, FlatQuestion[]> = {
  part5: flattenQuestionBankEntries(questionBankEntriesByPart.part5),
  part6: flattenQuestionBankEntries(questionBankEntriesByPart.part6),
  part7: flattenQuestionBankEntries(questionBankEntriesByPart.part7),
};

function firstQuestions(part: ToeicReadingPart, count: number): FlatQuestion[] {
  const questions = questionsByPart[part].slice(0, count);

  assert.equal(questions.length, count, `${part} のテスト用問題が必要です。`);

  return questions;
}

function findTagQuestions(
  part: ToeicReadingPart,
  count: number,
): { tag: string; questions: FlatQuestion[] } {
  const tagMap = new Map<string, FlatQuestion[]>();

  for (const question of questionsByPart[part]) {
    for (const tag of question.tags) {
      tagMap.set(tag, [...(tagMap.get(tag) ?? []), question]);
    }
  }

  const matched = Array.from(tagMap.entries()).find(
    ([, questions]) => questions.length >= count,
  );

  assert.ok(matched, `${part} に同一タグのテスト用問題が必要です。`);

  return {
    tag: matched[0],
    questions: matched[1].slice(0, count),
  };
}

function findQuestionsWithoutTag(
  part: ToeicReadingPart,
  tag: string,
  count: number,
): FlatQuestion[] {
  const questions = questionsByPart[part]
    .filter((question) => !question.tags.includes(tag))
    .slice(0, count);

  assert.equal(
    questions.length,
    count,
    `${part} に ${tag} 以外のテスト用問題が必要です。`,
  );

  return questions;
}

function createAnswer({
  question,
  correct,
  tags = question.tags,
}: {
  question: FlatQuestion;
  correct: boolean;
  tags?: string[];
}): AnswerResult {
  return {
    questionId: question.questionId,
    part: question.part,
    selectedChoiceId: "A",
    correct,
    answeredAt: "2026-06-24T10:00:00.000Z",
    elapsedMs: 10000,
    tags,
  };
}

function createProgressState(answers: AnswerResult[]): ProgressState {
  return {
    version: 1,
    totalAnswered: answers.length,
    totalCorrect: answers.filter((answer) => answer.correct).length,
    currentStreakDays: 1,
    lastStudiedDate: "2026-06-24",
    answers,
    srs: {},
  };
}

function toQuestionIds(questions: FlatQuestion[]): string[] {
  return questions.map((question) => question.questionId);
}

test("回答履歴が3件未満の場合はPart 5のクイック演習へフォールバックする", () => {
  const questions = firstQuestions("part6", 2);
  const state = createProgressState(
    questions.map((question) => createAnswer({ question, correct: false })),
  );

  assert.deepEqual(
    toQuestionIds(createWeaknessSessionQueue(state)),
    toQuestionIds(createQuickSessionQueue("part5")),
  );
});

test("Part別正答率の差に応じて最低正答率のPartを選ぶ", () => {
  const part5Questions = firstQuestions("part5", 2);
  const part6Questions = firstQuestions("part6", 2);
  const state = createProgressState([
    ...part5Questions.map((question) => createAnswer({ question, correct: true })),
    ...part6Questions.map((question) => createAnswer({ question, correct: false })),
  ]);

  assert.deepEqual(
    toQuestionIds(createWeaknessSessionQueue(state)),
    toQuestionIds(createPartSessionQueue({ part: "part6" })),
  );
});

test("回答3件以上では1件だけの最低正答率Partも候補にする", () => {
  const part5Questions = firstQuestions("part5", 2);
  const part6Questions = firstQuestions("part6", 1);
  const state = createProgressState([
    ...part5Questions.map((question) => createAnswer({ question, correct: true })),
    ...part6Questions.map((question) => createAnswer({ question, correct: false })),
  ]);

  assert.deepEqual(
    toQuestionIds(createWeaknessSessionQueue(state)),
    toQuestionIds(createPartSessionQueue({ part: "part6" })),
  );
});

test("タグ別正答率の差に応じて最低正答率のタグを選ぶ", () => {
  const { tag, questions: weakTagQuestions } = findTagQuestions("part5", 2);
  const otherQuestions = findQuestionsWithoutTag("part5", tag, 2);
  const state = createProgressState([
    ...weakTagQuestions.map((question) =>
      createAnswer({ question, correct: false, tags: [tag] }),
    ),
    ...otherQuestions.map((question) => createAnswer({ question, correct: true })),
  ]);

  assert.deepEqual(
    toQuestionIds(createWeaknessSessionQueue(state)),
    toQuestionIds(createPartSessionQueue({ part: "part5", tag })),
  );
});

test("対象タグの問題が存在しない場合は次の候補へフォールバックする", () => {
  const missingTag = "missing-tag-for-test";
  const questions = firstQuestions("part6", 3);
  const state = createProgressState([
    createAnswer({ question: questions[0], correct: false, tags: [missingTag] }),
    ...questions
      .slice(1)
      .map((question) => createAnswer({ question, correct: true })),
  ]);

  assert.deepEqual(
    toQuestionIds(createWeaknessSessionQueue(state)),
    toQuestionIds(createPartSessionQueue({ part: "part6" })),
  );
});

test("Part候補とTag候補が同率の場合はPart候補を優先する", () => {
  // 同一タグの2問と別タグの1問をすべて誤答にすると、回答3件以上の条件を満たしたうえで
  // Part5（全体）候補とタグ候補が正答率0%で同率になる。このときタグ絞り込みではなく
  // Part5 全体キューが選ばれること（同率時の Part 優先）を検証する。
  const { tag, questions } = findTagQuestions("part5", 2);
  const [otherQuestion] = findQuestionsWithoutTag("part5", tag, 1);
  const state = createProgressState([
    ...questions.map((question) => createAnswer({ question, correct: false })),
    createAnswer({ question: otherQuestion, correct: false }),
  ]);

  assert.deepEqual(
    toQuestionIds(createWeaknessSessionQueue(state)),
    toQuestionIds(createPartSessionQueue({ part: "part5" })),
  );
});
