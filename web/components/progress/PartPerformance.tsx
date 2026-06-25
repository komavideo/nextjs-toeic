import type { PartStatistic } from "@/lib/progress/statistics";

type PartPerformanceProps = {
  statistics: PartStatistic[];
};

export function PartPerformance({ statistics }: PartPerformanceProps) {
  // 未回答（answered === 0）の Part は accuracy が 0 となり「最も苦手」と誤判定されるため、
  // 回答実績のある Part のみを最低正答率の比較対象にする。
  const answeredStatistics = statistics.filter((statistic) => statistic.answered > 0);
  const lowestAccuracy =
    answeredStatistics.length > 0
      ? Math.min(...answeredStatistics.map((statistic) => statistic.accuracy))
      : Number.NaN;

  return (
    <div className="grid gap-3">
      {statistics.map((statistic) => {
        const highlighted =
          statistic.answered > 0 && statistic.accuracy === lowestAccuracy;

        return (
          <a
            className={[
              "rounded-[var(--radius-md)] border p-3 text-[var(--text-primary)]",
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
