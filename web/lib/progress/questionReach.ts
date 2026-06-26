import type { ProgressState } from "@/types/progress";
import type { ToeicReadingPart } from "@/types/question";

export type QuestionReachQuestion = {
  questionId: string;
  part: ToeicReadingPart;
};

export type QuestionReachPartSummary = {
  part: ToeicReadingPart;
  total: number;
  answered: number;
  unanswered: number;
  mastered: number;
  answeredRate: number;
};

export type QuestionReachSummary = {
  total: number;
  answered: number;
  unanswered: number;
  mastered: number;
  answeredRate: number;
  parts: QuestionReachPartSummary[];
};

const readingParts: ToeicReadingPart[] = ["part5", "part6", "part7"];

function toRate(answered: number, total: number): number {
  return total === 0 ? 0 : Math.round((answered / total) * 100);
}

export function calculateQuestionReach(
  progressState: ProgressState,
  questions: QuestionReachQuestion[],
): QuestionReachSummary {
  const questionPartMap = new Map<string, ToeicReadingPart>();

  for (const question of questions) {
    if (!questionPartMap.has(question.questionId)) {
      questionPartMap.set(question.questionId, question.part);
    }
  }

  const answeredQuestionIds = new Set<string>();

  for (const answer of progressState.answers) {
    if (questionPartMap.has(answer.questionId)) {
      answeredQuestionIds.add(answer.questionId);
    }
  }

  const srsQuestionIds = new Set(Object.keys(progressState.srs));
  const partSummaries = readingParts.map((part): QuestionReachPartSummary => {
    const questionIds = Array.from(questionPartMap.entries())
      .filter(([, questionPart]) => questionPart === part)
      .map(([questionId]) => questionId);
    const answered = questionIds.filter((questionId) =>
      answeredQuestionIds.has(questionId),
    ).length;
    const mastered = questionIds.filter(
      (questionId) =>
        answeredQuestionIds.has(questionId) && !srsQuestionIds.has(questionId),
    ).length;
    const total = questionIds.length;

    return {
      part,
      total,
      answered,
      unanswered: total - answered,
      mastered,
      answeredRate: toRate(answered, total),
    };
  });
  const total = partSummaries.reduce((sum, part) => sum + part.total, 0);
  const answered = partSummaries.reduce((sum, part) => sum + part.answered, 0);
  const mastered = partSummaries.reduce((sum, part) => sum + part.mastered, 0);

  return {
    total,
    answered,
    unanswered: total - answered,
    mastered,
    answeredRate: toRate(answered, total),
    parts: partSummaries,
  };
}
