import { createInitialProgressState } from "@/lib/progress/initialState";
import { questionNoteMaxLength } from "@/lib/progress/questionNotes";
import type {
  AnswerResult,
  LegacyProgressStorageKey,
  ProgressState,
  ProgressStateV1,
  ProgressStateV2,
  ProgressStorageKey,
  ProgressStorageKeyV2,
  SrsState,
  UnlockedBadges,
} from "@/types/progress";

type StoredProgressStateV2 = Omit<ProgressStateV2, "questionNotes"> & {
  questionNotes?: unknown;
};

type StoredProgressStateV3 = Omit<
  ProgressState,
  "questionNotes" | "unlockedBadges"
> & {
  questionNotes?: unknown;
  unlockedBadges?: unknown;
};

type NormalizedProgressStateV3 = {
  state: ProgressState;
  repaired: boolean;
};

export const progressStorageKey: ProgressStorageKey = "toeicReadingProgress:v3";
export const progressStorageKeyV2: ProgressStorageKeyV2 =
  "toeicReadingProgress:v2";
export const legacyProgressStorageKey: LegacyProgressStorageKey =
  "toeicReadingProgress:v1";

export type LoadProgressResult =
  | { ok: true; state: ProgressState; source: "empty" | "storage" | "migration" }
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

function isQuestionNotesRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([questionId, note]) =>
      questionId.length > 0 &&
      typeof note === "string" &&
      note.trim().length > 0 &&
      note.length <= questionNoteMaxLength,
  );
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
    isStringArray(value.tags) &&
    (value.sessionId === undefined ||
      (typeof value.sessionId === "string" && value.sessionId.length > 0))
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

