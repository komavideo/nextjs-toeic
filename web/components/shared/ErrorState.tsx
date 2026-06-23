"use client";

import { useState } from "react";
import { clearProgressState } from "@/lib/storage/progressStorage";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Panel } from "./Panel";

type ErrorStateProps = {
  title?: string;
  message: string;
  storageUnavailable?: boolean;
  onRetry: () => void;
  onInitialized?: () => void;
};

export function ErrorState({
  title = "エラーが発生しました",
  message,
  storageUnavailable = false,
  onRetry,
  onInitialized,
}: ErrorStateProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  function executeInitialize() {
    const result = clearProgressState();

    if (!result.ok) {
      setClearError("保存データの初期化に失敗しました。");
      setConfirmOpen(false);
      return;
    }

    setConfirmOpen(false);
    setClearError(null);
    onInitialized?.();
  }

  return (
    <section className="mx-auto max-w-[720px]">
      <p className="mb-2 text-sm font-semibold text-[var(--danger)]">screen-error</p>
      <Panel title={title}>
        <p className="text-base leading-[26px] text-[var(--text-secondary)]">
          {message}
        </p>
        <p className="mt-3 text-sm leading-5 text-[var(--text-muted)]">
          {storageUnavailable
            ? "localStorage が利用できないため、学習はこの画面では続けられても再訪時の復元は保証されません。"
            : "プライベートブラウズや端末設定により、端末内保存が使えない場合があります。"}
        </p>
        {clearError ? (
          <p className="mt-3 text-sm font-semibold text-[var(--danger)]">
            {clearError}
          </p>
        ) : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button onClick={onRetry}>再試行</Button>
          <Button onClick={() => setConfirmOpen(true)} variant="danger">
            データ初期化
          </Button>
        </div>
      </Panel>
      <Modal
        description="端末内の保存データを削除します。この操作は元に戻せません。"
        onClose={() => setConfirmOpen(false)}
        onPrimary={executeInitialize}
        onSecondary={() => setConfirmOpen(false)}
        open={confirmOpen}
        primaryLabel="初期化する"
        secondaryLabel="キャンセル"
        title="保存データを初期化しますか"
      />
    </section>
  );
}
