import type { ProgressState } from "@/types/progress";

export function isQuestionBookmarked(
  state: ProgressState,
  questionId: string,
): boolean {
  return state.bookmarkedQuestionIds.includes(questionId);
}

export function addBookmarkedQuestionId(
  state: ProgressState,
  questionId: string,
): ProgressState {
  if (isQuestionBookmarked(state, questionId)) {
    return state;
  }

  return {
    ...state,
    bookmarkedQuestionIds: [...state.bookmarkedQuestionIds, questionId],
  };
}

export function removeBookmarkedQuestionId(
  state: ProgressState,
  questionId: string,
): ProgressState {
  if (!isQuestionBookmarked(state, questionId)) {
    return state;
  }

  return {
    ...state,
    bookmarkedQuestionIds: state.bookmarkedQuestionIds.filter(
      (bookmarkedQuestionId) => bookmarkedQuestionId !== questionId,
    ),
  };
}

export function toggleBookmarkedQuestionId(
  state: ProgressState,
  questionId: string,
): ProgressState {
  return isQuestionBookmarked(state, questionId)
    ? removeBookmarkedQuestionId(state, questionId)
    : addBookmarkedQuestionId(state, questionId);
}

/**
 * ブックマーク保存時に表示するエラーメッセージを生成する。
 * localStorage が利用できない場合は読み込み・保存いずれも同じ文言を返し、
 * それ以外は読み込み失敗・保存失敗で文言を出し分ける。
 */
export function bookmarkSaveErrorMessage(
  phase: "load" | "save",
  storageUnavailable: boolean,
): string {
  if (storageUnavailable) {
    return "localStorage が利用できないため、ブックマークを保存できませんでした。";
  }

  return phase === "load"
    ? "進捗データを読み込めないため、ブックマークを保存できませんでした。"
    : "ブックマークの保存に失敗しました。";
}
