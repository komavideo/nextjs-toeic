import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const reviewDocPath = new URL("../../docs/QUESTION_REVIEW.md", import.meta.url);
const part5DataPath = new URL("../data/part5.json", import.meta.url);
const part6DataPath = new URL("../data/part6.json", import.meta.url);

const requiredSections = [
  "# 問題レビュー基準と記録フォーマット",
  "## レビュー対象",
  "## レビュー観点",
  "## 判定基準",
  "## 記録フォーマット",
  "## 運用手順",
  "## リリース確認",
];

const requiredColumns = [
  "Part",
  "entryId",
  "questionId",
  "レビュー日",
  "レビュアー",
  "問題本文",
  "選択肢",
  "正解参照",
  "解説",
  "難易度",
  "タグ",
  "著作権・商標リスク",
  "総合判定",
  "修正内容/保留理由",
  "再レビュー日",
];

const requiredReviewValues = ["OK", "NG", "NA"];
const requiredFinalStatuses = ["レビュー完了", "要修正", "保留"];
const reviewResultColumns = [
  "問題本文",
  "選択肢",
  "正解参照",
  "解説",
  "難易度",
  "タグ",
  "著作権・商標リスク",
];
const requiredPart6SetColumns = [
  "Part",
  "entryId",
  "レビュー日",
  "レビュアー",
  "本文・設問対応",
  "正解根拠",
  "解説",
  "難易度",
  "タグ",
  "著作権・商標リスク",
  "総合判定",
  "修正内容/保留理由",
  "再レビュー日",
];
const part6SetReviewResultColumns = [
  "本文・設問対応",
  "正解根拠",
  "解説",
  "難易度",
  "タグ",
  "著作権・商標リスク",
];

function parseMarkdownTableRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function isMarkdownTableHeader(line, columns) {
  if (!line.startsWith("|") || !line.endsWith("|")) {
    return false;
  }

  const cells = parseMarkdownTableRow(line).filter(Boolean);
  return columns.every((column) => cells.includes(column));
}

function hasMarkdownTableHeader(content, columns) {
  return content.split("\n").some((line) => isMarkdownTableHeader(line, columns));
}

function getTableRows(content, columns) {
  const lines = content.split("\n");
  const headerIndex = lines.findIndex((line) => isMarkdownTableHeader(line, columns));

  if (headerIndex === -1) {
    return [];
  }

  const rows = [];

  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith("|") || !line.endsWith("|")) {
      break;
    }

    rows.push(line);
  }

  return rows;
}

function getAllTableRows(content, columns) {
  const lines = content.split("\n");
  const rows = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!isMarkdownTableHeader(line, columns)) {
      continue;
    }

    const headerCells = parseMarkdownTableRow(line);
    const columnIndexes = columns.map((column) => headerCells.indexOf(column));

    for (const rowLine of lines.slice(index + 2)) {
      if (!rowLine.startsWith("|") || !rowLine.endsWith("|")) {
        break;
      }

      const cells = parseMarkdownTableRow(rowLine);
      const row = Object.fromEntries(
        columns.map((column, columnIndex) => [column, cells[columnIndexes[columnIndex]] ?? ""]),
      );

      rows.push(row);
    }
  }

  return rows;
}

