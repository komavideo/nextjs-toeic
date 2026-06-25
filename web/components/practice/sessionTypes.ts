import type { FlatQuestion } from "@/lib/question-bank/flatten";
import type { GradeQuestionResult } from "@/lib/question-bank/grade";
import type { UpdateSrsResult } from "@/lib/srs/updateSrs";
import type { AnswerResult } from "@/types/progress";
import type { ChoiceId, Difficulty, ToeicReadingPart } from "@/types/question";

export type PracticeSessionKind = "quick" | "part" | "review";

export type PracticeSessionCondition = {
  kind: PracticeSessionKind;
  part?: ToeicReadingPart;
  difficulty?: Difficulty;
  tag?: string;
  unansweredOnly?: boolean;
};

export type ActivePracticeSession = {
  id: string;
  condition: PracticeSessionCondition;
  queue: FlatQuestion[];
  currentIndex: number;
  startedAt: string;
  questionStartedAt: string;
  answers: AnswerResult[];
  selectedChoiceId?: ChoiceId;
};

export type SelectPracticeState = {
  screen: "select";
  initialPart?: ToeicReadingPart;
  initialDifficulty?: Difficulty;
  initialTag?: string;
};

export type QuestionPracticeState = {
  screen: "question";
  session: ActivePracticeSession;
};

export type ExplainPracticeState = {
  screen: "explain";
  session: ActivePracticeSession;
  answer: GradeQuestionResult;
  srsPreview: UpdateSrsResult;
};

export type ResultPracticeState = {
  screen: "result";
  session: ActivePracticeSession;
  totalCorrect: number;
  totalAnswered: number;
  elapsedMs: number;
  reviewScheduledCount: number;
};

export type ErrorPracticeState = {
  screen: "error";
  message: string;
  storageUnavailable?: boolean;
  session?: ActivePracticeSession;
};

export type PracticeState =
  | SelectPracticeState
  | QuestionPracticeState
  | ExplainPracticeState
  | ResultPracticeState
  | ErrorPracticeState;

export type InitialPracticeState =
  | SelectPracticeState
  | QuestionPracticeState
  | ErrorPracticeState;
