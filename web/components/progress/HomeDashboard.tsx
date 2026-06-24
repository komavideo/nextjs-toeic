"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { createInitialProgressState } from "@/lib/progress/initialState";
import { calculatePartStatistics, calculateTagWeaknessStatistics } from "@/lib/progress/statistics";
import { getDueSrsItems } from "@/lib/srs/due";
import { loadProgressState } from "@/lib/storage/progressStorage";
import type { ProgressState } from "@/types/progress";
import type { ToeicReadingPart } from "@/types/question";
import { EmptyState } from "./EmptyState";
import { HomeSummary } from "./HomeSummary";
import { PartPerformance } from "./PartPerformance";
import { RecentHistory } from "./RecentHistory";

const partOrder: ToeicReadingPart[] = ["part5", "part6", "part7"];

type LoadError = {
  message: string;
  storageUnavailable: boolean;
};

function getRecommendedPart(
  partStatistics: ReturnType<typeof calculatePartStatistics>,
): ToeicReadingPart {
  const answeredStatistics = partStatistics.filter((statistic) => statistic.answered > 0);

  if (answeredStatistics.length === 0) {
    return "part5";
  }

  return [...answeredStatistics].sort(
    (left, right) =>
      left.accuracy - right.accuracy ||
      partOrder.indexOf(left.part) - partOrder.indexOf(right.part),
  )[0].part;
}

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
  const recommendedPart = getRecommendedPart(partStatistics);
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

  return (
    <section className="mx-auto max-w-[1120px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">screen-home</p>
      <h1 className="text-2xl font-bold leading-8">5分リーディングドリル</h1>
      <div className="mt-6">
        <HomeSummary
          accuracy={accuracy}
          dueCount={dueCount}
          streakDays={progressState.currentStreakDays}
          todayCount={todayCount}
        />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button href={`/practice?mode=quick&part=${recommendedPart}`}>
          5問クイックを開始
        </Button>
        <Button href="/review" variant="secondary">
          復習期限カード
        </Button>
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
