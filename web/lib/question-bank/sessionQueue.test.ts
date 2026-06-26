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
  createBookmarkSessionQueue,
  createPartSessionQueue,
  createQuickSessionQueue,
  createReviewSessionQueue,
  createWeaknessSessionQueue,
  getSessionQuestionCountForPart,
  parseSessionQuestionCount,
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

function findLimitedTagQuestions(
  part: ToeicReadingPart,
  maxCount: number,
): { tag: string; questions: FlatQuestion[] } {
  const tagMap = new Map<string, FlatQuestion[]>();

  for (const question of questionsByPart[part]) {
    for (const tag of question.tags) {
      tagMap.set(tag, [...(tagMap.get(tag) ?? []), question]);
    }
  }

  const matched = Array.from(tagMap.entries()).find(
    ([, questions]) => questions.length > 0 && questions.length <= maxCount,
  );

  assert.ok(
    matched,
    `${part} に ${maxCount} 問以下の同一タグ問題が必要です。`,
  );

  return {
    tag: matched[0],
    questions: matched[1],
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
  answeredAt = "2026-06-24T10:00:00.000Z",
  tags = question.tags,
}: {
  question: FlatQuestion;
  correct: boolean;
  answeredAt?: string;
  tags?: string[];
}): AnswerResult {
  return {
    questionId: question.questionId,
    part: question.part,
    selectedChoiceId: "A",
    correct,
    answeredAt,
    elapsedMs: 10000,
    tags,
  };
}

function createProgressState(
  answers: AnswerResult[],
  srs: ProgressState["srs"] = {},
): ProgressState {
  return {
    version: 2,
    totalAnswered: answers.length,
    totalCorrect: answers.filter((answer) => answer.correct).length,
    currentStreakDays: 1,
    lastStudiedDate: "2026-06-24",
    answers,
    srs,
    bookmarkedQuestionIds: [],
  };
}

function createSrsState(
  question: FlatQuestion,
  dueDate: string,
): ProgressState["srs"][string] {
  return {
    questionId: question.questionId,
    intervalDays: 1,
    dueDate,
    correctStreak: 0,
    lastAnsweredAt: "2026-06-24T10:00:00.000Z",
  };
}

function toQuestionIds(questions: FlatQuestion[]): string[] {
  return questions.map((question) => question.questionId);
}

test("回答履歴がない場合は既存順と同等に出題する", () => {
  const state = createProgressState([]);

  assert.deepEqual(
    toQuestionIds(createQuickSessionQueue("part5", { progressState: state })),
    toQuestionIds(createQuickSessionQueue("part5")),
  );
});

test("一部回答済みの場合はPart 5の未回答問題を先に並べる", () => {
  const questions = firstQuestions("part5", 6);
  const state = createProgressState([
    createAnswer({ question: questions[0], correct: true }),
  ]);

  assert.deepEqual(
    toQuestionIds(createPartSessionQueue({ part: "part5", progressState: state })),
    toQuestionIds(questions.slice(1, 6)),
  );
});

test("Part 5クイックは指定した出題数でキューを作成する", () => {
  assert.deepEqual(
    toQuestionIds(createQuickSessionQueue("part5", { questionCount: 3 })),
    toQuestionIds(firstQuestions("part5", 3)),
  );
  assert.deepEqual(
    toQuestionIds(createQuickSessionQueue("part5", { questionCount: 10 })),
    toQuestionIds(firstQuestions("part5", 10)),
  );
});

test("出題数指定は有効な値だけを採用し、Part 5にだけ適用する", () => {
  assert.equal(parseSessionQuestionCount("3"), 3);
  assert.equal(parseSessionQuestionCount("10"), 10);
  assert.equal(parseSessionQuestionCount("999"), 5);
  assert.equal(parseSessionQuestionCount("invalid"), 5);
  assert.equal(parseSessionQuestionCount(null), 5);
  assert.equal(getSessionQuestionCountForPart("part5", 10), 10);
  assert.equal(getSessionQuestionCountForPart("part5"), 5);
  assert.equal(getSessionQuestionCountForPart("part6", 10), undefined);
  assert.equal(getSessionQuestionCountForPart("part7", 3), undefined);
});

