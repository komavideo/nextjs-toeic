import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";
import type { QuestionReachSummary } from "@/lib/progress/questionReach";
import type { ToeicReadingPart } from "@/types/question";

type QuestionReachMeterProps = {
  summary: QuestionReachSummary;
};

const partLabels: Record<ToeicReadingPart, string> = {
  part5: "Part 5",
  part6: "Part 6",
  part7: "Part 7",
};

export function QuestionReachMeter({ summary }: QuestionReachMeterProps) {
  return (
    <Panel className="mt-6" title="問題到達率">
      <div className="grid gap-5">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold">
                {summary.answered}/{summary.total}問
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                回答済み {summary.answeredRate}% / 未回答 {summary.unanswered}問 /
                定着済み {summary.mastered}問
              </p>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
            <div
              className="h-3 rounded-full bg-[var(--success)]"
              style={{ width: `${summary.answeredRate}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {summary.parts.map((partSummary) => {
            const href = `/practice?mode=part&part=${partSummary.part}&unanswered=1`;

            return (
              <article
                className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:grid-cols-[1fr_auto] md:items-center"
                key={partSummary.part}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-bold leading-6">
                      {partLabels[partSummary.part]}
                    </h3>
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">
                      {partSummary.answered}/{partSummary.total}問
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                    <div
                      className="h-2 rounded-full bg-[var(--primary)]"
                      style={{ width: `${partSummary.answeredRate}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">
                    回答済み {partSummary.answered}問 / 未回答{" "}
                    {partSummary.unanswered}問 / 定着済み {partSummary.mastered}問
                  </p>
                </div>
                {partSummary.unanswered > 0 ? (
                  <Button className="w-full md:w-auto" href={href}>
                    未回答を演習
                  </Button>
                ) : (
                  <span className="text-sm font-semibold text-[var(--success)]">
                    未回答なし
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
