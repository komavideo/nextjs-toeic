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

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateRecentDailyAnswerCounts(
  answers: AnswerResult[],
  today = new Date(),
): DailyAnswerCount[] {
  const counts = new Map<string, number>();

  for (const answer of answers) {
    const dateKey = toDateKey(new Date(answer.answeredAt));
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    date.setDate(date.getDate() - (6 - index));
    const dateKey = toDateKey(date);

    return {
      date: dateKey,
      count: counts.get(dateKey) ?? 0,
    };
  });
}
