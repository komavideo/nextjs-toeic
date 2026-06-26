"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { createInitialProgressState } from "@/lib/progress/initialState";
import {
  calculateTagDetailStatistic,
  type TagDetailQuestion,
} from "@/lib/progress/statistics";
import { buildTagPracticeHref } from "@/lib/progress/tagLinks";
import { loadProgressState } from "@/lib/storage/progressStorage";
import type { ProgressState } from "@/types/progress";
import type { ToeicReadingPart } from "@/types/question";

type LoadError = {
  message: string;
  storageUnavailable: boolean;
};

type TagDetailClientProps = {
  questions: TagDetailQuestion[];
};

function formatPart(part: ToeicReadingPart): string {
  return part.toUpperCase().replace("PART", "Part ");
}

export function TagDetailClient({ questions }: TagDetailClientProps) {
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag") ?? "";
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);

  const loadProgress = useCallback(() => {
    const result = loadProgressState();

    if (result.ok) {
      setProgressState(result.state);
      setLoadError(null);
      return;
    }

    setLoadError({
      message: "進捗データを読み込めませんでした。",
      storageUnavailable: result.reason === "unavailable",
    });
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  if (loadError) {
    return (
      <ErrorState
        message={loadError.message}
        onInitialized={() => {
          setProgressState(createInitialProgressState());
          setLoadError(null);
        }}
        onRetry={loadProgress}
        storageUnavailable={loadError.storageUnavailable}
        title="進捗データエラー"
      />
    );
  }

  const state = progressState ?? createInitialProgressState();

  if (!tag) {
    return (
      <section className="mx-auto max-w-[1120px]">
        <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
          screen-progress-tag
        </p>
        <h1 className="text-2xl font-bold leading-8">苦手タグ詳細</h1>
        <Panel className="mt-6" title="タグが指定されていません">
          <p className="text-sm leading-5 text-[var(--text-secondary)]">
            進捗画面のタグ別苦手一覧から対象タグを選択してください。
          </p>
          <div className="mt-5">
            <Button href="/progress" variant="secondary">
              進捗へ戻る
            </Button>
          </div>
        </Panel>
      </section>
    );
  }

  const detail = calculateTagDetailStatistic(state.answers, questions, tag);
  const practiceHref = detail.practicePart
    ? buildTagPracticeHref(detail.practicePart, detail.tag)
    : undefined;

  return (
    <section className="mx-auto max-w-[1120px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
        screen-progress-tag
      </p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-8">苦手タグ詳細</h1>
          <p className="mt-2 break-words text-sm text-[var(--text-secondary)]">
            {detail.tag}
          </p>
        </div>
        <Button href="/progress" variant="secondary">
          進捗へ戻る
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Panel title="正答率">
          <div className="text-3xl font-bold">{detail.accuracy}%</div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {detail.correct}/{detail.answered} 正解
          </p>
        </Panel>
        <Panel title="回答数">
          <div className="text-3xl font-bold">{detail.answered}問</div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            対象タグの累計回答
          </p>
        </Panel>
        <Panel title="関連 Part">
          {detail.relatedParts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {detail.relatedParts.map((part) => (
                <span
                  className="rounded-[var(--radius-sm)] bg-[var(--primary-soft)] px-2 py-1 text-sm font-semibold text-[var(--primary)]"
                  key={part}
                >
                  {formatPart(part)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              問題バンクに該当タグがありません。
            </p>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Part 内訳">
          <div className="grid gap-3">
            {detail.partStatistics.map((statistic) => (
              <div
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
                key={statistic.part}
              >
                <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                  <span>{formatPart(statistic.part)}</span>
                  <span>{statistic.accuracy}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--surface-subtle)]">
                  <div
                    className="h-2 rounded-full bg-[var(--primary)]"
                    style={{ width: `${statistic.accuracy}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {statistic.correct}/{statistic.answered} 正解
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="このタグの練習">
          {practiceHref && detail.practicePart ? (
            <>
              <p className="text-sm leading-5 text-[var(--text-secondary)]">
                {formatPart(detail.practicePart)} を選択済みで開始します。
              </p>
              <div className="mt-5">
                <Button href={practiceHref}>このタグを練習</Button>
              </div>
            </>
          ) : (
            <p className="text-sm leading-5 text-[var(--text-secondary)]">
              該当タグの問題が見つかりません。
            </p>
          )}
        </Panel>
      </div>

      <Panel className="mt-4" title="最近の誤答">
        {detail.incorrectAnswers.length > 0 ? (
          <ul className="grid gap-3">
            {detail.incorrectAnswers.map((answer) => (
              <li
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] p-3"
                key={`${answer.questionId}-${answer.answeredAt}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                  <span>
                    {answer.answeredAt.slice(0, 10)} / {formatPart(answer.part)}
                  </span>
                  <span>{answer.questionId}</span>
                </div>
                <p className="mt-2 break-words text-sm leading-5 text-[var(--text-primary)]">
                  {answer.summary}
                </p>
                <p className="mt-1 text-xs text-[var(--danger)]">
                  選択: {answer.selectedChoiceId}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-5 text-[var(--text-secondary)]">
            このタグの誤答履歴はまだありません。
          </p>
        )}
      </Panel>
    </section>
  );
}
