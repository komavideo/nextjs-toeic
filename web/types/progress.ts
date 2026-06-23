import type { ChoiceId, ToeicReadingPart } from "./question";

export type ProgressStorageKey = "toeicReadingProgress:v1";

export type AnswerResult = {
  questionId: string;
  part: ToeicReadingPart;
  selectedChoiceId: ChoiceId;
  correct: boolean;
  answeredAt: string;
  elapsedMs: number;
  tags: string[];
};

export type SrsState = {
  questionId: string;
  intervalDays: 1 | 3 | 7 | 14 | 30;
  dueDate: string;
  correctStreak: number;
  lastAnsweredAt: string;
};

export type ProgressState = {
  version: 1;
  totalAnswered: number;
  totalCorrect: number;
  currentStreakDays: number;
  lastStudiedDate?: string;
  answers: AnswerResult[];
  srs: Record<string, SrsState>;
};
