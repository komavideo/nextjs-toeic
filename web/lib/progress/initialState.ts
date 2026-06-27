import type { ProgressState } from "@/types/progress";

export function createInitialProgressState(): ProgressState {
  return {
    version: 3,
    totalAnswered: 0,
    totalCorrect: 0,
    currentStreakDays: 0,
    answers: [],
    srs: {},
    bookmarkedQuestionIds: [],
    questionNotes: {},
    unlockedBadges: {},
  };
}