function getSectionContent(content, heading) {
  const startIndex = content.indexOf(heading);

  if (startIndex === -1) {
    return "";
  }

  const sectionStart = startIndex + heading.length;
  const nextSectionIndex = content.slice(sectionStart).search(/\n### /);

  if (nextSectionIndex === -1) {
    return content.slice(sectionStart);
  }

  return content.slice(sectionStart, sectionStart + nextSectionIndex);
}

function collectPart5ReviewItems(content, part5Entries) {
  const missingItems = [];
  const part5Ids = new Set(part5Entries.map((entry) => entry.id));
  const part5ReviewContent = getSectionContent(content, "### Part 5 レビュー記録");
  const reviewRows = getAllTableRows(part5ReviewContent, requiredColumns);
  const reviewedPart5Ids = new Set();
  const incompleteReviewIds = new Set();

  if (!part5ReviewContent) {
    return ["Part 5 レビュー記録セクションがありません。"];
  }

  for (const row of reviewRows) {
    if (row.Part !== "part5" || !row.entryId || !row.questionId) {
      continue;
    }

    if (!part5Ids.has(row.entryId)) {
      missingItems.push(`Part 5 レビュー記録の entryId がデータに存在しません: ${row.entryId}`);
      continue;
    }

    if (row.entryId !== row.questionId) {
      missingItems.push(`Part 5 レビュー記録の entryId と questionId が一致しません: ${row.entryId}`);
      continue;
    }

    const invalidReviewColumns = reviewResultColumns.filter(
      (column) => !requiredReviewValues.includes(row[column]),
    );

    for (const column of invalidReviewColumns) {
      missingItems.push(`Part 5 レビュー記録の ${column} が OK/NG/NA ではありません: ${row.entryId}`);
    }

    if (!requiredFinalStatuses.includes(row["総合判定"])) {
      missingItems.push(`Part 5 レビュー記録の総合判定が不正です: ${row.entryId}`);
      continue;
    }

    if (row["総合判定"] === "レビュー完了" && reviewResultColumns.some((column) => row[column] === "NG")) {
      missingItems.push(`Part 5 レビュー記録で NG を含む設問がレビュー完了になっています: ${row.entryId}`);
      continue;
    }

    if (row["総合判定"] === "レビュー完了") {
      reviewedPart5Ids.add(row.entryId);
    } else if (row["総合判定"] === "要修正" || row["総合判定"] === "保留") {
      // リリース条件「要修正 または 保留 の設問が残っていない」を機械的に保証する。
      incompleteReviewIds.add(row.entryId);
    }
  }

  if (incompleteReviewIds.size > 0) {
    missingItems.push(
      `Part 5 に未完了（要修正/保留）の総合判定が残っています: ${[...incompleteReviewIds].join(", ")}`,
    );
  }

  const missingReviewedEntries = part5Entries
    .filter((entry) => entry.reviewed === true && !reviewedPart5Ids.has(entry.id))
    .map((entry) => entry.id);

  if (missingReviewedEntries.length > 0) {
    missingItems.push(
      `Part 5 の reviewed: true に対応するレビュー完了記録が不足しています: ${missingReviewedEntries.join(", ")}`,
    );
  }

  return missingItems;
}

function collectPart6SetReviewItems(content, part6Entries) {
  const missingItems = [];
  const part6Ids = new Set(part6Entries.map((entry) => entry.id));
  const part6ReviewContent = getSectionContent(content, "### Part 6 レビュー記録");
  const reviewRows = getAllTableRows(part6ReviewContent, requiredPart6SetColumns);
  const reviewedPart6Ids = new Set();
  const incompleteReviewIds = new Set();

  if (!part6ReviewContent) {
    return ["Part 6 レビュー記録セクションがありません。"];
  }

  for (const row of reviewRows) {
    if (row.Part !== "part6" || !row.entryId) {
      continue;
    }

    if (!part6Ids.has(row.entryId)) {
      missingItems.push(`Part 6 セットレビュー記録の entryId がデータに存在しません: ${row.entryId}`);
      continue;
    }

    const invalidReviewColumns = part6SetReviewResultColumns.filter(
      (column) => !requiredReviewValues.includes(row[column]),
    );

    for (const column of invalidReviewColumns) {
      missingItems.push(`Part 6 セットレビュー記録の ${column} が OK/NG/NA ではありません: ${row.entryId}`);
    }

    if (!requiredFinalStatuses.includes(row["総合判定"])) {
      missingItems.push(`Part 6 セットレビュー記録の総合判定が不正です: ${row.entryId}`);
      continue;
    }

    if (row["総合判定"] === "レビュー完了" && part6SetReviewResultColumns.some((column) => row[column] === "NG")) {
      missingItems.push(`Part 6 セットレビュー記録で NG を含むセットがレビュー完了になっています: ${row.entryId}`);
      continue;
    }

    if (row["総合判定"] === "レビュー完了") {
      reviewedPart6Ids.add(row.entryId);
    } else if (row["総合判定"] === "要修正" || row["総合判定"] === "保留") {
      // リリース条件「要修正 または 保留 のセットが残っていない」を機械的に保証する。
      incompleteReviewIds.add(row.entryId);
    }
  }

  if (incompleteReviewIds.size > 0) {
    missingItems.push(
      `Part 6 セットに未完了（要修正/保留）の総合判定が残っています: ${[...incompleteReviewIds].join(", ")}`,
    );
  }

  const missingReviewedEntries = part6Entries
    .filter((entry) => entry.reviewed === true && !reviewedPart6Ids.has(entry.id))
    .map((entry) => entry.id);

  if (missingReviewedEntries.length > 0) {
    missingItems.push(
      `Part 6 セットの reviewed: true に対応するレビュー完了記録が不足しています: ${missingReviewedEntries.join(", ")}`,
    );
  }

  return missingItems;
}

function collectPart6ReviewItems(content, part6Entries) {
  const missingItems = [];
  const part6QuestionIdsByEntryId = new Map(
    part6Entries.map((entry) => [
      entry.id,
      new Set(Array.isArray(entry.questions) ? entry.questions.map((question) => question.id) : []),
    ]),
  );
  const part6ReviewContent = getSectionContent(content, "### Part 6 レビュー記録");
  const reviewRows = getAllTableRows(part6ReviewContent, requiredColumns);
  const reviewedPart6QuestionKeys = new Set();
  const incompleteReviewKeys = new Set();

  if (!part6ReviewContent) {
    return ["Part 6 レビュー記録セクションがありません。"];
  }

  for (const row of reviewRows) {
    if (row.Part !== "part6" || !row.entryId || !row.questionId) {
      continue;
    }

    const questionIds = part6QuestionIdsByEntryId.get(row.entryId);
    const reviewKey = `${row.entryId} / ${row.questionId}`;

    if (!questionIds) {
      missingItems.push(`Part 6 レビュー記録の entryId がデータに存在しません: ${row.entryId}`);
      continue;
    }

    if (!questionIds.has(row.questionId)) {
      missingItems.push(`Part 6 レビュー記録の questionId が entryId 配下に存在しません: ${reviewKey}`);
      continue;
    }

    const invalidReviewColumns = reviewResultColumns.filter(
      (column) => !requiredReviewValues.includes(row[column]),
    );

    for (const column of invalidReviewColumns) {
      missingItems.push(`Part 6 レビュー記録の ${column} が OK/NG/NA ではありません: ${reviewKey}`);
    }

    if (!requiredFinalStatuses.includes(row["総合判定"])) {
      missingItems.push(`Part 6 レビュー記録の総合判定が不正です: ${reviewKey}`);
      continue;
    }

    if (row["総合判定"] === "レビュー完了" && reviewResultColumns.some((column) => row[column] === "NG")) {
      missingItems.push(`Part 6 レビュー記録で NG を含む設問がレビュー完了になっています: ${reviewKey}`);
      continue;
    }

    if (row["総合判定"] === "レビュー完了") {
      reviewedPart6QuestionKeys.add(reviewKey);
    } else if (row["総合判定"] === "要修正" || row["総合判定"] === "保留") {
      // リリース条件「要修正 または 保留 の設問が残っていない」を機械的に保証する。
      incompleteReviewKeys.add(reviewKey);
    }
  }

  if (incompleteReviewKeys.size > 0) {
    missingItems.push(
      `Part 6 に未完了（要修正/保留）の総合判定が残っています: ${[...incompleteReviewKeys].join(", ")}`,
    );
  }

  const missingReviewedQuestions = part6Entries
    .flatMap((entry) => {
      if (!Array.isArray(entry.questions)) {
        return [];
      }

      return entry.questions
        .filter((question) => question.reviewed === true)
        .map((question) => `${entry.id} / ${question.id}`);
    })
    .filter((reviewKey) => !reviewedPart6QuestionKeys.has(reviewKey));

  if (missingReviewedQuestions.length > 0) {
    missingItems.push(
      `Part 6 の reviewed: true に対応するレビュー完了記録が不足しています: ${missingReviewedQuestions.join(", ")}`,
    );
  }

  return missingItems;
}

function collectMissingItems(content, part5Entries, part6Entries) {
  const missingItems = [];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      missingItems.push(`必須セクションがありません: ${section}`);
    }
  }

  if (!hasMarkdownTableHeader(content, requiredColumns)) {
    missingItems.push(
      `記録フォーマットに必須列が不足しています: ${requiredColumns.join(", ")}`,
    );
  }

  const reviewPerspectiveRows = getTableRows(content, ["観点", "確認内容", "OK の基準"]);
  const finalStatusRows = getTableRows(content, ["総合判定", "条件", "次の対応"]);

  for (const value of requiredReviewValues) {
    const isDefined =
      content.includes(`\`${value}\``) || reviewPerspectiveRows.some((row) => row.includes(value));

    if (!isDefined) {
      missingItems.push(`レビュー観点の判定値が定義されていません: ${value}`);
    }
  }

  for (const status of requiredFinalStatuses) {
    if (!finalStatusRows.some((row) => row.includes(`| ${status} |`))) {
      missingItems.push(`総合判定が定義されていません: ${status}`);
    }
  }

  missingItems.push(...collectPart5ReviewItems(content, part5Entries));
  missingItems.push(...collectPart6SetReviewItems(content, part6Entries));
  missingItems.push(...collectPart6ReviewItems(content, part6Entries));

  return missingItems;
}

