import { Panel } from "@/components/shared/Panel";

type HomeSummaryProps = {
  todayCount: number;
  accuracy: number;
  streakDays: number;
  dueCount: number;
};

export function HomeSummary({
  todayCount,
  accuracy,
  streakDays,
  dueCount,
}: HomeSummaryProps) {
  const items = [
    { label: "今日の学習数", value: todayCount },
    { label: "全体正答率", value: `${accuracy}%` },
    { label: "連続学習日数", value: streakDays },
    { label: "復習期限数", value: dueCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <Panel key={item.label}>
          <div className="text-2xl font-bold">{item.value}</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">
            {item.label}
          </div>
        </Panel>
      ))}
    </div>
  );
}
