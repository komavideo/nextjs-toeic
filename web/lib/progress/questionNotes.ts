import type { ProgressState } from "@/types/progress";

export const questionNoteMaxLength = 200;

export type SaveQuestionNoteResult =
  | { ok: true; state: ProgressState; note: string | null }
  | { ok: false; reason: "too-long" };

export function getQuestionNote(
  state: ProgressState,
  questionId: string,
): string {
  return state.questionNotes[questionId] ?? "";
}

export function saveQuestionNote(
  state: ProgressState,
  questionId: string,
  note: string,
): SaveQuestionNoteResult {
  const normalizedNote = note.trim();

  if (normalizedNote.length > questionNoteMaxLength) {
    return { ok: false, reason: "too-long" };
  }

  if (normalizedNote.length === 0) {
    const { [questionId]: _removed, ...restNotes } = state.questionNotes;

    return {
      ok: true,
      state: { ...state, questionNotes: restNotes },
      note: null,
    };
  }

  return {
    ok: true,
    state: {
      ...state,
      questionNotes: {
        ...state.questionNotes,
        [questionId]: normalizedNote,
      },
    },
    note: normalizedNote,
  };
}

export function questionNoteSaveErrorMessage(
  phase: "load" | "save",
  storageUnavailable: boolean,
): string {
  if (storageUnavailable) {
    return "localStorage が利用できないため、学習メモを保存できませんでした。";
  }

  return phase === "load"
    ? "進捗データを読み込めないため、学習メモを保存できませんでした。"
    : "学習メモの保存に失敗しました。";
}
