"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { createInitialProgressState } from "@/lib/progress/initialState";
import {
  calculatePartStatistics,
  calculateRecentDailyAnswerCounts,
  calculateTagWeaknessStatistics,
} from "@/lib/progress/statistics";
import { getDueSrsItems } from "@/lib/srs/due";
import { loadProgressState } from "@/lib/storage/progressStorage";
import type { ProgressState } from "@/types/progress";
import type { ToeicReadingPart } from "@/types/question";
import { PartPerformance } from "./PartPerformance";

type LoadError = {
  message: string;
  storageUnavailable: boolean;
};

function getWeakestPartForTag(
  answers: ProgressState["answers"],
  tag: string,
): ToeicReadingPart | undefined {
  const partOrder: ToeicReadingPart[] = ["part5", "part6", "part7"];
  const partStats = new Map<
    ToeicReadingPart,
    { part: ToeicReadingPart; answered: number; correct: number }
  >();

  for (const answer of answers) {
    if (!answer.tags.includes(tag)) {
      continue;
    }

    const current = partStats.get(answer.part) ?? {
      part: answer.part,
      answered: 0,
      correct: 0,
    };
    partStats.set(answer.part, {
      part: answer.part,
      answered: current.answered + 1,
      correct: current.correct + (answer.correct ? 1 : 0),
    });
  }

  return Array.from(partStats.values()).sort(
    (left, right) =>
      left.correct / left.answered - right.correct / right.answered ||
      partOrder.indexOf(left.part) - partOrder.indexOf(right.part),
  )[0]?.part;
}

export function ProgressClient() {
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

  const state =
    progressState ??
    ({
      version: 1,
      totalAnswered: 0,
      totalCorrect: 0,
      currentStreakDays: 0,
      answers: [],
      srs: {},
    } satisfies ProgressState);
  const accuracy =
    state.totalAnswered === 0
      ? 0
      : Math.round((state.totalCorrect / state.totalAnswered) * 100);
  const partStatistics = calculatePartStatistics(state.answers);
  const tagStatistics = calculateTagWeaknessStatistics(state.answers);
  const dailyCounts = calculateRecentDailyAnswerCounts(state.answers);
  const dueItems = getDueSrsItems(state.srs);

  return (
    <section className="mx-auto max-w-[1120px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
        screen-progress
      </p>
      <h1 className="text-2xl font-bold leading-8">進捗</h1>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button href="/practice?mode=weakness">弱点を練習</Button>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="全体正答率">
          <div className="text-3xl font-bold">{accuracy}%</div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {state.totalCorrect}/{state.totalAnswered} 正解
          </p>
        </Panel>
        <Panel title="連続学習日数">
          <div className="text-3xl font-bold">{state.currentStreakDays}日</div>
        </Panel>
        <Panel title="Part 別正答率">
          <PartPerformance statistics={partStatistics} />
        </Panel>
        <Panel title="タグ別苦手一覧">
          {tagStatistics.length > 0 ? (
            <ul className="grid gap-2 text-sm">
              {tagStatistics.map((statistic) => {
                const weakestPart = getWeakestPartForTag(
                  state.answers,
                  statistic.tag,
                );
                const searchParams = new URLSearchParams({ tag: statistic.tag });

                if (weakestPart) {
                  searchParams.set("part", weakestPart);
                }

                return (
                  <li key={statistic.tag}>
                    <a
                      className="font-semibold text-[var(--primary)]"
                      href={`/practice?${searchParams.toString()}`}
                    >
                      {statistic.tag}: {statistic.accuracy}%
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">まだありません。</p>
          )}
        </Panel>
        <Panel title="直近7日の学習量">
          <ul className="grid gap-2 text-sm">
            {dailyCounts.map((item) => (
              <li key={item.date}>
                {item.date}: {item.count}問
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="復習定着状況">
          <p className="text-sm text-[var(--text-secondary)]">
            復習予定 {Object.keys(state.srs).length}件 / 期限到来 {dueItems.length}件
          </p>
        </Panel>
      </div>
    </section>
  );
}
