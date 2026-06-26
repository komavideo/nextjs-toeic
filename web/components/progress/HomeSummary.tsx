import { Panel } from "@/components/shared/Panel";

type HomeSummaryProps = {
  todayCount: number;
  accuracy: number;
  streakDays: number;
  reviewScheduledCount: number;
  reviewDueBreakdown: {
    overdue: number;
    today: number;
    future: number;
  };
};

type SummaryItem = {
  label: string;
  value: number | string;
  detailItems?: {
    label: string;
    value: number;
  }[];
};

export function HomeSummary({
  todayCount,
  accuracy,
  streakDays,
  reviewScheduledCount,
  reviewDueBreakdown,
}: HomeSummaryProps) {
  const items: SummaryItem[] = [
    { label: "今日の学習数", value: todayCount },
    { label: "全体正答率", value: `${accuracy}%` },
    { label: "連続学習日数", value: streakDays },
    {
      label: "復習予定数",
      value: reviewScheduledCount,
      detailItems: [
        { label: "期限切れ", value: reviewDueBreakdown.overdue },
        { label: "今日", value: reviewDueBreakdown.today },
        { label: "明日以降", value: reviewDueBreakdown.future },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <Panel key={item.label}>
          <div className="text-2xl font-bold">{item.value}</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">
            {item.label}
          </div>
          {item.detailItems ? (
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
              {item.detailItems.map((detail) => (
                <span key={detail.label}>
                  {detail.label} {detail.value}
                </span>
              ))}
            </div>
          ) : null}
        </Panel>
      ))}
    </div>
  );
}
