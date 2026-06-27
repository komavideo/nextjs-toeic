import type { ChoiceId, ToeicReadingPart } from "./question";

export type ProgressStorageKey = "toeicReadingProgress:v3";
export type ProgressStorageKeyV2 = "toeicReadingProgress:v2";
export type LegacyProgressStorageKey = "toeicReadingProgress:v1";

export type AnswerResult = {
  questionId: string;
  part: ToeicReadingPart;
  selectedChoiceId: ChoiceId;
  correct: boolean;
  answeredAt: string;
  elapsedMs: number;
  tags: string[];
  sessionId?: string;
};

export type SrsState = {
  questionId: string;
  intervalDays: 1 | 3 | 7 | 14 | 30;
  dueDate: string;
  correctStreak: number;
  lastAnsweredAt: string;
};

// バッジ ID → 解除日時(ISO8601)。定義はコード側に集約し、進捗には解除済みのみ記録する。
export type UnlockedBadges = Record<string, string>;

export type ProgressStateV1 = {
  version: 1;
  totalAnswered: number;
  totalCorrect: number;
  currentStreakDays: number;
  lastStudiedDate?: string;
  answers: AnswerResult[];
  srs: Record<string, SrsState>;
};

export type ProgressStateV2 = {
  version: 2;
  totalAnswered: number;
  totalCorrect: number;
  currentStreakDays: number;
  lastStudiedDate?: string;
  answers: AnswerResult[];
  srs: Record<string, SrsState>;
  bookmarkedQuestionIds: string[];
  questionNotes: Record<string, string>;
};

export type ProgressState = {
  version: 3;
  totalAnswered: number;
  totalCorrect: number;
  currentStreakDays: number;
  lastStudiedDate?: string;
  answers: AnswerResult[];
  srs: Record<string, SrsState>;
  bookmarkedQuestionIds: string[];
  questionNotes: Record<string, string>;
  unlockedBadges: UnlockedBadges;
};
