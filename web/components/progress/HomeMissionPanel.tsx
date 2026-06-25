import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";
import type { DailyMission } from "@/lib/progress/dailyMissions";

type HomeMissionPanelProps = {
  missions: DailyMission[];
};

export function HomeMissionPanel({ missions }: HomeMissionPanelProps) {
  if (missions.length === 0) {
    return null;
  }

  return (
    <Panel className="mt-6" title="今日の学習ミッション">
      <div className="grid gap-3">
        {missions.map((mission) => (
          <article
            className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
            key={`${mission.kind}-${mission.href}`}
          >
            <div>
              <h3 className="text-base font-bold leading-6 text-[var(--text-primary)]">
                {mission.title}
              </h3>
              <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                {mission.description}
              </p>
            </div>
            <Button className="w-full sm:w-auto" href={mission.href}>
              {mission.actionLabel}
            </Button>
          </article>
        ))}
      </div>
    </Panel>
  );
}
