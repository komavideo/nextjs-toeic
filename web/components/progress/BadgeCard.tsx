import type { BadgeRarity, BadgeView } from "@/lib/badges/types";

// レア度ごとの配色（既存 CSS トークンに対応付ける）。獲得時の枠・背景・アクセント色に使う。
const rarityStyle: Record<
  BadgeRarity,
  { border: string; background: string; accent: string; label: string }
> = {
  common: {
    border: "var(--border-strong)",
    background: "var(--surface)",
    accent: "var(--text-secondary)",
    label: "ノーマル",
  },
  rare: {
    border: "var(--primary)",
    background: "var(--primary-soft)",
    accent: "var(--primary)",
    label: "レア",
  },
  legendary: {
    border: "var(--warning)",
    background: "var(--warning-soft)",
    accent: "var(--warning)",
    label: "レジェンド",
  },
};

// 解除日時(ISO)をローカル暦日の YYYY/MM/DD 表記へ整形する。
function formatUnlockedDate(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

type BadgeCardProps = {
  view: BadgeView;
};

export function BadgeCard({ view }: BadgeCardProps) {
  const { definition, unlocked, unlockedAt, progress } = view;
  const rarity = rarityStyle[definition.rarity];
  const borderColor = unlocked ? rarity.border : "var(--border)";
  const backgroundColor = unlocked ? rarity.background : "var(--surface-subtle)";
  const progressRatio = progress
    ? Math.min(progress.current / progress.target, 1)
    : 0;

  return (
    <article
      className="flex h-full flex-col rounded-[var(--radius-lg)] border p-4"
      style={{ borderColor, backgroundColor }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className="text-sm font-bold leading-5"
          style={{
            color: unlocked ? "var(--text-primary)" : "var(--text-muted)",
          }}
        >
          {definition.title}
        </h3>
        <span
          className="shrink-0 rounded-[var(--radius-sm)] px-2 py-0.5 text-[11px] font-semibold"
          style={{
            color: unlocked ? rarity.accent : "var(--text-muted)",
            backgroundColor: "var(--surface)",
            border: `1px solid ${unlocked ? rarity.border : "var(--border)"}`,
          }}
        >
          {unlocked ? rarity.label : "未獲得"}
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
        {definition.description}
      </p>

      {!unlocked && progress ? (
        <div className="mt-auto pt-3">
          <div className="h-2 w-full rounded-full bg-[var(--border)]">
            <div
              className="h-2 rounded-full bg-[var(--primary)]"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[11px] text-[var(--text-muted)]">
            {progress.current}/{progress.target}
          </p>
        </div>
      ) : null}

      {unlocked && unlockedAt ? (
        <p className="mt-auto pt-3 text-[11px] text-[var(--text-muted)]">
          獲得日 {formatUnlockedDate(unlockedAt)}
        </p>
      ) : null}
    </article>
  );
}
