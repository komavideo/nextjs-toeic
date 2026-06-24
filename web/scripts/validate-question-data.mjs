import { readFile } from "node:fs/promises";

const files = ["data/part5.json", "data/part6.json", "data/part7.json"];
const validParts = new Set(["part5", "part6", "part7"]);
const validChoiceIds = ["A", "B", "C", "D"];
const validDifficulties = new Set(["easy", "medium", "hard"]);
const minimumFlatQuestionCount = 300;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatContext(error) {
  const ids = [error.entryId, error.questionId].filter(Boolean).join(" / ");
  return `${error.filePath}${ids ? ` (${ids})` : ""}`;
}

function addError(errors, filePath, entryId, questionId, reason) {
  errors.push({ filePath, entryId, questionId, reason });
}

function validateQuestionItem(item, errors, filePath, entryId, questionId) {
  const id = typeof item.id === "string" ? item.id : questionId;
  const choices = item.choices;

  if (typeof item.id !== "string" || item.id.length === 0) {
    addError(errors, filePath, entryId, questionId, "設問 ID が空または文字列ではありません。");
  }

  if (typeof item.prompt !== "string" || item.prompt.length === 0) {
    addError(errors, filePath, entryId, id, "設問文が空または文字列ではありません。");
  }

  if (!Array.isArray(choices) || choices.length !== 4) {
    addError(errors, filePath, entryId, id, "選択肢数が 4 件ではありません。");
  } else {
    const choiceIds = choices
      .filter(isRecord)
      .map((choice) => choice.id)
      .filter((choiceId) => typeof choiceId === "string");
    const choiceTexts = choices
      .filter(isRecord)
      .map((choice) => choice.text)
      .filter((text) => typeof text === "string");

    if (new Set(choiceTexts).size !== choiceTexts.length) {
      addError(errors, filePath, entryId, id, "選択肢本文が重複しています。");
    }

    for (const requiredId of validChoiceIds) {
      if (!choiceIds.includes(requiredId)) {
        addError(errors, filePath, entryId, id, `選択肢 ${requiredId} が存在しません。`);
      }
    }

    for (const choice of choices) {
      if (!isRecord(choice)) {
        addError(errors, filePath, entryId, id, "選択肢がオブジェクトではありません。");
        continue;
      }

      if (!validChoiceIds.includes(choice.id)) {
        addError(errors, filePath, entryId, id, "選択肢 ID が A-D ではありません。");
      }

      if (typeof choice.text !== "string" || choice.text.length === 0) {
        addError(errors, filePath, entryId, id, "選択肢本文が空または文字列ではありません。");
      }
    }

    if (typeof item.correctChoiceId !== "string" || !validChoiceIds.includes(item.correctChoiceId)) {
      addError(errors, filePath, entryId, id, "correctChoiceId が A-D ではありません。");
    } else if (!choiceIds.includes(item.correctChoiceId)) {
      addError(errors, filePath, entryId, id, "correctChoiceId が存在する選択肢を参照していません。");
    }
  }

  if (!validDifficulties.has(item.difficulty)) {
    addError(errors, filePath, entryId, id, "難易度が easy/medium/hard ではありません。");
  }

  if (
    !Array.isArray(item.tags) ||
    item.tags.length === 0 ||
    item.tags.some((tag) => typeof tag !== "string" || tag.length === 0)
  ) {
    addError(errors, filePath, entryId, id, "タグが空、または文字列配列ではありません。");
  }

  if (typeof item.explanation !== "string" || item.explanation.trim().length === 0) {
    addError(errors, filePath, entryId, id, "解説が空または文字列ではありません。");
  }

  if (typeof item.reviewed !== "boolean") {
    addError(errors, filePath, entryId, id, "reviewed が boolean ではありません。");
  } else if (!item.reviewed) {
    addError(errors, filePath, entryId, id, "reviewed が true ではありません。");
  }
}

