import type { AnswerResult, ProgressState } from "@/types/progress";

function toDateKey(value: string): string {
  return value.slice(0, 10);
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function nextStreakDays(state: ProgressState, answeredAt: string): number {
  const answeredDate = toDateKey(answeredAt);

  if (!state.lastStudiedDate) {
    return 1;
  }

  if (state.lastStudiedDate === answeredDate) {
    return state.currentStreakDays;
  }

  if (addDays(state.lastStudiedDate, 1) === answeredDate) {
    return state.currentStreakDays + 1;
  }

  return 1;
}

export function recordAnswer(
  state: ProgressState,
  answer: AnswerResult,
): ProgressState {
  return {
    ...state,
    totalAnswered: state.totalAnswered + 1,
    totalCorrect: state.totalCorrect + (answer.correct ? 1 : 0),
    currentStreakDays: nextStreakDays(state, answer.answeredAt),
    lastStudiedDate: toDateKey(answer.answeredAt),
    answers: [...state.answers, answer],
    srs: { ...state.srs },
  };
}
