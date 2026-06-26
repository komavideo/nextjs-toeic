import assert from "node:assert/strict";
import test from "node:test";
import { createInitialProgressState } from "./initialState.ts";
import {
  addBookmarkedQuestionId,
  isQuestionBookmarked,
  removeBookmarkedQuestionId,
  toggleBookmarkedQuestionId,
} from "./bookmarks.ts";

test("ブックマークを追加し、追加順を維持する", () => {
  const firstState = addBookmarkedQuestionId(
    createInitialProgressState(),
    "question-001",
  );
  const secondState = addBookmarkedQuestionId(firstState, "question-002");

  assert.deepEqual(secondState.bookmarkedQuestionIds, [
    "question-001",
    "question-002",
  ]);
});

test("同じ問題を重複してブックマークしない", () => {
  const firstState = addBookmarkedQuestionId(
    createInitialProgressState(),
    "question-001",
  );
  const secondState = addBookmarkedQuestionId(firstState, "question-001");

  assert.deepEqual(secondState.bookmarkedQuestionIds, ["question-001"]);
});

test("ブックマークを解除する", () => {
  const state = {
    ...createInitialProgressState(),
    bookmarkedQuestionIds: ["question-001", "question-002"],
  };
  const nextState = removeBookmarkedQuestionId(state, "question-001");

  assert.deepEqual(nextState.bookmarkedQuestionIds, ["question-002"]);
});

test("ブックマーク状態を切り替える", () => {
  const bookmarkedState = toggleBookmarkedQuestionId(
    createInitialProgressState(),
    "question-001",
  );
  const removedState = toggleBookmarkedQuestionId(
    bookmarkedState,
    "question-001",
  );

  assert.equal(isQuestionBookmarked(bookmarkedState, "question-001"), true);
  assert.equal(isQuestionBookmarked(removedState, "question-001"), false);
});
