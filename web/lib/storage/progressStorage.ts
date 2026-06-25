import { createInitialProgressState } from "@/lib/progress/initialState";
import type {
  AnswerResult,
  ProgressState,
  ProgressStorageKey,
  SrsState,
} from "@/types/progress";

export const progressStorageKey: ProgressStorageKey = "toeicReadingProgress:v1";

export type LoadProgressResult =
  | { ok: true; state: ProgressState; source: "empty" | "storage" }
  | { ok: false; reason: "unavailable" | "parse-error" | "version-mismatch" };

export type SaveProgressResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "write-failed" };

export type ClearProgressResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "remove-failed" };

const validParts = new Set(["part5", "part6", "part7"]);
const validChoiceIds = new Set(["A", "B", "C", "D"]);
const validIntervals = new Set([1, 3, 7, 14, 30]);

function getLocalStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function isAnswerResult(value: unknown): value is AnswerResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.questionId === "string" &&
    value.questionId.length > 0 &&
    validParts.has(value.part as string) &&
    validChoiceIds.has(value.selectedChoiceId as string) &&
    typeof value.correct === "boolean" &&
    isIsoDateTime(value.answeredAt) &&
    isNonNegativeInteger(value.elapsedMs) &&
    isStringArray(value.tags)
  );
}

function isSrsState(value: unknown): value is SrsState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.questionId === "string" &&
    value.questionId.length > 0 &&
    validIntervals.has(value.intervalDays as number) &&
    isDateKey(value.dueDate) &&
    isNonNegativeInteger(value.correctStreak) &&
    isIsoDateTime(value.lastAnsweredAt)
  );
}

function isProgressState(value: unknown): value is ProgressState {
  if (!isRecord(value)) {
    return false;
  }

  const state = value as Partial<ProgressState>;
  const answers = Array.isArray(state.answers) ? state.answers : [];
  const srsValues = isRecord(state.srs) ? Object.values(state.srs) : [];
  const totalCorrect = answers.filter(
    (answer) => isRecord(answer) && answer.correct === true,
  ).length;

  return (
    state.version === 1 &&
    isNonNegativeInteger(state.totalAnswered) &&
    isNonNegativeInteger(state.totalCorrect) &&
    state.totalAnswered === answers.length &&
    state.totalCorrect === totalCorrect &&
    isNonNegativeInteger(state.currentStreakDays) &&
    (state.lastStudiedDate === undefined || isDateKey(state.lastStudiedDate)) &&
    Array.isArray(state.answers) &&
    state.answers.every(isAnswerResult) &&
    isRecord(state.srs) &&
    srsValues.every(isSrsState)
  );
}

export function loadProgressState(): LoadProgressResult {
  const storage = getLocalStorage();

  if (!storage) {
    return { ok: false, reason: "unavailable" };
  }

  let rawValue: string | null;

  try {
    rawValue = storage.getItem(progressStorageKey);
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (rawValue === null) {
    return { ok: true, state: createInitialProgressState(), source: "empty" };
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isProgressState(parsedValue)) {
      return { ok: false, reason: "version-mismatch" };
    }

    return { ok: true, state: parsedValue, source: "storage" };
  } catch {
    return { ok: false, reason: "parse-error" };
  }
}

export function saveProgressState(state: ProgressState): SaveProgressResult {
  const storage = getLocalStorage();

  if (!storage) {
    return { ok: false, reason: "unavailable" };
  }

  try {
    storage.setItem(progressStorageKey, JSON.stringify(state));
    return { ok: true };
  } catch {
    return { ok: false, reason: "write-failed" };
  }
}

export function clearProgressState(): ClearProgressResult {
  const storage = getLocalStorage();

  if (!storage) {
    return { ok: false, reason: "unavailable" };
  }

  try {
    storage.removeItem(progressStorageKey);
    return { ok: true };
  } catch {
    return { ok: false, reason: "remove-failed" };
  }
}
