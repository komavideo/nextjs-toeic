import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const reviewDocPath = new URL("../../docs/QUESTION_REVIEW.md", import.meta.url);
const part5DataPath = new URL("../data/part5.json", import.meta.url);

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

function collectMissingItems(content, part5Entries) {
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

  return missingItems;
}

async function runValidation() {
  try {
    const content = await readFile(reviewDocPath, "utf8");
    const part5Entries = JSON.parse(await readFile(part5DataPath, "utf8"));
    const missingItems = collectMissingItems(content, part5Entries);

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
    .map(
      (row) =>
        `| part5 | ${row.entryId} | ${row.questionId} | 2026-06-24 | Tester | OK | OK | OK | OK | OK | OK | OK | ${row.status} | なし |  |`,
    )
    .join("\n");

  return `### Part 5 レビュー記録\n\n${header}\n${separator}\n${body}\n`;
}

function assertReviewItems(items, expectedFragment) {
  assert(
    items.some((item) => item.includes(expectedFragment)),
    `想定したレビュー検証エラーが見つかりません: ${expectedFragment}`,
  );
}

function runSelfTests() {
  const validEntries = [{ id: "p5-001", reviewed: true }];

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

  console.log("レビュー文書検証の自己テストに成功しました。");
}

if (process.argv.includes("--self-test")) {
  runSelfTests();
} else {
  await runValidation();
}
