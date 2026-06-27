import type { ProgressState } from "@/types/progress";
import { badgeDefinitions } from "./definitions.ts";
import { deriveBadgeMetrics } from "./metrics.ts";
import type { BadgeMetrics, BadgeView } from "./types.ts";

// メトリクスを満たす（＝今まさに条件達成している）バッジ ID の集合を返す純粋関数。
// unlockedBadges（解除日時の記録）とは独立に、定義からいつでも再導出できる。
export function evaluateUnlockedBadgeIds(metrics: BadgeMetrics): Set<string> {
  const unlockedIds = new Set<string>();

  for (const definition of badgeDefinitions) {
    if (definition.isUnlocked(metrics)) {
      unlockedIds.add(definition.id);
    }
  }

  return unlockedIds;
}

// 一覧表示用のビューを定義順に組み立てる。
// 解除済み = 記録済み（過去に獲得）または現在条件を満たす（バッジは剥奪しない）。
// 未獲得かつマイルストーン系のものだけ進捗を埋める。
export function buildBadgeViews(state: ProgressState): BadgeView[] {
  const metrics = deriveBadgeMetrics(state);
  const satisfiedIds = evaluateUnlockedBadgeIds(metrics);

  return badgeDefinitions.map((definition) => {
    const unlockedAt = state.unlockedBadges[definition.id];
    const unlocked = unlockedAt !== undefined || satisfiedIds.has(definition.id);
    const progress =
      !unlocked && definition.getProgress
        ? definition.getProgress(metrics)
        : undefined;

    return {
      definition,
      unlocked,
      ...(unlockedAt !== undefined ? { unlockedAt } : {}),
      ...(progress ? { progress } : {}),
    };
  });
}

// 記録済みバッジ数 / 全定義数を返す。定義に存在しない孤児 ID は数えない。
export function countUnlockedBadges(state: ProgressState): {
  unlocked: number;
  total: number;
} {
  const unlocked = badgeDefinitions.filter(
    (definition) => definition.id in state.unlockedBadges,
  ).length;

  return { unlocked, total: badgeDefinitions.length };
}
