"use client";

import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { createDailyMissions } from "@/lib/progress/dailyMissions";
import { createInitialProgressState } from "@/lib/progress/initialState";
import { calculatePartStatistics, calculateTagWeaknessStatistics } from "@/lib/progress/statistics";
import { getDueSrsItems } from "@/lib/srs/due";
import { loadProgressState } from "@/lib/storage/progressStorage";
import type { ProgressState } from "@/types/progress";
import { EmptyState } from "./EmptyState";
import { HomeMissionPanel } from "./HomeMissionPanel";
import { HomeSummary } from "./HomeSummary";
import { PartPerformance } from "./PartPerformance";
import { RecentHistory } from "./RecentHistory";

type LoadError = {
  message: string;
  storageUnavailable: boolean;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function HomeDashboard() {
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

  if (!progressState || progressState.answers.length === 0) {
    return <EmptyState />;
  }

  const partStatistics = calculatePartStatistics(progressState.answers);
  const weakTags = calculateTagWeaknessStatistics(progressState.answers);
  const dueCount = getDueSrsItems(progressState.srs).length;
  const accuracy =
    progressState.totalAnswered === 0
      ? 0
      : Math.round((progressState.totalCorrect / progressState.totalAnswered) * 100);
  const today = toDateKey(new Date());
  const todayCount = progressState.answers.filter((answer) =>
    toDateKey(new Date(answer.answeredAt)) === today,
  ).length;
  const missions = createDailyMissions(progressState, today);

  return (
    <section className="mx-auto max-w-[1120px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">screen-home</p>
      <h1 className="text-2xl font-bold leading-8">5分リーディングドリル</h1>
      <HomeMissionPanel missions={missions} />
      <div className="mt-5">
        <HomeSummary
          accuracy={accuracy}
          dueCount={dueCount}
          streakDays={progressState.currentStreakDays}
          todayCount={todayCount}
        />
      </div>
      <Panel className="mt-4" title="Part 別成績">
        <PartPerformance statistics={partStatistics} />
      </Panel>
      <Panel className="mt-4" title="苦手タグ">
        <p className="text-sm text-[var(--text-secondary)]">
          {weakTags[0]?.tag ?? "まだありません"}
        </p>
      </Panel>
      <Panel className="mt-4" title="直近セッション履歴">
        <RecentHistory answers={progressState.answers} />
      </Panel>
      <p className="mt-5 text-xs leading-4 text-[var(--text-muted)]">
        TOEIC は ETS の登録商標です。本アプリは ETS と提携、承認、推薦されたものではありません。問題は既存教材や公式問題の複製ではないオリジナル問題です。
      </p>
    </section>
  );
}
