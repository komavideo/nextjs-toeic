import type { DailyAnswerCount } from "@/lib/progress/statistics";

type LearningCalendarProps = {
  dailyCounts: DailyAnswerCount[];
};

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDisplayDate(dateKey: string): string {
  const [, month, day] = dateKey.split("-");

  return `${Number(month)}/${Number(day)}`;
}

function getWeekdayLabel(dateKey: string): string {
  return weekdayLabels[parseDateKey(dateKey).getDay()];
}

function getCountClass(count: number): string {
  if (count === 0) {
    return "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]";
  }

  if (count <= 2) {
    return "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text-primary)]";
  }

  if (count <= 5) {
    return "border-[var(--success)] bg-[var(--success-soft)] text-[var(--text-primary)]";
  }

  return "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--text-primary)]";
}

export function LearningCalendar({ dailyCounts }: LearningCalendarProps) {
  const todayIndex = dailyCounts.length - 1;
  const totalCount = dailyCounts.reduce((sum, item) => sum + item.count, 0);
  const weekdayHeader = dailyCounts.slice(0, 7);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <p className="text-sm text-[var(--text-secondary)]">
          直近28日合計 {totalCount}問
        </p>
        <p className="text-xs font-semibold text-[var(--primary)]">今日</p>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--text-muted)] sm:text-xs">
        {weekdayHeader.map((item) => (
          <div key={item.date}>{getWeekdayLabel(item.date)}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {dailyCounts.map((item, index) => {
          const isToday = index === todayIndex;

          return (
            <div
              aria-label={`${item.date}: ${item.count}問${isToday ? "、今日" : ""}`}
              className={[
                "flex aspect-square min-h-[52px] min-w-0 flex-col items-center justify-center rounded-[var(--radius-sm)] border px-1 text-center leading-none",
                getCountClass(item.count),
                isToday
                  ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)]"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={item.date}
              title={`${item.date}: ${item.count}問${isToday ? " / 今日" : ""}`}
            >
              <span className="text-[10px] font-semibold sm:text-xs">
                {formatDisplayDate(item.date)}
              </span>
              <span className="mt-1 text-[10px] font-bold sm:text-xs">
                {item.count}問
              </span>
              {isToday ? (
                <span className="mt-1 text-[9px] font-semibold text-[var(--primary)] sm:text-[10px]">
                  今日
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
