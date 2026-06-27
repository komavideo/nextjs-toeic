"use client";

import { useMemo } from "react";
import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";
import { buildBadgeViews, countUnlockedBadges } from "@/lib/badges/evaluate";
import type { ProgressState } from "@/types/progress";
import { BadgeCard } from "./BadgeCard";

// 進捗ページに表示する最大の直近獲得バッジ数。
const recentBadgeLimit = 3;

type BadgeSummaryPanelProps = {
  state: ProgressState;
  className?: string;
};

export function BadgeSummaryPanel({ state, className }: BadgeSummaryPanelProps) {
  // buildBadgeViews / countUnlockedBadges は回答履歴をフルスキャンするため、
  // state が変わらない再レンダーでは再計算しない。
  const views = useMemo(() => buildBadgeViews(state), [state]);
  const { unlocked, total } = useMemo(
    () => countUnlockedBadges(state),
    [state],
  );
  const recentViews = useMemo(
    () =>
      views
        .filter((view) => view.unlocked && view.unlockedAt)
        // unlockedAt（ISO 固定書式）の降順で直近獲得を先頭にする。
        .sort((left, right) => {
          const leftAt = left.unlockedAt ?? "";
          const rightAt = right.unlockedAt ?? "";
          return leftAt < rightAt ? 1 : leftAt > rightAt ? -1 : 0;
        })
        .slice(0, recentBadgeLimit),
    [views],
  );

  return (
    <div className={className}>
      <Panel title="獲得バッジ">
        <p className="text-sm text-[var(--text-secondary)]">
          {unlocked}/{total} 個を獲得
        </p>

        {recentViews.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {recentViews.map((view) => (
              <BadgeCard key={view.definition.id} view={view} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            まだ獲得したバッジはありません。
          </p>
        )}

        <div className="mt-4">
          <Button href="/progress/badges" variant="secondary">
            バッジ一覧を見る
          </Button>
        </div>
      </Panel>
    </div>
  );
}
