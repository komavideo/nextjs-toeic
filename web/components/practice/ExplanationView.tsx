"use client";

import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";
import type { GradeQuestionResult } from "@/lib/question-bank/grade";
import type { FlatQuestion } from "@/lib/question-bank/flatten";
import type { UpdateSrsResult } from "@/lib/srs/updateSrs";
import { ChoiceList } from "./ChoiceList";

type ExplanationViewProps = {
  question: FlatQuestion;
  answer: GradeQuestionResult;
  srsPreview: UpdateSrsResult;
  onNext: () => void;
};

export function ExplanationView({
  question,
  answer,
  srsPreview,
  onNext,
}: ExplanationViewProps) {
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

        <Button className="mt-5 w-full" onClick={onNext}>
          次へ
        </Button>
      </Panel>
    </section>
  );
}
