import type { ProgressState, UnlockedBadges } from "@/types/progress";
import { badgeDefinitions } from "./definitions.ts";
import { evaluateUnlockedBadgeIds } from "./evaluate.ts";
import { deriveBadgeMetrics } from "./metrics.ts";
import type { BadgeDefinition } from "./types.ts";

// 条件を満たすが未記録のバッジを、解除日時付きで記録する。既存の解除日時は上書きしない。
function recordUnlockedBadges(
  unlockedBadges: UnlockedBadges,
  satisfiedIds: Set<string>,
  unlockedAtIso: string,
): { unlockedBadges: UnlockedBadges; addedIds: Set<string> } {
  const addedIds = new Set<string>();
  let next = unlockedBadges;

  for (const definition of badgeDefinitions) {
    if (satisfiedIds.has(definition.id) && !(definition.id in unlockedBadges)) {
      if (next === unlockedBadges) {
        next = { ...unlockedBadges };
      }

      next[definition.id] = unlockedAtIso;
      addedIds.add(definition.id);
    }
  }

  return { unlockedBadges: next, addedIds };
}

function definitionsForIds(ids: Set<string>): BadgeDefinition[] {
  return badgeDefinitions.filter((definition) => ids.has(definition.id));
}

/**
 * 既に条件を満たしているバッジを「静かに」記録する（遡及解除）。
 * お祝い演出は行わず、戻り値の newlyUnlocked は呼び出し側の判断に委ねる。
 * 何も追加されなければ changed=false を返し、無駄な保存を避ける。
 */
export function reconcileBadges(
  state: ProgressState,
  now: Date = new Date(),
): { state: ProgressState; changed: boolean; newlyUnlocked: BadgeDefinition[] } {
  const metrics = deriveBadgeMetrics(state);
  const satisfiedIds = evaluateUnlockedBadgeIds(metrics);
  const { unlockedBadges, addedIds } = recordUnlockedBadges(
    state.unlockedBadges,
    satisfiedIds,
    now.toISOString(),
  );

  if (addedIds.size === 0) {
    return { state, changed: false, newlyUnlocked: [] };
  }

  return {
    state: { ...state, unlockedBadges },
    changed: true,
    newlyUnlocked: definitionsForIds(addedIds),
  };
}

/**
 * セッション完了時に、今回新たに解除されたバッジを算出する。
 * - 解除済み記録は after.unlockedBadges へ静かに反映する（遡及分も含む）。
 * - お祝い対象（celebrated）は「セッション前は満たさず、セッション後に満たした」分のみ。
 */
export function applySessionBadgeUnlocks(
  before: ProgressState,
  after: ProgressState,
  now: Date = new Date(),
): { state: ProgressState; celebrated: BadgeDefinition[] } {
  const beforeIds = evaluateUnlockedBadgeIds(deriveBadgeMetrics(before));
  const afterIds = evaluateUnlockedBadgeIds(deriveBadgeMetrics(after));
  const { unlockedBadges } = recordUnlockedBadges(
    after.unlockedBadges,
    afterIds,
    now.toISOString(),
  );
  const celebratedIds = new Set<string>();

  for (const id of afterIds) {
    if (!beforeIds.has(id)) {
      celebratedIds.add(id);
    }
  }

  const state =
    unlockedBadges === after.unlockedBadges
      ? after
      : { ...after, unlockedBadges };

  return { state, celebrated: definitionsForIds(celebratedIds) };
}