function hasValidProgressBase(
  value: unknown,
): value is ProgressStateV1 | ProgressStateV2 | ProgressState {
  if (!isRecord(value)) {
    return false;
  }

  const state = value as Partial<
    ProgressStateV1 | ProgressStateV2 | ProgressState
  >;
  const answers = Array.isArray(state.answers) ? state.answers : [];
  const srsValues = isRecord(state.srs) ? Object.values(state.srs) : [];
  const totalCorrect = answers.filter(
    (answer) => isRecord(answer) && answer.correct === true,
  ).length;

  return (
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

function isProgressStateV1(value: unknown): value is ProgressStateV1 {
  return isRecord(value) && value.version === 1 && hasValidProgressBase(value);
}

function isStoredProgressStateV2(
  value: unknown,
): value is StoredProgressStateV2 {
  const bookmarkedQuestionIds = isRecord(value)
    ? (value as { bookmarkedQuestionIds?: unknown }).bookmarkedQuestionIds
    : undefined;

  return (
    isRecord(value) &&
    value.version === 2 &&
    hasValidProgressBase(value) &&
    isStringArray(bookmarkedQuestionIds)
  );
}

function isStoredProgressStateV3(
  value: unknown,
): value is StoredProgressStateV3 {
  const bookmarkedQuestionIds = isRecord(value)
    ? (value as { bookmarkedQuestionIds?: unknown }).bookmarkedQuestionIds
    : undefined;

  return (
    isRecord(value) &&
    value.version === 3 &&
    hasValidProgressBase(value) &&
    isStringArray(bookmarkedQuestionIds)
  );
}

// 学習メモを補完/検証する。未保存(undefined)は空オブジェクトへ、壊れている場合は
// 進捗全体を無効と判断するため undefined を返す（呼び出し側で version-mismatch にする）。
function normalizeQuestionNotes(
  value: unknown,
): Record<string, string> | undefined {
  if (value === undefined) {
    return {};
  }

  if (!isQuestionNotesRecord(value)) {
    return undefined;
  }

  return value;
}

// バッジは定義からいつでも再導出できるため緩く扱う。ISO 日時のエントリだけを採用し、
// 壊れている値・未保存は空オブジェクトにフォールバックする（進捗全体は無効にしない）。
function normalizeUnlockedBadges(value: unknown): UnlockedBadges {
  if (!isRecord(value)) {
    return {};
  }

  const normalized: UnlockedBadges = {};

  for (const [badgeId, unlockedAt] of Object.entries(value)) {
    if (badgeId.length > 0 && isIsoDateTime(unlockedAt)) {
      normalized[badgeId] = unlockedAt;
    }
  }

  return normalized;
}

function normalizeProgressState(
  value: unknown,
): NormalizedProgressStateV3 | undefined {
  if (!isStoredProgressStateV3(value)) {
    return undefined;
  }

  const questionNotes = normalizeQuestionNotes(value.questionNotes);
  const unlockedBadges = normalizeUnlockedBadges(value.unlockedBadges);

  if (questionNotes === undefined) {
    return undefined;
  }

  return {
    state: {
      ...value,
      questionNotes,
      unlockedBadges,
    },
    repaired:
      value.questionNotes === undefined ||
      !isRecord(value.unlockedBadges) ||
      Object.keys(value.unlockedBadges).length !==
        Object.keys(unlockedBadges).length,
  };
}

// v2 保存データを検証し、学習メモを補完/検証した正規の v2 状態を返す（移行元として使う）。
function normalizeStoredProgressStateV2(
  value: unknown,
): ProgressStateV2 | undefined {
  if (!isStoredProgressStateV2(value)) {
    return undefined;
  }

  const questionNotes = normalizeQuestionNotes(value.questionNotes);

  if (questionNotes === undefined) {
    return undefined;
  }

  return { ...value, questionNotes };
}

function migrateProgressStateV1toV2(state: ProgressStateV1): ProgressStateV2 {
  return {
    version: 2,
    totalAnswered: state.totalAnswered,
    totalCorrect: state.totalCorrect,
    currentStreakDays: state.currentStreakDays,
    ...(state.lastStudiedDate ? { lastStudiedDate: state.lastStudiedDate } : {}),
    answers: state.answers,
    srs: state.srs,
    bookmarkedQuestionIds: [],
    questionNotes: {},
  };
}

function migrateProgressStateV2toV3(
  state: ProgressStateV2,
  unlockedBadges: UnlockedBadges = {},
): ProgressState {
  return { ...state, version: 3, unlockedBadges };
}

function toProgressStateV2(state: ProgressState): ProgressStateV2 {
  const { unlockedBadges: _unlockedBadges, ...v2State } = state;

  return { ...v2State, version: 2 };
}

function latestAnsweredAtMs(
  state: Pick<ProgressState | ProgressStateV2, "answers">,
): number {
  return state.answers.reduce((latest, answer) => {
    const time = new Date(answer.answeredAt).getTime();
    return Number.isNaN(time) ? latest : Math.max(latest, time);
  }, 0);
}

function shouldPreferV2Progress(
  v2State: ProgressStateV2,
  v3State: ProgressState,
): boolean {
  if (v2State.totalAnswered !== v3State.totalAnswered) {
    return v2State.totalAnswered > v3State.totalAnswered;
  }

  return latestAnsweredAtMs(v2State) > latestAnsweredAtMs(v3State);
}

function areEquivalentV2States(
  left: ProgressStateV2,
  right: ProgressStateV2,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function tryNormalizeStoredProgressStateV2(
  rawValue: string | null,
): ProgressStateV2 | undefined {
  if (rawValue === null) {
    return undefined;
  }

  try {
    return normalizeStoredProgressStateV2(JSON.parse(rawValue));
  } catch {
    return undefined;
  }
}

// v3 キーへ保存し、ロールバック用に v2 互換スナップショットも維持する。
// 補完・移行保存に失敗しても、読み込めた進捗は画面上で利用できるようにする。
function persistProgressState(
  storage: Storage,
  state: ProgressState,
): void {
  try {
    storage.setItem(progressStorageKey, JSON.stringify(state));
    storage.setItem(
      progressStorageKeyV2,
      JSON.stringify(toProgressStateV2(state)),
    );
  } catch {
    // 保存に失敗しても読み込み結果は返す。
  }
}

export function loadProgressState(): LoadProgressResult {
  const storage = getLocalStorage();

  if (!storage) {
    return { ok: false, reason: "unavailable" };
  }

  let rawValue: string | null;
  let v2RawValue: string | null;

  try {
    rawValue = storage.getItem(progressStorageKey);
    v2RawValue = storage.getItem(progressStorageKeyV2);
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (rawValue !== null) {
    try {
      const parsedValue: unknown = JSON.parse(rawValue);
      const normalizedResult = normalizeProgressState(parsedValue);

      if (!normalizedResult) {
        return { ok: false, reason: "version-mismatch" };
      }

      const normalizedState = normalizedResult.state;
      const normalizedV2 = tryNormalizeStoredProgressStateV2(v2RawValue);

      if (
        normalizedV2 &&
        shouldPreferV2Progress(normalizedV2, normalizedState)
      ) {
        const migratedState = migrateProgressStateV2toV3(
          normalizedV2,
          normalizedState.unlockedBadges,
        );
        persistProgressState(storage, migratedState);

        return { ok: true, state: migratedState, source: "migration" };
      }

      const compatibleV2State = toProgressStateV2(normalizedState);
      if (
        normalizedResult.repaired ||
        !normalizedV2 ||
        !areEquivalentV2States(normalizedV2, compatibleV2State)
      ) {
        persistProgressState(storage, normalizedState);
      }

      return { ok: true, state: normalizedState, source: "storage" };
    } catch {
      return { ok: false, reason: "parse-error" };
    }
  }

  if (v2RawValue !== null) {
    try {
      const parsedValue: unknown = JSON.parse(v2RawValue);
      const normalizedV2 = normalizeStoredProgressStateV2(parsedValue);

      if (!normalizedV2) {
        return { ok: false, reason: "version-mismatch" };
      }

      const migratedState = migrateProgressStateV2toV3(normalizedV2);
      persistProgressState(storage, migratedState);

      return { ok: true, state: migratedState, source: "migration" };
    } catch {
      return { ok: false, reason: "parse-error" };
    }
  }

  let legacyRawValue: string | null;

  try {
    legacyRawValue = storage.getItem(legacyProgressStorageKey);
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (legacyRawValue === null) {
    return { ok: true, state: createInitialProgressState(), source: "empty" };
  }

  try {
    const parsedValue: unknown = JSON.parse(legacyRawValue);

    if (!isProgressStateV1(parsedValue)) {
      return { ok: false, reason: "version-mismatch" };
    }

    const migratedState = migrateProgressStateV2toV3(
      migrateProgressStateV1toV2(parsedValue),
    );
    persistProgressState(storage, migratedState);

    return { ok: true, state: migratedState, source: "migration" };
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
    storage.setItem(
      progressStorageKeyV2,
      JSON.stringify(toProgressStateV2(state)),
    );
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
    storage.removeItem(progressStorageKeyV2);
    storage.removeItem(legacyProgressStorageKey);
    return { ok: true };
  } catch {
    return { ok: false, reason: "remove-failed" };
  }
}
