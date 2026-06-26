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