async function runValidation() {
  try {
    const content = await readFile(reviewDocPath, "utf8");
    const part5Entries = JSON.parse(await readFile(part5DataPath, "utf8"));
    const part6Entries = JSON.parse(await readFile(part6DataPath, "utf8"));
    const missingItems = collectMissingItems(content, part5Entries, part6Entries);

    if (missingItems.length > 0) {
      for (const item of missingItems) {
        console.error(`レビュー文書検証エラー: ${item}`);
      }
      process.exitCode = 1;
    } else {
      console.log("レビュー文書検証に成功しました。");
    }
  } catch (error) {
    console.error(
      `レビュー文書検証エラー: ${
        error instanceof Error ? error.message : "レビュー文書の読み込みに失敗しました。"
      }`,
    );
    process.exitCode = 1;
  }
}

// 自己テスト用に Part 5 レビュー記録セクション（見出し＋表）を組み立てる。
function createPart5ReviewSection(rows) {
  const header =
    "| Part | entryId | questionId | レビュー日 | レビュアー | 問題本文 | 選択肢 | 正解参照 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |";
  const separator =
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";
  const body = rows
    .map((row) => {
      const reviewCells = reviewResultColumns.map((column) => row[column] ?? "OK").join(" | ");
      return `| part5 | ${row.entryId} | ${row.questionId} | 2026-06-24 | Tester | ${reviewCells} | ${row.status} | なし |  |`;
    })
    .join("\n");

  return `### Part 5 レビュー記録\n\n${header}\n${separator}\n${body}\n`;
}

