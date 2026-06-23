import type { PartStatistic } from "@/lib/progress/statistics";

type PartPerformanceProps = {
  statistics: PartStatistic[];
};

export function PartPerformance({ statistics }: PartPerformanceProps) {
  const lowestAccuracy = Math.min(...statistics.map((statistic) => statistic.accuracy));

  return (
    <div className="grid gap-3">
      {statistics.map((statistic) => {
        const highlighted = statistic.accuracy === lowestAccuracy;

        return (
          <a
            className={[
              "rounded-[var(--radius-md)] border p-3",
              highlighted
                ? "border-[var(--warning)] bg-[var(--warning-soft)]"
                : "border-[var(--border)] bg-[var(--surface)]",
            ].join(" ")}
            href={`/practice?part=${statistic.part}`}
            key={statistic.part}
          >
            <div className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span>{statistic.part.toUpperCase()}</span>
              <span>{statistic.accuracy}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[var(--surface-subtle)]">
              <div
                className="h-2 rounded-full bg-[var(--primary)]"
                style={{ width: `${statistic.accuracy}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              {statistic.correct}/{statistic.answered} 正解
            </div>
          </a>
        );
      })}
    </div>
  );
}
