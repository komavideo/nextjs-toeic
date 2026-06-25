import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";
import { createDailyMissions } from "@/lib/progress/dailyMissions";
import { createInitialProgressState } from "@/lib/progress/initialState";
import { HomeMissionPanel } from "./HomeMissionPanel";

export function EmptyState() {
  const missions = createDailyMissions(createInitialProgressState());

  return (
    <section className="mx-auto max-w-[1120px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">screen-empty</p>
      <h1 className="text-2xl font-bold leading-8">5分リーディングドリル</h1>
      <Panel className="mt-6" title="はじめての学習">
        <p className="text-base leading-[26px] text-[var(--text-secondary)]">
          5問単位で Reading の弱点を確認できます。進捗はこの端末内だけに保存されます。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/practice?mode=weakness">弱点を練習</Button>
          <Button href="/practice" variant="secondary">
            Partを選ぶ
          </Button>
        </div>
      </Panel>
      <HomeMissionPanel missions={missions} />
      <p className="mt-5 text-xs leading-4 text-[var(--text-muted)]">
        TOEIC は ETS の登録商標です。本アプリは ETS と提携、承認、推薦されたものではありません。問題は既存教材や公式問題の複製ではないオリジナル問題です。
      </p>
    </section>
  );
}
