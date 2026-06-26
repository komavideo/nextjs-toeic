import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProgressTagDetailHref,
  buildTagPracticeHref,
} from "./tagLinks.ts";

function getSearchParams(href: string): URLSearchParams {
  const query = href.split("?")[1];

  assert.ok(query, "検索パラメータが必要です。");

  return new URLSearchParams(query);
}

test("タグ詳細リンクはタグ名を検索パラメータとしてエンコードする", () => {
  const tag = "句動詞 / A&B";
  const href = buildProgressTagDetailHref(tag);
  const searchParams = getSearchParams(href);

  assert.equal(href.startsWith("/progress/tag?"), true);
  assert.equal(searchParams.get("tag"), tag);
});

test("タグ練習リンクはPart指定済みの演習URLを作る", () => {
  const tag = "句動詞 / A&B";
  const href = buildTagPracticeHref("part6", tag);
  const searchParams = getSearchParams(href);

  assert.equal(href.startsWith("/practice?"), true);
  assert.equal(searchParams.get("mode"), "part");
  assert.equal(searchParams.get("part"), "part6");
  assert.equal(searchParams.get("tag"), tag);
});
