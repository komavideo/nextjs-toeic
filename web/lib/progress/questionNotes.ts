import type { ProgressState } from "@/types/progress";

export const questionNoteMaxLength = 200;

export type SaveQuestionNoteResult =
  | { ok: true; state: ProgressState; note: string | null }
  | { ok: false; reason: "too-long" };

type LoadQuestionNoteProgressResult =
  | { ok: true; state: ProgressState }
  | { ok: false; reason: "unavailable" | "parse-error" | "version-mismatch" };

type SaveQuestionNoteProgressResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "write-failed" };

export type PersistQuestionNoteResult =
  | { ok: true; state: ProgressState; feedback: string }
  | { ok: false; error: string };

type PersistQuestionNoteOptions = {
  questionId: string;
  note: string;
  loadProgressState: () => LoadQuestionNoteProgressResult;
  saveProgressState: (state: ProgressState) => SaveQuestionNoteProgressResult;
};

export type QuestionNoteSaveViewResult =
  | {
      ok: true;
      questionNotes: ProgressState["questionNotes"];
      noteError: null;
      noteFeedback: string;
    }
  | {
      ok: false;
      noteError: string;
      noteFeedback: null;
    };

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

export function persistQuestionNote({
  questionId,
  note,
  loadProgressState,
  saveProgressState,
}: PersistQuestionNoteOptions): PersistQuestionNoteResult {
  const loadResult = loadProgressState();

  if (!loadResult.ok) {
    return {
      ok: false,
      error: questionNoteSaveErrorMessage(
        "load",
        loadResult.reason === "unavailable",
      ),
    };
  }

  const noteResult = saveQuestionNote(loadResult.state, questionId, note);

  if (!noteResult.ok) {
    return {
      ok: false,
      error: "学習メモは200文字以内で入力してください。",
    };
  }

  const saveResult = saveProgressState(noteResult.state);

  if (!saveResult.ok) {
    return {
      ok: false,
      error: questionNoteSaveErrorMessage(
        "save",
        saveResult.reason === "unavailable",
      ),
    };
  }

  return {
    ok: true,
    state: noteResult.state,
    feedback:
      noteResult.note === null
        ? "学習メモを削除しました。"
        : "学習メモを保存しました。",
  };
}

export function saveQuestionNoteForView(
  options: PersistQuestionNoteOptions,
): QuestionNoteSaveViewResult {
  const result = persistQuestionNote(options);

  if (!result.ok) {
    return {
      ok: false,
      noteError: result.error,
      noteFeedback: null,
    };
  }

  return {
    ok: true,
    questionNotes: result.state.questionNotes,
    noteError: null,
    noteFeedback: result.feedback,
  };
}
