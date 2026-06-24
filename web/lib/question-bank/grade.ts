import type { FlatQuestion } from "@/lib/question-bank/flatten";
import type { AnswerResult } from "@/types/progress";
import type { ChoiceId } from "@/types/question";

export type GradeQuestionResult = AnswerResult & {
  correctChoiceId: ChoiceId;
  explanation: string;
};

export function gradeQuestion(
  question: FlatQuestion,
  selectedChoiceId: ChoiceId,
  elapsedMs: number,
  answeredAt = new Date().toISOString(),
): GradeQuestionResult {
  return {
    questionId: question.questionId,
    part: question.part,
    selectedChoiceId,
    correct: selectedChoiceId === question.correctChoiceId,
    correctChoiceId: question.correctChoiceId,
    explanation: question.explanation,
    answeredAt,
    elapsedMs,
    tags: question.tags,
  };
}