test("Part 5のPart指定セッションは指定した出題数でキューを作成する", () => {
  const queue = createPartSessionQueue({ part: "part5", questionCount: 10 });

  assert.equal(queue.length, 10);
  assert.deepEqual(toQuestionIds(queue), toQuestionIds(firstQuestions("part5", 10)));
});

test("全問回答済みの場合も回答済み問題で補完しキューを空にしない", () => {
  const state = createProgressState(
    questionsByPart.part5.map((question) =>
      createAnswer({ question, correct: true }),
    ),
  );
  const queue = createPartSessionQueue({ part: "part5", progressState: state });

  assert.equal(queue.length, 5);
  assert.deepEqual(
    toQuestionIds(queue),
    toQuestionIds(firstQuestions("part5", 5)),
  );
});

test("SRS期限到来問題は誤答履歴あり問題より優先される", () => {
  const questions = questionsByPart.part5;
  const dueQuestion = questions[2];
  const incorrectQuestion = questions[1];
  const state = createProgressState(
    questions.map((question) =>
      createAnswer({
        question,
        correct: question.questionId !== incorrectQuestion.questionId,
      }),
    ),
    {
      [dueQuestion.questionId]: createSrsState(dueQuestion, "2026-06-24"),
    },
  );
  const queue = createPartSessionQueue({
    part: "part5",
    progressState: state,
    today: "2026-06-25",
  });

  assert.equal(queue[0].questionId, dueQuestion.questionId);
  assert.equal(queue[1].questionId, incorrectQuestion.questionId);
});

test("未回答優先で不足する場合は回答済み問題で補完する", () => {
  const unansweredQuestion = questionsByPart.part5[5];
  const state = createProgressState(
    questionsByPart.part5
      .filter((question) => question.questionId !== unansweredQuestion.questionId)
      .map((question) => createAnswer({ question, correct: true })),
  );
  const queue = createPartSessionQueue({
    part: "part5",
    progressState: state,
  });

  assert.equal(queue.length, 5);
  assert.equal(queue[0].questionId, unansweredQuestion.questionId);
  assert.ok(
    queue.slice(1).every((question) => question.questionId !== unansweredQuestion.questionId),
  );
});

test("Part 5 で難易度を指定した場合は該当難易度の問題だけを出題する", () => {
  const queue = createPartSessionQueue({ part: "part5", difficulty: "easy" });

  assert.equal(queue.length, 5);
  assert.ok(queue.every((question) => question.difficulty === "easy"));
});

test("Part 5で条件一致が指定数より少ない場合は存在する問題だけを出題する", () => {
  const { tag, questions } = findLimitedTagQuestions("part5", 3);
  const queue = createPartSessionQueue({
    part: "part5",
    tag,
    questionCount: 10,
  });

  assert.equal(queue.length, questions.length);
  assert.ok(queue.every((question) => question.tags.includes(tag)));
});

test("Part 6 で難易度を指定した場合はエントリ難易度を継承したパッセージセット単位で出題する", () => {
  // エントリ難易度が hard のパッセージセットは、設問単体の難易度が hard でなくても
  // difficulty="hard" 指定で出題対象になる（エントリ難易度の継承）。
  const targetEntry = questionBankEntriesByPart.part6.find(
    (entry) =>
      "questions" in entry &&
      (entry.difficulty === "hard" ||
        entry.questions.some((question) => question.difficulty === "hard")),
  );

  assert.ok(targetEntry, "Part 6 に hard 難易度のパッセージセットが必要です。");

  const queue = createPartSessionQueue({ part: "part6", difficulty: "hard" });

  assert.ok(queue.length > 0);
  // パッセージセットは分割されず、全問が同一エントリ単位で出題される。
  assert.ok(queue.every((question) => question.entryId === targetEntry.id));
  assert.ok(queue.some((question) => question.difficulty === "hard"));
});

