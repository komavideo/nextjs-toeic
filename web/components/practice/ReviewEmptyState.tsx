import { Button } from "@/components/shared/Button";
import { Panel } from "@/components/shared/Panel";

export function ReviewEmptyState() {
  return (
    <Panel title="復習対象はありません">
      <p className="text-base leading-[26px] text-[var(--text-secondary)]">
        今日復習する問題はありません。通常演習で新しい問題を解けます。
      </p>
      <Button className="mt-5" href="/practice">
        通常演習へ
      </Button>
    </Panel>
  );
}
