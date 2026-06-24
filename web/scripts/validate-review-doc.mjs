import { readFile } from "node:fs/promises";

const reviewDocPath = new URL("../../docs/QUESTION_REVIEW.md", import.meta.url);

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

function hasMarkdownTableHeader(content, columns) {
  return content
    .split("\n")
    .some((line) => {
      if (!line.startsWith("|") || !line.endsWith("|")) {
        return false;
      }

      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);

      return columns.every((column) => cells.includes(column));
    });
}

function getTableRows(content, columns) {
  const lines = content.split("\n");
  const headerIndex = lines.findIndex((line) => {
    if (!line.startsWith("|") || !line.endsWith("|")) {
      return false;
    }

    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);

    return columns.every((column) => cells.includes(column));
  });

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

function collectMissingItems(content) {
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

  return missingItems;
}

try {
  const content = await readFile(reviewDocPath, "utf8");
  const missingItems = collectMissingItems(content);

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
