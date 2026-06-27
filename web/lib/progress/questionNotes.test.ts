import assert from "node:assert/strict";
import test from "node:test";
import { createInitialProgressState } from "./initialState.ts";
import {
  getQuestionNote,
  questionNoteMaxLength,
  questionNoteSaveErrorMessage,
  saveQuestionNote,
} from "./questionNotes.ts";

test("学習メモを追加し、問題IDから取得する", () => {
  const result = saveQuestionNote(
    createInitialProgressState(),
    "question-001",
    "仮定法の目印を確認する。",
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(
    getQuestionNote(result.state, "question-001"),
    "仮定法の目印を確認する。",
  );
});

test("学習メモを更新する", () => {
  const firstResult = saveQuestionNote(
    createInitialProgressState(),
    "question-001",
    "前置詞を確認する。",
  );
  assert.equal(firstResult.ok, true);
  if (!firstResult.ok) {
    return;
  }

  const secondResult = saveQuestionNote(
    firstResult.state,
    "question-001",
    "品詞を確認する。",
  );
  assert.equal(secondResult.ok, true);
  if (!secondResult.ok) {
    return;
  }

  assert.deepEqual(secondResult.state.questionNotes, {
    "question-001": "品詞を確認する。",
  });
});

test("空白だけの学習メモ保存は削除として扱う", () => {
  const savedResult = saveQuestionNote(
    createInitialProgressState(),
    "question-001",
    "熟語を覚える。",
  );
  assert.equal(savedResult.ok, true);
  if (!savedResult.ok) {
    return;
  }

  const deletedResult = saveQuestionNote(
    savedResult.state,
    "question-001",
    "   ",
  );
  assert.equal(deletedResult.ok, true);
  if (!deletedResult.ok) {
    return;
  }

  assert.deepEqual(deletedResult.state.questionNotes, {});
  assert.equal(deletedResult.note, null);
});

test("前後の空白を取り除いて学習メモを保存する", () => {
  const result = saveQuestionNote(
    createInitialProgressState(),
    "question-001",
    "  語順に注意する。  ",
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.note, "語順に注意する。");
});

test("200文字ちょうどの学習メモは保存できる", () => {
  const exactNote = "a".repeat(questionNoteMaxLength);
  const result = saveQuestionNote(
    createInitialProgressState(),
    "question-001",
    exactNote,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.note, exactNote);
  assert.equal(result.note?.length, questionNoteMaxLength);
});

test("200文字を超える学習メモは保存しない", () => {
  const result = saveQuestionNote(
    createInitialProgressState(),
    "question-001",
    "a".repeat(questionNoteMaxLength + 1),
  );

  assert.deepEqual(result, { ok: false, reason: "too-long" });
});

test("学習メモが存在しない問題IDでは空文字を返す", () => {
  assert.equal(
    getQuestionNote(createInitialProgressState(), "question-unknown"),
    "",
  );
});

test("学習メモ保存エラーのメッセージを状況別に生成する", () => {
  assert.equal(
    questionNoteSaveErrorMessage("load", true),
    "localStorage が利用できないため、学習メモを保存できませんでした。",
  );
  assert.equal(
    questionNoteSaveErrorMessage("save", true),
    "localStorage が利用できないため、学習メモを保存できませんでした。",
  );
  assert.equal(
    questionNoteSaveErrorMessage("load", false),
    "進捗データを読み込めないため、学習メモを保存できませんでした。",
  );
  assert.equal(
    questionNoteSaveErrorMessage("save", false),
    "学習メモの保存に失敗しました。",
  );
});
