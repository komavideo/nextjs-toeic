import { Button } from "@/components/shared/Button";
import type { ToeicReadingPart } from "@/types/question";

type PracticeHeaderProps = {
  currentIndex: number;
  totalCount: number;
  part: ToeicReadingPart;
  onInterrupt: () => void;
};

export function PracticeHeader({
  currentIndex,
  totalCount,
  part,
  onInterrupt,
}: PracticeHeaderProps) {
  const remainingMinutes = Math.max(totalCount - currentIndex, 1);

  return (
    <header className="mb-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">screen-quick</p>
          <h1 className="mt-1 text-2xl font-bold leading-8">演習中</h1>
        </div>
        <Button onClick={onInterrupt} variant="secondary">
          中断
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-[var(--text-secondary)]">
        <span>
          進捗 {currentIndex + 1}/{totalCount}
        </span>
        <span>{part.toUpperCase()}</span>
        <span>残り目安 {remainingMinutes}分</span>
      </div>
    </header>
  );
}
