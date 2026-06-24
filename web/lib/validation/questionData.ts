import type { ChoiceId, Difficulty, QuestionBankEntry } from "@/types/question";

export type QuestionDataValidationError = {
  filePath?: string;
  entryId?: string;
  questionId?: string;
  reason: string;
};

const validParts = new Set(["part5", "part6", "part7"]);
const validChoiceIds: ChoiceId[] = ["A", "B", "C", "D"];
const validDifficulties = new Set<Difficulty>(["easy", "medium", "hard"]);
const minimumFlatQuestionCount = 300;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addError(
  errors: QuestionDataValidationError[],
  reason: string,
  context: Omit<QuestionDataValidationError, "reason">,
) {
  errors.push({ ...context, reason });
}

function validateQuestionItem(
  item: Record<string, unknown>,
  errors: QuestionDataValidationError[],
  context: Omit<QuestionDataValidationError, "reason">,
) {
  const choices = item.choices;
  const questionId =
    typeof item.id === "string" ? item.id : context.questionId ?? "unknown";
  const nextContext = { ...context, questionId };

  if (typeof item.id !== "string" || item.id.length === 0) {
    addError(errors, "設問 ID が空または文字列ではありません。", context);
  }

  if (typeof item.prompt !== "string" || item.prompt.length === 0) {
    addError(errors, "設問文が空または文字列ではありません。", nextContext);
  }

  if (!Array.isArray(choices) || choices.length !== 4) {
    addError(errors, "選択肢数が 4 件ではありません。", nextContext);
  } else {
    const choiceIds = choices
      .filter(isRecord)
      .map((choice) => choice.id)
      .filter((id): id is ChoiceId => typeof id === "string");
    const choiceTexts = choices
      .filter(isRecord)
      .map((choice) => choice.text)
      .filter((text): text is string => typeof text === "string");

    if (new Set(choiceTexts).size !== choiceTexts.length) {
      addError(errors, "選択肢本文が重複しています。", nextContext);
    }

    for (const requiredId of validChoiceIds) {
      if (!choiceIds.includes(requiredId)) {
        addError(errors, `選択肢 ${requiredId} が存在しません。`, nextContext);
      }
    }

    for (const choice of choices) {
      if (!isRecord(choice)) {
        addError(errors, "選択肢がオブジェクトではありません。", nextContext);
        continue;
      }

      if (!validChoiceIds.includes(choice.id as ChoiceId)) {
        addError(errors, "選択肢 ID が A-D ではありません。", nextContext);
      }

      if (typeof choice.text !== "string" || choice.text.length === 0) {
        addError(errors, "選択肢本文が空または文字列ではありません。", nextContext);
      }
    }

    if (!choiceIds.includes(item.correctChoiceId as ChoiceId)) {
      addError(errors, "correctChoiceId が存在する選択肢を参照していません。", nextContext);
    }
  }

  if (!validDifficulties.has(item.difficulty as Difficulty)) {
    addError(errors, "難易度が easy/medium/hard ではありません。", nextContext);
  }

  if (
    !Array.isArray(item.tags) ||
    item.tags.length === 0 ||
    item.tags.some((tag) => typeof tag !== "string" || tag.length === 0)
  ) {
    addError(errors, "タグが空、または文字列配列ではありません。", nextContext);
  }

  if (typeof item.explanation !== "string" || item.explanation.trim().length === 0) {
    addError(errors, "解説が空または文字列ではありません。", nextContext);
  }

  if (typeof item.reviewed !== "boolean") {
    addError(errors, "reviewed が boolean ではありません。", nextContext);
  } else if (!item.reviewed) {
    addError(errors, "reviewed が true ではありません。", nextContext);
  }
}

export function validateQuestionData(
  entries: unknown,
  filePath?: string,
): QuestionDataValidationError[] {
  const errors: QuestionDataValidationError[] = [];
  const seenEntryIds = new Set<string>();
  const seenQuestionIds = new Set<string>();
  let flatQuestionCount = 0;

  if (!Array.isArray(entries)) {
    addError(errors, "JSON ルートが配列ではありません。", { filePath });
    return errors;
  }

  for (const entry of entries) {
    if (!isRecord(entry)) {
      addError(errors, "問題データがオブジェクトではありません。", { filePath });
      continue;
    }

    const entryId = typeof entry.id === "string" ? entry.id : "unknown";
    const context = { filePath, entryId };

    if (typeof entry.id !== "string" || entry.id.length === 0) {
      addError(errors, "エントリ ID が空または文字列ではありません。", { filePath });
    } else if (seenEntryIds.has(entry.id)) {
      addError(errors, "エントリ ID が重複しています。", context);
    } else {
      seenEntryIds.add(entry.id);
    }

    if (!validParts.has(entry.part as string)) {
      addError(errors, "Part 値が不正です。", context);
      continue;
    }

    if (entry.part === "part5") {
      flatQuestionCount += 1;
      validateQuestionItem(entry, errors, { ...context, questionId: entryId });

      if (typeof entry.sentence !== "string" || entry.sentence.length === 0) {
        addError(errors, "Part 5 の sentence が空または文字列ではありません。", {
          ...context,
          questionId: entryId,
        });
      }

      if (seenQuestionIds.has(entryId)) {
        addError(errors, "設問 ID が重複しています。", {
          ...context,
          questionId: entryId,
        });
      } else {
        seenQuestionIds.add(entryId);
      }
      continue;
    }

    if (typeof entry.passage !== "string" || entry.passage.length === 0) {
      addError(errors, "パッセージ本文が空または文字列ではありません。", context);
    }

    if (!validDifficulties.has(entry.difficulty as Difficulty)) {
      addError(errors, "セット難易度が easy/medium/hard ではありません。", context);
    }

    if (
      !Array.isArray(entry.tags) ||
      entry.tags.length === 0 ||
      entry.tags.some((tag) => typeof tag !== "string" || tag.length === 0)
    ) {
      addError(errors, "セットタグが空、または文字列配列ではありません。", context);
    }

    if (typeof entry.reviewed !== "boolean") {
      addError(errors, "セット reviewed が boolean ではありません。", context);
    } else if (!entry.reviewed) {
      addError(errors, "セット reviewed が true ではありません。", context);
    }

    if (!Array.isArray(entry.questions) || entry.questions.length === 0) {
      addError(errors, "パッセージ設問が存在しません。", context);
      continue;
    }

    for (const question of entry.questions) {
      flatQuestionCount += 1;
      if (!isRecord(question)) {
        addError(errors, "パッセージ設問がオブジェクトではありません。", context);
        continue;
      }

      const questionId = typeof question.id === "string" ? question.id : "unknown";
      validateQuestionItem(question, errors, { ...context, questionId });

      if (seenQuestionIds.has(questionId)) {
        addError(errors, "設問 ID が重複しています。", {
          ...context,
          questionId,
        });
      } else {
        seenQuestionIds.add(questionId);
      }
    }
  }

  if (flatQuestionCount < minimumFlatQuestionCount) {
    addError(errors, `フラット化後の設問数が ${minimumFlatQuestionCount} 問未満です。`, {
      filePath,
    });
  }

  return errors;
}

export function validateQuestionBankEntries(
  entries: QuestionBankEntry[],
): QuestionDataValidationError[] {
  return validateQuestionData(entries);
}