function validateEntries(entries, filePath, seenEntryIds, seenQuestionIds, seenPart5Content) {
  const errors = [];
  let flatQuestionCount = 0;

  if (!Array.isArray(entries)) {
    addError(errors, filePath, undefined, undefined, "JSON ルートが配列ではありません。");
    return { errors, flatQuestionCount };
  }

  for (const entry of entries) {
    if (!isRecord(entry)) {
      addError(errors, filePath, undefined, undefined, "問題データがオブジェクトではありません。");
      continue;
    }

    const entryId = typeof entry.id === "string" ? entry.id : "unknown";

    if (typeof entry.id !== "string" || entry.id.length === 0) {
      addError(errors, filePath, undefined, undefined, "エントリ ID が空または文字列ではありません。");
    } else if (seenEntryIds.has(entry.id)) {
      addError(errors, filePath, entryId, undefined, "エントリ ID が重複しています。");
    } else {
      seenEntryIds.add(entry.id);
    }

    if (!validParts.has(entry.part)) {
      addError(errors, filePath, entryId, undefined, "Part 値が不正です。");
      continue;
    }

    if (entry.part === "part5") {
      flatQuestionCount += 1;
      validateQuestionItem(entry, errors, filePath, entryId, entryId);

      if (typeof entry.sentence !== "string" || entry.sentence.length === 0) {
        addError(errors, filePath, entryId, entryId, "Part 5 の sentence が空または文字列ではありません。");
      } else if (Array.isArray(entry.choices)) {
        // ID が異なっても英文と選択肢が同一の設問（内容重複）を検出する。
        // Part 6/7 は定型 prompt・選択肢を正当に共有するため、この検査は Part 5 のみに適用する。
        const contentKey = JSON.stringify([
          entry.sentence.trim(),
          entry.choices
            .filter(isRecord)
            .map((choice) => (typeof choice.text === "string" ? choice.text : ""))
            .slice()
            .sort(),
        ]);

        if (seenPart5Content.has(contentKey)) {
          addError(errors, filePath, entryId, entryId, "Part 5 の設問内容（英文と選択肢）が他の設問と重複しています。");
        } else {
          seenPart5Content.add(contentKey);
        }
      }

      if (seenQuestionIds.has(entryId)) {
        addError(errors, filePath, entryId, entryId, "設問 ID が重複しています。");
      } else {
        seenQuestionIds.add(entryId);
      }
      continue;
    }

    if (typeof entry.passage !== "string" || entry.passage.length === 0) {
      addError(errors, filePath, entryId, undefined, "パッセージ本文が空または文字列ではありません。");
    }

    if (!validDifficulties.has(entry.difficulty)) {
      addError(errors, filePath, entryId, undefined, "セット難易度が easy/medium/hard ではありません。");
    }

    if (
      !Array.isArray(entry.tags) ||
      entry.tags.length === 0 ||
      entry.tags.some((tag) => typeof tag !== "string" || tag.length === 0)
    ) {
      addError(errors, filePath, entryId, undefined, "セットタグが空、または文字列配列ではありません。");
    }

    if (typeof entry.reviewed !== "boolean") {
      addError(errors, filePath, entryId, undefined, "セット reviewed が boolean ではありません。");
    } else if (!entry.reviewed) {
      addError(errors, filePath, entryId, undefined, "セット reviewed が true ではありません。");
    }

    if (!Array.isArray(entry.questions) || entry.questions.length === 0) {
      addError(errors, filePath, entryId, undefined, "パッセージ設問が存在しません。");
      continue;
    }

    for (const question of entry.questions) {
      flatQuestionCount += 1;
      if (!isRecord(question)) {
        addError(errors, filePath, entryId, undefined, "パッセージ設問がオブジェクトではありません。");
        continue;
      }

      const questionId = typeof question.id === "string" ? question.id : "unknown";
      validateQuestionItem(question, errors, filePath, entryId, questionId);

      if (seenQuestionIds.has(questionId)) {
        addError(errors, filePath, entryId, questionId, "設問 ID が重複しています。");
      } else {
        seenQuestionIds.add(questionId);
      }
    }
  }

  return { errors, flatQuestionCount };
}

const allErrors = [];
const seenEntryIds = new Set();
const seenQuestionIds = new Set();
const seenPart5Content = new Set();
let totalFlatQuestionCount = 0;

for (const filePath of files) {
  try {
    const json = JSON.parse(await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"));
    const result = validateEntries(json, filePath, seenEntryIds, seenQuestionIds, seenPart5Content);
    allErrors.push(...result.errors);
    totalFlatQuestionCount += result.flatQuestionCount;
  } catch (error) {
    allErrors.push({
      filePath,
      reason: error instanceof Error ? error.message : "JSON の読み込みに失敗しました。",
    });
  }
}

if (totalFlatQuestionCount < minimumFlatQuestionCount) {
  allErrors.push({
    filePath: "data/*.json",
    reason: `フラット化後の設問数が ${minimumFlatQuestionCount} 問未満です。`,
  });
}

if (allErrors.length > 0) {
  for (const error of allErrors) {
    console.error(`${formatContext(error)}: ${error.reason}`);
  }
  process.exitCode = 1;
} else {
  console.log("問題データ検証に成功しました。");
}
