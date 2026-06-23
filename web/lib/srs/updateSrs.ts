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

function addDaysToDateKey(dateTime: string, days: number): string {
  const dateKey = dateTime.slice(0, 10);
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
