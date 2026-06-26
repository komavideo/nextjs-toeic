"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { createInitialProgressState } from "@/lib/progress/initialState";
import {
  calculateQuestionReach,
  type QuestionReachQuestion,
} from "@/lib/progress/questionReach";
import {
  calculatePartStatistics,
  calculateRecentDailyAnswerCounts,
  calculateTagWeaknessStatistics,
} from "@/lib/progress/statistics";
import { buildProgressTagDetailHref } from "@/lib/progress/tagLinks";
import { getDueSrsItems } from "@/lib/srs/due";
import { loadProgressState } from "@/lib/storage/progressStorage";
import type { ProgressState } from "@/types/progress";
import { LearningCalendar } from "./LearningCalendar";
import { PartPerformance } from "./PartPerformance";
import { QuestionReachMeter } from "./QuestionReachMeter";

type LoadError = {
  message: string;
  storageUnavailable: boolean;
};

type ProgressClientProps = {
  questionRefs: QuestionReachQuestion[];
};

export function ProgressClient({ questionRefs }: ProgressClientProps) {
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [today, setToday] = useState<Date | null>(null);

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

  useEffect(() => {
    setToday(new Date());
  }, []);

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
  const dailyCounts = today
    ? calculateRecentDailyAnswerCounts(state.answers, today, 28)
    : [];
  const dueItems = getDueSrsItems(state.srs);
  const questionReach = calculateQuestionReach(state, questionRefs);

  return (
    <section className="mx-auto max-w-[1120px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
        screen-progress
      </p>
      <h1 className="text-2xl font-bold leading-8">進捗</h1>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button href="/practice?mode=weakness">弱点を練習</Button>
      </div>
      <QuestionReachMeter summary={questionReach} />
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
              {tagStatistics.map((statistic) => (
                <li key={statistic.tag}>
                  <a
                    className="font-semibold text-[var(--primary)]"
                    href={buildProgressTagDetailHref(statistic.tag)}
                  >
                    {statistic.tag}: {statistic.accuracy}%
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">まだありません。</p>
          )}
        </Panel>
        <Panel title="学習カレンダー">
          {today ? (
            <LearningCalendar dailyCounts={dailyCounts} />
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">読み込み中...</p>
          )}
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
