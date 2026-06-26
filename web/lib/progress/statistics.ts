import type { AnswerResult } from "@/types/progress";
import type { ToeicReadingPart } from "@/types/question";

const readingParts: ToeicReadingPart[] = ["part5", "part6", "part7"];

export type PartStatistic = {
  part: ToeicReadingPart;
  answered: number;
  correct: number;
  accuracy: number;
};

export type TagStatistic = {
  tag: string;
  answered: number;
  correct: number;
  accuracy: number;
};

export type TagDetailQuestion = {
  questionId: string;
  part: ToeicReadingPart;
  sentence?: string;
  title?: string;
  prompt: string;
  tags: string[];
};

export type TagIncorrectAnswer = {
  questionId: string;
  part: ToeicReadingPart;
  selectedChoiceId: AnswerResult["selectedChoiceId"];
  answeredAt: string;
  summary: string;
};

export type TagDetailStatistic = {
  tag: string;
  answered: number;
  correct: number;
  accuracy: number;
  partStatistics: PartStatistic[];
  incorrectAnswers: TagIncorrectAnswer[];
  weakestPart?: ToeicReadingPart;
  firstAvailablePart?: ToeicReadingPart;
  practicePart?: ToeicReadingPart;
  relatedParts: ToeicReadingPart[];
};

export type DailyAnswerCount = {
  date: string;
  count: number;
};

function toAccuracy(correct: number, answered: number): number {
  return answered === 0 ? 0 : Math.round((correct / answered) * 100);
}

export function calculatePartStatistics(
  answers: AnswerResult[],
): PartStatistic[] {
  return readingParts.map((part) => {
    const partAnswers = answers.filter((answer) => answer.part === part);
    const correct = partAnswers.filter((answer) => answer.correct).length;

    return {
      part,
      answered: partAnswers.length,
      correct,
      accuracy: toAccuracy(correct, partAnswers.length),
    };
  });
}

export function calculateTagWeaknessStatistics(
  answers: AnswerResult[],
): TagStatistic[] {
  const tagMap = new Map<string, { answered: number; correct: number }>();

  for (const answer of answers) {
    for (const tag of answer.tags) {
      const current = tagMap.get(tag) ?? { answered: 0, correct: 0 };
      tagMap.set(tag, {
        answered: current.answered + 1,
        correct: current.correct + (answer.correct ? 1 : 0),
      });
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, value]) => ({
      tag,
      answered: value.answered,
      correct: value.correct,
      accuracy: toAccuracy(value.correct, value.answered),
    }))
    .sort((left, right) => left.accuracy - right.accuracy || left.tag.localeCompare(right.tag));
}

function sortPartsByReadingOrder(parts: ToeicReadingPart[]): ToeicReadingPart[] {
  return [...parts].sort(
    (left, right) => readingParts.indexOf(left) - readingParts.indexOf(right),
  );
}

function getQuestionSummary(
  question: TagDetailQuestion | undefined,
  questionId: string,
): string {
  return question?.sentence ?? question?.title ?? question?.prompt ?? questionId;
}

function getWeakestPart(partStatistics: PartStatistic[]): ToeicReadingPart | undefined {
  return partStatistics
    .filter((statistic) => statistic.answered > 0)
    .sort(
      (left, right) =>
        left.correct / left.answered - right.correct / right.answered ||
        readingParts.indexOf(left.part) - readingParts.indexOf(right.part),
    )[0]?.part;
}

export function calculateTagDetailStatistic(
  answers: AnswerResult[],
  questions: TagDetailQuestion[],
  tag: string,
  incorrectLimit = 5,
): TagDetailStatistic {
  const tagAnswers = answers.filter((answer) => answer.tags.includes(tag));
  const questionMap = new Map(
    questions.map((question) => [question.questionId, question]),
  );
  const relatedParts = sortPartsByReadingOrder(
    Array.from(
      new Set(
        questions
          .filter((question) => question.tags.includes(tag))
          .map((question) => question.part),
      ),
    ),
  );
  const correct = tagAnswers.filter((answer) => answer.correct).length;
  // tagAnswers は既に対象タグで絞り込み済みのため、Part 別集計は共通関数を再利用する。
  const partStatistics = calculatePartStatistics(tagAnswers);
  const incorrectAnswers = tagAnswers
    .filter((answer) => !answer.correct)
    .sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))
    .slice(0, incorrectLimit)
    .map((answer) => ({
      questionId: answer.questionId,
      part: answer.part,
      selectedChoiceId: answer.selectedChoiceId,
      answeredAt: answer.answeredAt,
      summary: getQuestionSummary(questionMap.get(answer.questionId), answer.questionId),
    }));
  // weakestPart は回答実績のある全 Part 横断での最弱 Part（表示・診断用の参考値）。
  const weakestPart = getWeakestPart(partStatistics);
  // firstAvailablePart は問題バンク上で最初に見つかった出題可能 Part（読解順で先頭）。
  const firstAvailablePart = relatedParts[0];
  // practicePart は「出題可能な Part のうち最も苦手な Part」を選ぶ。
  // 回答履歴がない、または最弱 Part の問題が現存しない場合は firstAvailablePart にフォールバックする。
  const weakestAvailablePart = getWeakestPart(
    partStatistics.filter((statistic) => relatedParts.includes(statistic.part)),
  );
  const practicePart = weakestAvailablePart ?? firstAvailablePart;

  return {
    tag,
    answered: tagAnswers.length,
    correct,
    accuracy: toAccuracy(correct, tagAnswers.length),
    partStatistics,
    incorrectAnswers,
    weakestPart,
    firstAvailablePart,
    practicePart,
    relatedParts,
  };
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 直近 dayCount 日分の日別回答数を、古い日付から今日の順で集計する。
 * 日付は回答時点のローカル暦日（toDateKey と同じローカルタイム解釈）で揃える。
 * @param answers 回答履歴
 * @param today 基準日（既定: 実行時の現在日時）
 * @param dayCount 集計対象の日数（既定: 7。今日を含む）
 * @returns 各日の { date: "YYYY-MM-DD", count } を dayCount 件、昇順で返す
 */
export function calculateRecentDailyAnswerCounts(
  answers: AnswerResult[],
  today = new Date(),
  dayCount = 7,
): DailyAnswerCount[] {
  const counts = new Map<string, number>();

  for (const answer of answers) {
    const dateKey = toDateKey(new Date(answer.answeredAt));
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  }

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    date.setDate(date.getDate() - (dayCount - 1 - index));
    const dateKey = toDateKey(date);

    return {
      date: dateKey,
      count: counts.get(dateKey) ?? 0,
    };
  });
}