// 自己テスト用に Part 6 レビュー記録セクション（見出し＋表）を組み立てる。
function createPart6ReviewSection(rows) {
  const header =
    "| Part | entryId | questionId | レビュー日 | レビュアー | 問題本文 | 選択肢 | 正解参照 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |";
  const separator =
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";
  const body = rows
    .map((row) => {
      const reviewCells = reviewResultColumns.map((column) => row[column] ?? "OK").join(" | ");
      return `| part6 | ${row.entryId} | ${row.questionId} | 2026-06-24 | Tester | ${reviewCells} | ${row.status} | なし |  |`;
    })
    .join("\n");

  return `### Part 6 レビュー記録\n\n${header}\n${separator}\n${body}\n`;
}

// 自己テスト用に Part 6 セット単位レビュー記録セクション（見出し＋表）を組み立てる。
function createPart6SetReviewSection(rows) {
  const header =
    "| Part | entryId | レビュー日 | レビュアー | 本文・設問対応 | 正解根拠 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |";
  const separator =
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";
  const body = rows
    .map((row) => {
      const reviewCells = part6SetReviewResultColumns.map((column) => row[column] ?? "OK").join(" | ");
      return `| part6 | ${row.entryId} | 2026-06-24 | Tester | ${reviewCells} | ${row.status} | なし |  |`;
    })
    .join("\n");

  return `### Part 6 レビュー記録\n\n${header}\n${separator}\n${body}\n`;
}

function assertReviewItems(items, expectedFragment) {
  assert(
    items.some((item) => item.includes(expectedFragment)),
    `想定したレビュー検証エラーが見つかりません: ${expectedFragment}`,
  );
}

