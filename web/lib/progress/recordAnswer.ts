import type { AnswerResult, ProgressState } from "@/types/progress";

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

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);

  if ([year, month, day].some(Number.isNaN)) {
    return dateKey;
  }

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return toDateKey(date.toISOString());
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
