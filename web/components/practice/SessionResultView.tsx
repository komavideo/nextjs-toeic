"use client";

import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";
import type { AnswerResult } from "@/types/progress";

type SessionResultViewProps = {
  answers: AnswerResult[];
  totalCorrect: number;
  totalAnswered: number;
  elapsedMs: number;
  reviewScheduledCount: number;
  onRestart: () => void;
};

function formatElapsed(elapsedMs: number): string {
  const seconds = Math.max(Math.round(elapsedMs / 1000), 0);
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return `${minutes}分${restSeconds.toString().padStart(2, "0")}秒`;
}

export function SessionResultView({
  answers,
  totalCorrect,
  totalAnswered,
  elapsedMs,
  reviewScheduledCount,
  onRestart,
}: SessionResultViewProps) {
  const accuracy =
    totalAnswered === 0 ? 0 : Math.round((totalCorrect / totalAnswered) * 100);
  const wrongAnswers = answers.filter((answer) => !answer.correct);

  return (
    <section className="mx-auto max-w-[720px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">screen-result</p>
      <h1 className="text-2xl font-bold leading-8">セッション結果</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Panel>
          <div className="text-2xl font-bold">
            {totalCorrect}/{totalAnswered}
          </div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">正答数</div>
        </Panel>
        <Panel>
          <div className="text-2xl font-bold">{accuracy}%</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">正答率</div>
        </Panel>
        <Panel>
          <div className="text-2xl font-bold">{formatElapsed(elapsedMs)}</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">所要時間</div>
        </Panel>
      </div>

      <Panel className="mt-4" title="誤答一覧">
        {wrongAnswers.length > 0 ? (
          <ul className="grid gap-2 text-sm leading-5 text-[var(--text-secondary)]">
            {wrongAnswers.map((answer) => (
              <li key={`${answer.questionId}-${answer.answeredAt}`}>
                {answer.questionId}: 選択 {answer.selectedChoiceId}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-5 text-[var(--text-secondary)]">
            誤答はありません。
          </p>
        )}
      </Panel>

      <p className="mt-4 text-sm leading-5 text-[var(--text-secondary)]">
        復習予定追加数: {reviewScheduledCount}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Button href="/review" variant="secondary">
          復習する
        </Button>
        <Button onClick={onRestart}>もう1セット</Button>
        <Button href="/" variant="tertiary">
          ホームへ戻る
        </Button>
      </div>
    </section>
  );
}
