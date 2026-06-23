import type { SrsState } from "@/types/progress";

type UpdateSrsInput = {
  questionId: string;
  correct: boolean;
  currentState?: SrsState;
  answeredAt?: string;
};

export type UpdateSrsResult =
  | { status: "scheduled"; state: SrsState }
  | { status: "mastered"; questionId: string };

const intervalSteps = [1, 3, 7, 14, 30] as const;

function toDateKey(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateTime: string, days: number): string {
  const dateKey = toDateKey(dateTime);
  const [year, month, day] = dateKey.split("-").map(Number);

  if ([year, month, day].some(Number.isNaN)) {
    return dateKey;
  }

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return toDateKey(date.toISOString());
}

function nextIntervalDays(currentState?: SrsState): SrsState["intervalDays"] {
  if (!currentState) {
    return 1;
  }

  const currentIndex = intervalSteps.indexOf(currentState.intervalDays);
  const nextIndex = Math.min(currentIndex + 1, intervalSteps.length - 1);
  return intervalSteps[nextIndex];
}

export function updateSrsState({
  questionId,
  correct,
  currentState,
  answeredAt = new Date().toISOString(),
}: UpdateSrsInput): UpdateSrsResult {
  if (correct && currentState?.intervalDays === 30) {
    return { status: "mastered", questionId };
  }

  const intervalDays = correct ? nextIntervalDays(currentState) : 1;

  return {
    status: "scheduled",
    state: {
      questionId,
      intervalDays,
      dueDate: addDaysToDateKey(answeredAt, intervalDays),
      correctStreak: correct ? (currentState?.correctStreak ?? 0) + 1 : 0,
      lastAnsweredAt: answeredAt,
    },
  };
}
