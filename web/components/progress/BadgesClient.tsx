"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import {
  badgeCategoryLabels,
  badgeCategoryOrder,
} from "@/lib/badges/definitions";
import { buildBadgeViews, countUnlockedBadges } from "@/lib/badges/evaluate";
import { reconcileBadges } from "@/lib/badges/unlock";
import { createInitialProgressState } from "@/lib/progress/initialState";
import {
  loadProgressState,
  saveProgressState,
} from "@/lib/storage/progressStorage";
import type { ProgressState } from "@/types/progress";
import { BadgeCard } from "./BadgeCard";

type LoadError = {
  message: string;
  storageUnavailable: boolean;
};

export function BadgesClient() {
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);

  const loadProgress = useCallback(() => {
    const result = loadProgressState();

    if (result.ok) {
      // 既に達成済みのバッジを静かに遡及解除し、追加があれば保存する（お祝いはしない）。
      const reconciled = reconcileBadges(result.state);

      if (reconciled.changed) {
        saveProgressState(reconciled.state);
      }

      setProgressState(reconciled.state);
      setLoadError(null);
      return;
    }

    setLoadError({
      message: "バッジデータを読み込めませんでした。",
      storageUnavailable: result.reason === "unavailable",
    });
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const state = progressState ?? createInitialProgressState();
  // buildBadgeViews / countUnlockedBadges は回答履歴をフルスキャンするため、
  // state が変わらない再レンダーでは再計算しない。
  // フックは早期 return より前で無条件に呼ぶ（Rules of Hooks）。
  const views = useMemo(() => buildBadgeViews(state), [state]);
  const { unlocked, total } = useMemo(
    () => countUnlockedBadges(state),
    [state],
  );

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
        title="バッジデータエラー"
      />
    );
  }

  return (
    <section className="mx-auto max-w-[1120px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
        screen-badges
      </p>
      <h1 className="text-2xl font-bold leading-8">バッジ</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        獲得 {unlocked}/{total} 個
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button href="/progress" variant="secondary">
          進捗へ戻る
        </Button>
      </div>

      <div className="mt-6 grid gap-4">
        {badgeCategoryOrder.map((category) => {
          const categoryViews = views.filter(
            (view) => view.definition.category === category,
          );

          if (categoryViews.length === 0) {
            return null;
          }

          return (
            <Panel key={category} title={badgeCategoryLabels[category]}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryViews.map((view) => (
                  <BadgeCard key={view.definition.id} view={view} />
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </section>
  );
}
