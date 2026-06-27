"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";
import type { GradeQuestionResult } from "@/lib/question-bank/grade";
import type { FlatQuestion } from "@/lib/question-bank/flatten";
import { questionNoteMaxLength } from "@/lib/progress/questionNotes";
import type { UpdateSrsResult } from "@/lib/srs/updateSrs";
import { ChoiceList } from "./ChoiceList";

type ExplanationViewProps = {
  question: FlatQuestion;
  answer: GradeQuestionResult;
  srsPreview: UpdateSrsResult;
  bookmarked: boolean;
  note: string;
  bookmarkError?: string | null;
  noteError?: string | null;
  noteFeedback?: string | null;
  onSaveNote: (note: string) => void;
  onToggleBookmark: () => void;
  onNext: () => void;
};

export function ExplanationView({
  question,
  answer,
  srsPreview,
  bookmarked,
  note,
  bookmarkError,
  noteError,
  noteFeedback,
  onSaveNote,
  onToggleBookmark,
  onNext,
}: ExplanationViewProps) {
  const [noteDraft, setNoteDraft] = useState(note);
  const noteInputId = `question-note-${question.questionId}`;
  const noteStatusId = `${noteInputId}-status`;
  const hasUnsavedNote = noteDraft !== note;

  useEffect(() => {
    setNoteDraft(note);
  }, [note, question.questionId]);

  return (
    <section className="mx-auto max-w-[720px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
        screen-explain
      </p>
      <Panel title="解答・解説">
        <div
          className={[
            "rounded-[var(--radius-md)] px-4 py-3 text-base font-bold",
            answer.correct
              ? "bg-[var(--success-soft)] text-[var(--success)]"
              : "bg-[var(--danger-soft)] text-[var(--danger)]",
          ].join(" ")}
        >
          {answer.correct ? "正解" : "不正解"}
        </div>

        <div className="mt-5">
          <ChoiceList
            choices={question.choices}
            correctChoiceId={answer.correctChoiceId}
            disabled
            selectedChoiceId={answer.selectedChoiceId}
          />
        </div>

        <dl className="mt-5 grid gap-3 text-sm leading-5">
          <div>
            <dt className="font-semibold">あなたの選択</dt>
            <dd className="text-[var(--text-secondary)]">
              {answer.selectedChoiceId}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">正解</dt>
            <dd className="text-[var(--text-secondary)]">
              {answer.correctChoiceId}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] p-4">
          <h2 className="text-sm font-bold">解説</h2>
          <p className="mt-2 text-base leading-[26px]">{answer.explanation}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {answer.tags.map((tag) => (
            <span
              className="rounded-[var(--radius-sm)] bg-[var(--primary-soft)] px-2 py-1 text-xs font-semibold text-[var(--primary)]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-5 text-sm leading-5 text-[var(--text-secondary)]">
          {srsPreview.status === "mastered"
            ? "この問題は定着済みとして扱われます。"
            : `復習予定: ${srsPreview.state.dueDate}`}
        </p>

        <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] p-4">
          <label className="text-sm font-bold" htmlFor={noteInputId}>
            学習メモ
          </label>
          <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
            誤答理由や覚え方を短く残せます。空のまま保存すると削除します。
          </p>
          <textarea
            aria-describedby={noteStatusId}
            className="mt-3 min-h-28 w-full resize-y rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 outline-none focus:border-[var(--primary)]"
            id={noteInputId}
            maxLength={questionNoteMaxLength}
            onChange={(event) => setNoteDraft(event.target.value)}
            value={noteDraft}
          />
          <div
            className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]"
            id={noteStatusId}
          >
            <span>{noteDraft.length}/{questionNoteMaxLength}文字</span>
            {hasUnsavedNote ? (
              <span className="font-semibold text-[var(--warning)]">
                未保存の変更があります。
              </span>
            ) : null}
          </div>
          <Button className="mt-3" onClick={() => onSaveNote(noteDraft)}>
            メモを保存
          </Button>
          {noteFeedback && !hasUnsavedNote ? (
            <p
              className="mt-3 text-sm font-semibold text-[var(--success)]"
              role="status"
            >
              {noteFeedback}
            </p>
          ) : null}
          {noteError ? (
            <p
              className="mt-3 text-sm font-semibold text-[var(--danger)]"
              role="alert"
            >
              {noteError}
            </p>
          ) : null}
        </div>

        <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">ブックマーク</h2>
              <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                あとで見直したい問題として保存します。
              </p>
            </div>
            <Button
              onClick={onToggleBookmark}
              variant={bookmarked ? "secondary" : "tertiary"}
            >
              {bookmarked ? "ブックマーク解除" : "ブックマークする"}
            </Button>
          </div>
          {bookmarkError ? (
            <p
              className="mt-3 text-sm font-semibold text-[var(--danger)]"
              role="alert"
            >
              {bookmarkError}
            </p>
          ) : null}
        </div>

        <Button className="mt-5 w-full" onClick={onNext}>
          次へ
        </Button>
      </Panel>
    </section>
  );
}
