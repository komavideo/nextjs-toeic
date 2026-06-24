"use client";

import { useMemo } from "react";
import { Panel } from "@/components/shared/Panel";
import { flattenQuestionBankEntries } from "@/lib/question-bank/flatten";
import { getAllQuestionBankEntries } from "@/lib/question-bank";
import type { AnswerResult, SrsState } from "@/types/progress";

type ReviewListProps = {
  dueItems: SrsState[];
  answers: AnswerResult[];
};

export function ReviewList({ dueItems, answers }: ReviewListProps) {
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
  const sortedItems = useMemo(
    () =>
      [...dueItems].sort((left, right) =>
        left.dueDate.localeCompare(right.dueDate),
      ),
    [dueItems],
  );

  return (
    <Panel title={`今日の復習 ${sortedItems.length}件`}>
      <div className="grid gap-3">
        {sortedItems.map((item) => {
          const question = questionMap.get(item.questionId);
          const latestAnswer = latestAnswerMap.get(item.questionId);

          return (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
              key={item.questionId}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                <span>{question?.part.toUpperCase() ?? "不明"}</span>
                <span className="text-[var(--warning)]">期限 {item.dueDate}</span>
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
                {latestAnswer ? (latestAnswer.correct ? "正解" : "不正解") : "なし"}
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
