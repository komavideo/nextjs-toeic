"use client";

import { ErrorState } from "@/components/shared/ErrorState";

type PracticeErrorViewProps = {
  message: string;
  onRetry: () => void;
  onInitialized: () => void;
  preserveSession?: boolean;
  storageUnavailable?: boolean;
};

export function PracticeErrorView({
  message,
  onRetry,
  onInitialized,
  preserveSession = false,
  storageUnavailable = false,
}: PracticeErrorViewProps) {
  return (
    <ErrorState
      message={
        preserveSession
          ? `${message} 未保存の回答はこの画面を閉じるまで保持されます。`
          : message
      }
      onInitialized={onInitialized}
      onRetry={onRetry}
      storageUnavailable={storageUnavailable}
      title="保存データエラー"
    />
  );
}
