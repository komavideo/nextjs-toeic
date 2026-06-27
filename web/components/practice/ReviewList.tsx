"use client";

import { useMemo } from "react";
import { Panel } from "@/components/shared/Panel";
import { flattenQuestionBankEntries } from "@/lib/question-bank/flatten";
import { getAllQuestionBankEntries } from "@/lib/question-bank";
import type { SrsDueDateGroups } from "@/lib/srs/due";
import type { AnswerResult, SrsState } from "@/types/progress";

type ReviewListProps = {
  dueDateGroups: SrsDueDateGroups;
  answers: AnswerResult[];
  questionNotes: Record<string, string>;
};

type ReviewSection = {
  key: keyof SrsDueDateGroups;
  label: string;
  description: string;
  items: SrsState[];
};

export function ReviewList({
  dueDateGroups,
  answers,
  questionNotes,
}: ReviewListProps) {
  const questionMap = useMemo(
    () =>
      new Map(
        flattenQuestionBankEntries(getAllQuestionBankEntries()).map((question) => [
          question.questionId,
          question,
        ]),
      ),
    [],
  );
  const latestAnswerMap = useMemo(() => {
    const answerMap = new Map<string, AnswerResult>();

    for (const answer of answers) {
      answerMap.set(answer.questionId, answer);
    }

    return answerMap;
  }, [answers]);
  const sections: ReviewSection[] = [
    {
      key: "overdue",
      label: "期限切れ",
      description: "優先して復習します。",
      items: dueDateGroups.overdue,
    },
    {
      key: "today",
      label: "今日",
      description: "今日の復習キューに含まれます。",
      items: dueDateGroups.today,
    },
    {
      key: "future",
      label: "明日以降",
      description: "復習開始にはまだ含めません。",
      items: dueDateGroups.future,
    },
  ];
  const totalCount = sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );

  return (
    <Panel title={`復習予定 ${totalCount}件`}>
      <div className="grid grid-cols-3 gap-2">
        {sections.map((section) => (
          <div
            className="rounded-[var(--radius-md)] bg-[var(--surface-subtle)] p-3"
            key={section.key}
          >
            <div className="text-xl font-bold">{section.items.length}</div>
            <div className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
              {section.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5">
        {sections.map((section) =>
          section.items.length === 0 ? null : (
            <section key={section.key}>
              <div className="mb-2">
                <h2 className="text-sm font-bold">
                  {section.label} {section.items.length}件
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {section.description}
                </p>
              </div>
              <div className="grid gap-3">
                {section.items.map((item) => {
                  const question = questionMap.get(item.questionId);
                  const latestAnswer = latestAnswerMap.get(item.questionId);
                  const note = questionNotes[item.questionId];

                  return (
                    <div
                      className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
                      key={item.questionId}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                        <span>{question?.part.toUpperCase() ?? "不明"}</span>
                        <span className="text-[var(--warning)]">
                          期限 {item.dueDate}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(question?.tags ?? []).map((tag) => (
                          <span
                            className="rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        直近結果:{" "}
                        {latestAnswer
                          ? latestAnswer.correct
                            ? "正解"
                            : "不正解"
                          : "なし"}
                      </p>
                      {note ? (
                        <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] p-3">
                          <div className="text-xs font-semibold text-[var(--text-muted)]">
                            学習メモ
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-[var(--text-secondary)]">
                            {note}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ),
        )}
      </div>
    </Panel>
  );
}
