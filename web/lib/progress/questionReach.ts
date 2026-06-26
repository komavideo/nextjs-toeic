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

// 到達率(%)を整数で算出する。未回答が残る場合は 100% 表示にしない。
function toRate(answered: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  if (answered >= total) {
    return 100;
  }

  return Math.floor((answered / total) * 100);
}

/**
 * 進捗状態から問題到達率（全体・Part 別）を集計する。
 *
 * 各指標の定義:
 * - 回答済み: answers に1回以上回答が記録された questionId（重複回答は1件として数える）
 * - 未回答  : 問題リストに存在するが answers に含まれない questionId
 * - 定着済み: 回答済みかつ SRS スケジュール（srs のキー）に残っていない questionId。
 *   30日間隔をクリアして SRS から外れた問題 = 十分に定着した問題とみなす。
 * - 到達率  : 回答済み / 総数 × 100（整数 %）
 *
 * @param progressState 回答履歴と SRS 状態を持つ進捗データ
 * @param questions 全問題の questionId と Part の対応リスト（ビルド時に確定）
 */
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
