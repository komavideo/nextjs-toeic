import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = ["data/part5.json", "data/part6.json", "data/part7.json"];
const validParts = new Set(["part5", "part6", "part7"]);
const validChoiceIds = ["A", "B", "C", "D"];
const validDifficulties = new Set(["easy", "medium", "hard"]);
const minimumFlatQuestionCount = 300;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
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
  const hasValidCorrectChoiceId =
    typeof item.correctChoiceId === "string" && validChoiceIds.includes(item.correctChoiceId);

  if (!isNonEmptyString(item.id)) {
    addError(errors, filePath, entryId, questionId, "設問 ID が空または文字列ではありません。");
  }

  if (!isNonEmptyString(item.prompt)) {
    addError(errors, filePath, entryId, id, "設問文が空または文字列ではありません。");
  }

  if (!hasValidCorrectChoiceId) {
    addError(errors, filePath, entryId, id, "correctChoiceId が A-D ではありません。");
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
    const normalizedChoiceTexts = choiceTexts.map((text) => text.trim());

    if (new Set(normalizedChoiceTexts).size !== normalizedChoiceTexts.length) {
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

      if (!isNonEmptyString(choice.text)) {
        addError(errors, filePath, entryId, id, "選択肢本文が空または文字列ではありません。");
      }
    }

    if (hasValidCorrectChoiceId && !choiceIds.includes(item.correctChoiceId)) {
      addError(errors, filePath, entryId, id, "correctChoiceId が存在する選択肢を参照していません。");
    }
  }

  if (!validDifficulties.has(item.difficulty)) {
    addError(errors, filePath, entryId, id, "難易度が easy/medium/hard ではありません。");
  }

  if (
    !Array.isArray(item.tags) ||
    item.tags.length === 0 ||
    item.tags.some((tag) => !isNonEmptyString(tag))
  ) {
    addError(errors, filePath, entryId, id, "タグが空、または文字列配列ではありません。");
  }

  if (!isNonEmptyString(item.explanation)) {
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

    if (!isNonEmptyString(entry.id)) {
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

      if (!isNonEmptyString(entry.sentence)) {
        addError(errors, filePath, entryId, entryId, "Part 5 の sentence が空または文字列ではありません。");
      } else if (Array.isArray(entry.choices)) {
        // ID が異なっても英文と選択肢が同一の設問（内容重複）を検出する。
        // Part 6/7 は定型 prompt・選択肢を正当に共有するため、この検査は Part 5 のみに適用する。
        const contentKey = JSON.stringify([
          entry.sentence.trim(),
          entry.choices
            .filter(isRecord)
            .map((choice) => (typeof choice.text === "string" ? choice.text.trim() : ""))
            .slice()
            .sort(),
        ]);

        if (seenPart5Content.has(contentKey)) {
          const duplicatedEntryId = seenPart5Content.get(contentKey);
          addError(
            errors,
            filePath,
            entryId,
            entryId,
            `Part 5 の設問内容（英文と選択肢）が ${duplicatedEntryId} と重複しています。`,
          );
        } else {
          seenPart5Content.set(contentKey, entryId);
        }
      }

      if (seenQuestionIds.has(entryId)) {
        addError(errors, filePath, entryId, entryId, "設問 ID が重複しています。");
      } else {
        seenQuestionIds.add(entryId);
      }
      continue;
    }

    if (!isNonEmptyString(entry.passage)) {
      addError(errors, filePath, entryId, undefined, "パッセージ本文が空または文字列ではありません。");
    }

    if (!validDifficulties.has(entry.difficulty)) {
      addError(errors, filePath, entryId, undefined, "セット難易度が easy/medium/hard ではありません。");
    }

    if (
      !Array.isArray(entry.tags) ||
      entry.tags.length === 0 ||
      entry.tags.some((tag) => !isNonEmptyString(tag))
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

function createValidPart5Question(overrides = {}) {
  return {
    id: "p5-fixture-001",
    part: "part5",
    sentence: "The manager reviewed the contract _____ sending it to the client.",
    prompt: "空所に入る最も適切な語句を選んでください。",
    choices: [
      { id: "A", text: "before" },
      { id: "B", text: "beneath" },
      { id: "C", text: "beside" },
      { id: "D", text: "between" },
    ],
    correctChoiceId: "A",
    explanation: "before は「〜する前に」という意味で文脈に合います。",
    difficulty: "easy",
    tags: ["conjunction"],
    reviewed: true,
    ...overrides,
  };
}

function validateFixture(entries) {
  return validateEntries(entries, "fixture.json", new Set(), new Set(), new Map()).errors;
}

function assertHasError(errors, reason) {
  assert(
    errors.some((error) => error.reason === reason),
    `想定した検証エラーが見つかりません: ${reason}`,
  );
}

function runSelfTests() {
  assertHasError(
    validateFixture([createValidPart5Question({ correctChoiceId: "E" })]),
    "correctChoiceId が A-D ではありません。",
  );

  assertHasError(
    validateFixture([
      createValidPart5Question({
        choices: [
          { id: "A", text: "before" },
          { id: "B", text: "beneath" },
          { id: "C", text: "beside" },
          { id: "C", text: "between" },
        ],
        correctChoiceId: "D",
      }),
    ]),
    "correctChoiceId が存在する選択肢を参照していません。",
  );

  assertHasError(
    validateFixture([
      createValidPart5Question({ id: "p5-fixture-001" }),
      createValidPart5Question({
        id: "p5-fixture-002",
        choices: [
          { id: "A", text: "before " },
          { id: "B", text: "beneath" },
          { id: "C", text: "beside" },
          { id: "D", text: "between" },
        ],
      }),
    ]),
    "Part 5 の設問内容（英文と選択肢）が p5-fixture-001 と重複しています。",
  );

  assertHasError(
    validateFixture([
      createValidPart5Question({
        choices: [
          { id: "A", text: "   " },
          { id: "B", text: "beneath" },
          { id: "C", text: "beside" },
          { id: "D", text: "between" },
        ],
        correctChoiceId: "B",
      }),
    ]),
    "選択肢本文が空または文字列ではありません。",
  );

  console.log("問題データ検証の自己テストに成功しました。");
}

async function runValidation() {
  const allErrors = [];
  const seenEntryIds = new Set();
  const seenQuestionIds = new Set();
  const seenPart5Content = new Map();
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
}

if (process.argv.includes("--self-test")) {
  runSelfTests();
} else {
  await runValidation();
}
