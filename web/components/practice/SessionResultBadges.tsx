import { BadgeCard } from "@/components/progress/BadgeCard";
import { Panel } from "@/components/shared/Panel";
import type { BadgeDefinition } from "@/lib/badges/types";

type SessionResultBadgesProps = {
  badges: BadgeDefinition[];
};

// 今回のセッションで新たに解除されたバッジを表示する。解除がなければ何も描画しない。
export function SessionResultBadges({ badges }: SessionResultBadgesProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <Panel className="mt-4" title="獲得バッジ">
      <div className="grid gap-3 sm:grid-cols-3">
        {badges.map((definition) => (
          <BadgeCard
            key={definition.id}
            view={{ definition, unlocked: true }}
          />
        ))}
      </div>
    </Panel>
  );
}
