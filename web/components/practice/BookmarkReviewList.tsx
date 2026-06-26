"use client";

import { Panel } from "@/components/shared/Panel";
import type { FlatQuestion } from "@/lib/question-bank/flatten";
import type { AnswerResult } from "@/types/progress";

type BookmarkReviewListProps = {
  questions: FlatQuestion[];
  answers: AnswerResult[];
};

export function BookmarkReviewList({
  questions,
  answers,
}: BookmarkReviewListProps) {
  const latestAnswerMap = new Map<string, AnswerResult>();

  for (const answer of answers) {
    latestAnswerMap.set(answer.questionId, answer);
  }

  return (
    <Panel title={`ブックマーク復習 ${questions.length}件`}>
      <p className="text-sm leading-5 text-[var(--text-secondary)]">
        期限到来とは別に、見直したい問題だけを復習できます。
      </p>
      <div className="mt-4 grid gap-3">
        {questions.map((question) => {
          const latestAnswer = latestAnswerMap.get(question.questionId);

          return (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
              key={question.questionId}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                <span>{question.part.toUpperCase()}</span>
                <span className="text-[var(--text-muted)]">
                  {question.questionId}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {question.tags.map((tag) => (
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
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
