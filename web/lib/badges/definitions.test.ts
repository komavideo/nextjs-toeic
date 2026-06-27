import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";
import type { BadgeCategory, BadgeMetrics, BadgeRarity } from "./types.ts";

// node:test で直接実行するため、テスト内で tsconfig の `@/` alias を解決する。
const webRootUrl = new URL("../../", import.meta.url);
const aliasLoaderCode = `
const webRootUrl = ${JSON.stringify(webRootUrl.href)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return {
      shortCircuit: true,
      url: new URL(specifier.slice(2) + ".ts", webRootUrl).href,
    };
  }

  return nextResolve(specifier, context);
}
`;
register(`data:text/javascript,${encodeURIComponent(aliasLoaderCode)}`, import.meta.url);

const { badgeDefinitions, badgeCategoryLabels, badgeCategoryOrder } =
  await import("./definitions.ts");

const validCategories = new Set<BadgeCategory>([
  "streak",
  "volume",
  "reach",
  "mastery",
  "accuracy",
  "special",
]);
const validRarities = new Set<BadgeRarity>(["common", "rare", "legendary"]);

const zeroMetrics: BadgeMetrics = {
  currentStreakDays: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  cumulativeAccuracy: 0,
  distinctAnswered: 0,
  answeredByPart: { part5: 0, part6: 0, part7: 0 },
  answeredPartCount: 0,
  masteredCount: 0,
  perfectSessionCount: 0,
  overcameWeakTag: false,
  hasEarlyMorningAnswer: false,
  hasLateNightAnswer: false,
};

test("バッジIDは一意である", () => {
  const ids = badgeDefinitions.map((definition) => definition.id);

  assert.equal(new Set(ids).size, ids.length);
});

test("カテゴリ・レア度は許可された値のみを使う", () => {
  for (const definition of badgeDefinitions) {
    assert.ok(
      validCategories.has(definition.category),
      `不正なカテゴリ: ${definition.id}`,
    );
    assert.ok(
      validRarities.has(definition.rarity),
      `不正なレア度: ${definition.id}`,
    );
  }
});

test("タイトルと説明は空でない", () => {
  for (const definition of badgeDefinitions) {
    assert.ok(definition.title.length > 0, `タイトルが空: ${definition.id}`);
    assert.ok(
      definition.description.length > 0,
      `説明が空: ${definition.id}`,
    );
  }
});

test("特別カテゴリは進捗を持たず、その他は進捗を持つ", () => {
  for (const definition of badgeDefinitions) {
    if (definition.category === "special") {
      assert.equal(
        definition.getProgress,
        undefined,
        `特別バッジに進捗あり: ${definition.id}`,
      );
    } else {
      assert.ok(
        typeof definition.getProgress === "function",
        `進捗が未定義: ${definition.id}`,
      );
    }
  }
});

test("マイルストーン系の目標値は正の数である", () => {
  for (const definition of badgeDefinitions) {
    if (!definition.getProgress) {
      continue;
    }

    const progress = definition.getProgress(zeroMetrics);
    assert.ok(progress.target > 0, `目標値が不正: ${definition.id}`);
    assert.equal(typeof progress.current, "number");
  }
});

test("カテゴリの並び順とラベルが全カテゴリを網羅する", () => {
  assert.equal(badgeCategoryOrder.length, validCategories.size);

  for (const category of badgeCategoryOrder) {
    assert.ok(validCategories.has(category));
    assert.ok(badgeCategoryLabels[category].length > 0);
  }
});
