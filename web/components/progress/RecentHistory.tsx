import type { AnswerResult } from "@/types/progress";

type RecentHistoryProps = {
  answers: AnswerResult[];
};

export function RecentHistory({ answers }: RecentHistoryProps) {
  const recentAnswers = [...answers]
    .sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))
    .slice(0, 5);

  if (recentAnswers.length === 0) {
    return (
      <p className="text-sm leading-5 text-[var(--text-secondary)]">
        最初の演習を始めると、ここに直近の学習履歴が表示されます。
      </p>
    );
  }

  return (
    <ul className="grid gap-2 text-sm leading-5">
      {recentAnswers.map((answer) => (
        <li
          className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] px-3 py-2"
          key={`${answer.questionId}-${answer.answeredAt}`}
        >
          <span>
            {answer.answeredAt.slice(0, 10)} / {answer.part.toUpperCase()}
          </span>
          <span
            className={
              answer.correct ? "text-[var(--success)]" : "text-[var(--danger)]"
            }
          >
            {answer.correct ? "正解" : "不正解"}
          </span>
        </li>
      ))}
    </ul>
  );
}
