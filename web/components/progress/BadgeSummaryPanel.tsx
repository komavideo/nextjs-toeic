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
  const views = buildBadgeViews(state);
  const { unlocked, total } = countUnlockedBadges(state);
  const recentViews = views
    .filter((view) => view.unlocked && view.unlockedAt)
    .sort((left, right) =>
      (right.unlockedAt ?? "").localeCompare(left.unlockedAt ?? ""),
    )
    .slice(0, recentBadgeLimit);

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