function runSelfTests() {
  const validEntries = [{ id: "p5-001", reviewed: true }];
  const validPart6Entries = [
    {
      id: "p6-set-001",
      reviewed: true,
      questions: [{ id: "p6-q1", reviewed: true }],
    },
  ];

  // 正常系: reviewed: true の設問にレビュー完了記録がそろっていればエラー 0 件。
  assert.deepEqual(
    collectPart5ReviewItems(
      createPart5ReviewSection([{ entryId: "p5-001", questionId: "p5-001", status: "レビュー完了" }]),
      validEntries,
    ),
    [],
    "正常系のレビュー記録でエラーが発生しました。",
  );

  // セクション欠如。
  assertReviewItems(
    collectPart5ReviewItems("### 別のセクション\n", validEntries),
    "Part 5 レビュー記録セクションがありません。",
  );

  // データに存在しない entryId。
  assertReviewItems(
    collectPart5ReviewItems(
      createPart5ReviewSection([{ entryId: "p5-999", questionId: "p5-999", status: "レビュー完了" }]),
      validEntries,
    ),
    "entryId がデータに存在しません",
  );

  // entryId と questionId の不一致。
  assertReviewItems(
    collectPart5ReviewItems(
      createPart5ReviewSection([{ entryId: "p5-001", questionId: "p5-002", status: "レビュー完了" }]),
      validEntries,
    ),
    "entryId と questionId が一致しません",
  );

  // 要修正/保留 が残存している。
  assertReviewItems(
    collectPart5ReviewItems(
      createPart5ReviewSection([{ entryId: "p5-001", questionId: "p5-001", status: "要修正" }]),
      validEntries,
    ),
    "未完了（要修正/保留）の総合判定が残っています",
  );

  // reviewed: true に対応するレビュー完了記録が不足している。
  assertReviewItems(
    collectPart5ReviewItems(
      createPart5ReviewSection([{ entryId: "p5-001", questionId: "p5-001", status: "保留" }]),
      validEntries,
    ),
    "reviewed: true に対応するレビュー完了記録が不足しています",
  );

  // レビュー観点の不正値。
  assertReviewItems(
    collectPart5ReviewItems(
      createPart5ReviewSection([
        { entryId: "p5-001", questionId: "p5-001", status: "レビュー完了", 問題本文: "未確認" },
      ]),
      validEntries,
    ),
    "問題本文 が OK/NG/NA ではありません",
  );

  // 総合判定の不正値。
  assertReviewItems(
    collectPart5ReviewItems(
      createPart5ReviewSection([{ entryId: "p5-001", questionId: "p5-001", status: "完了" }]),
      validEntries,
    ),
    "総合判定が不正です",
  );

  // NG を含む行はレビュー完了にできない。
  assertReviewItems(
    collectPart5ReviewItems(
      createPart5ReviewSection([
        { entryId: "p5-001", questionId: "p5-001", status: "レビュー完了", 選択肢: "NG" },
      ]),
      validEntries,
    ),
    "NG を含む設問がレビュー完了になっています",
  );

  // Part 6 セット正常系: reviewed: true のセットにレビュー完了記録がそろっていればエラー 0 件。
  assert.deepEqual(
    collectPart6SetReviewItems(
      createPart6SetReviewSection([{ entryId: "p6-set-001", status: "レビュー完了" }]),
      validPart6Entries,
    ),
    [],
    "Part 6 セット正常系のレビュー記録でエラーが発生しました。",
  );

  // Part 6 セットの reviewed: true に対応するレビュー完了記録が不足している。
  assertReviewItems(
    collectPart6SetReviewItems(
      createPart6SetReviewSection([{ entryId: "p6-set-001", status: "保留" }]),
      validPart6Entries,
    ),
    "Part 6 セットの reviewed: true に対応するレビュー完了記録が不足しています",
  );

  // Part 6 セットレビュー観点の不正値。
  assertReviewItems(
    collectPart6SetReviewItems(
      createPart6SetReviewSection([
        { entryId: "p6-set-001", status: "レビュー完了", "本文・設問対応": "未確認" },
      ]),
      validPart6Entries,
    ),
    "本文・設問対応 が OK/NG/NA ではありません",
  );

  // Part 6 セット: データに存在しない entryId。
  assertReviewItems(
    collectPart6SetReviewItems(
      createPart6SetReviewSection([{ entryId: "p6-set-999", status: "レビュー完了" }]),
      validPart6Entries,
    ),
    "セットレビュー記録の entryId がデータに存在しません",
  );

  // Part 6 セット: 総合判定の不正値。
  assertReviewItems(
    collectPart6SetReviewItems(
      createPart6SetReviewSection([{ entryId: "p6-set-001", status: "完了" }]),
      validPart6Entries,
    ),
    "セットレビュー記録の総合判定が不正です",
  );

  // Part 6 セット: NG を含むセットはレビュー完了にできない。
  assertReviewItems(
    collectPart6SetReviewItems(
      createPart6SetReviewSection([
        { entryId: "p6-set-001", status: "レビュー完了", "本文・設問対応": "NG" },
      ]),
      validPart6Entries,
    ),
    "NG を含むセットがレビュー完了になっています",
  );

  // Part 6 セット: 要修正/保留 が残存している。
  assertReviewItems(
    collectPart6SetReviewItems(
      createPart6SetReviewSection([{ entryId: "p6-set-001", status: "要修正" }]),
      validPart6Entries,
    ),
    "Part 6 セットに未完了（要修正/保留）の総合判定が残っています",
  );

  // Part 6 正常系: reviewed: true の設問にレビュー完了記録がそろっていればエラー 0 件。
  assert.deepEqual(
    collectPart6ReviewItems(
      createPart6ReviewSection([{ entryId: "p6-set-001", questionId: "p6-q1", status: "レビュー完了" }]),
      validPart6Entries,
    ),
    [],
    "Part 6 正常系のレビュー記録でエラーが発生しました。",
  );

  // Part 6 セクション欠如。
  assertReviewItems(
    collectPart6ReviewItems("### 別のセクション\n", validPart6Entries),
    "Part 6 レビュー記録セクションがありません。",
  );

  // Part 6 の questionId が entryId 配下に存在しない。
  assertReviewItems(
    collectPart6ReviewItems(
      createPart6ReviewSection([{ entryId: "p6-set-001", questionId: "p6-q2", status: "レビュー完了" }]),
      validPart6Entries,
    ),
    "questionId が entryId 配下に存在しません",
  );

  // Part 6 の reviewed: true に対応するレビュー完了記録が不足している。
  assertReviewItems(
    collectPart6ReviewItems(
      createPart6ReviewSection([{ entryId: "p6-set-001", questionId: "p6-q1", status: "保留" }]),
      validPart6Entries,
    ),
    "reviewed: true に対応するレビュー完了記録が不足しています",
  );

  // Part 6 設問: データに存在しない entryId。
  assertReviewItems(
    collectPart6ReviewItems(
      createPart6ReviewSection([{ entryId: "p6-set-999", questionId: "p6-q1", status: "レビュー完了" }]),
      validPart6Entries,
    ),
    "Part 6 レビュー記録の entryId がデータに存在しません",
  );

  // Part 6 設問: 総合判定の不正値。
  assertReviewItems(
    collectPart6ReviewItems(
      createPart6ReviewSection([{ entryId: "p6-set-001", questionId: "p6-q1", status: "完了" }]),
      validPart6Entries,
    ),
    "Part 6 レビュー記録の総合判定が不正です",
  );

  // Part 6 設問: NG を含む設問はレビュー完了にできない。
  assertReviewItems(
    collectPart6ReviewItems(
      createPart6ReviewSection([
        { entryId: "p6-set-001", questionId: "p6-q1", status: "レビュー完了", 選択肢: "NG" },
      ]),
      validPart6Entries,
    ),
    "Part 6 レビュー記録で NG を含む設問がレビュー完了になっています",
  );

  // Part 6 設問: 要修正/保留 が残存している。
  assertReviewItems(
    collectPart6ReviewItems(
      createPart6ReviewSection([{ entryId: "p6-set-001", questionId: "p6-q1", status: "要修正" }]),
      validPart6Entries,
    ),
    "Part 6 に未完了（要修正/保留）の総合判定が残っています",
  );

  console.log("レビュー文書検証の自己テストに成功しました。");
}

if (process.argv.includes("--self-test")) {
  runSelfTests();
} else {
  await runValidation();
}