for (const part of ["part6", "part7"] as const) {
  const partLabel = part === "part6" ? "Part 6" : "Part 7";

  test(`${partLabel}は優先対象を含むパッセージセット単位で出題する`, () => {
    const firstEntryId = questionsByPart[part][0].entryId;
    const secondEntryId = questionsByPart[part].find(
      (question) => question.entryId !== firstEntryId,
    )?.entryId;

    assert.ok(secondEntryId, `${partLabel} に2つ以上のパッセージセットが必要です。`);

    const state = createProgressState(
      questionsByPart[part]
        .filter((question) => question.entryId === firstEntryId)
        .map((question) => createAnswer({ question, correct: true })),
    );
    const queue = createPartSessionQueue({ part, progressState: state });

    assert.ok(queue.length > 0);
    assert.equal(queue[0].entryId, secondEntryId);
    assert.ok(queue.every((question) => question.entryId === secondEntryId));
  });

  test(`${partLabel}は出題数指定でもパッセージセットを分割しない`, () => {
    const queue = createPartSessionQueue({ part, questionCount: 10 });
    const entryId = queue[0]?.entryId;

    assert.ok(entryId, `${partLabel} の出題キューが必要です。`);
    assert.ok(queue.every((question) => question.entryId === entryId));
    assert.equal(
      queue.length,
      questionsByPart[part].filter((question) => question.entryId === entryId)
        .length,
    );
  });

  test(`${partLabel}クイックは出題数指定でもパッセージセットを分割しない`, () => {
    const queue = createQuickSessionQueue(part, { questionCount: 10 });
    const entryId = queue[0]?.entryId;

    assert.ok(entryId, `${partLabel} の出題キューが必要です。`);
    assert.ok(queue.every((question) => question.entryId === entryId));
    assert.equal(
      queue.length,
      questionsByPart[part].filter((question) => question.entryId === entryId)
        .length,
    );
  });

  test(`${partLabel}は選んだパッセージセット内でも未回答設問を先に出す`, () => {
    const entryQuestions = questionsByPart[part].filter(
      (question) => question.entryId === questionsByPart[part][0].entryId,
    );
    const [answeredQuestion, unansweredQuestion] = entryQuestions;

    assert.ok(
      answeredQuestion && unansweredQuestion,
      `${partLabel} に複数設問のパッセージセットが必要です。`,
    );

    const state = createProgressState([
      createAnswer({ question: answeredQuestion, correct: true }),
    ]);
    const queue = createPartSessionQueue({ part, progressState: state });

    assert.equal(queue[0].questionId, unansweredQuestion.questionId);
    assert.ok(
      queue.every((question) => question.entryId === answeredQuestion.entryId),
    );
  });
}

test("復習セッションは期限到来SRSだけを返す", () => {
  const [dueQuestion, futureQuestion] = firstQuestions("part5", 2);
  const state = createProgressState(
    [
      createAnswer({ question: dueQuestion, correct: false }),
      createAnswer({ question: futureQuestion, correct: false }),
    ],
    {
      [dueQuestion.questionId]: createSrsState(dueQuestion, "2026-06-24"),
      [futureQuestion.questionId]: createSrsState(futureQuestion, "9999-12-31"),
    },
  );

  assert.deepEqual(
    toQuestionIds(createReviewSessionQueue(state)),
    [dueQuestion.questionId],
  );
});

test("ブックマーク復習セッションは保存順の既知問題だけを返す", () => {
  const [firstQuestion, secondQuestion, thirdQuestion] = firstQuestions("part5", 3);
  const state: ProgressState = {
    ...createProgressState([]),
    bookmarkedQuestionIds: [
      secondQuestion.questionId,
      "missing-question-id",
      firstQuestion.questionId,
      secondQuestion.questionId,
      thirdQuestion.questionId,
    ],
  };

  assert.deepEqual(toQuestionIds(createBookmarkSessionQueue(state)), [
    secondQuestion.questionId,
    firstQuestion.questionId,
    thirdQuestion.questionId,
  ]);
});

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
    toQuestionIds(createPartSessionQueue({ part: "part6", progressState: state })),
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
    toQuestionIds(createPartSessionQueue({ part: "part6", progressState: state })),
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
    toQuestionIds(
      createPartSessionQueue({ part: "part5", progressState: state, tag }),
    ),
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
    toQuestionIds(createPartSessionQueue({ part: "part6", progressState: state })),
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
    toQuestionIds(createPartSessionQueue({ part: "part5", progressState: state })),
  );
});
