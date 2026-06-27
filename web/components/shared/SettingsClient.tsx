"use client";

import { useState } from "react";
import { clearProgressState } from "@/lib/storage/progressStorage";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Panel } from "./Panel";
import { Toast } from "./Toast";

export function SettingsClient() {
  const [resetOpen, setResetOpen] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetToastOpen, setResetToastOpen] = useState(false);

  function executeReset() {
    const result = clearProgressState();

    if (!result.ok) {
      setResetError("進捗データの削除に失敗しました。");
      setResetOpen(false);
      return;
    }

    setResetError(null);
    setResetOpen(false);
    setResetToastOpen(true);
  }

  return (
    <section className="mx-auto max-w-[720px]">
      <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
        screen-settings
      </p>
      <h1 className="text-2xl font-bold leading-8">設定</h1>
      <div className="mt-6 grid gap-4">
        <Panel title="アプリ情報">
          <dl className="grid gap-3 text-sm leading-5">
            <div className="flex justify-between gap-4">
              <dt className="font-semibold">バージョン</dt>
              <dd>0.1.0</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold">表示言語</dt>
              <dd>日本語</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="進捗データ">
          <p className="text-base leading-[26px] text-[var(--text-secondary)]">
            回答履歴、復習予定、ブックマーク、学習メモはこの端末内の localStorage に保存されます。ログインやクラウド同期は行いません。
          </p>
          {resetError ? (
            <p className="mt-3 text-sm font-semibold text-[var(--danger)]">
              {resetError}
            </p>
          ) : null}
          <Button
            className="mt-5"
            onClick={() => setResetOpen(true)}
            variant="danger"
          >
            データリセット
          </Button>
        </Panel>
        <Panel title="権利表記と問題方針">
          <p className="text-base leading-[26px] text-[var(--text-secondary)]">
            TOEIC は ETS の登録商標です。本アプリは ETS と提携、承認、推薦されたものではありません。問題は既存教材や公式問題の複製ではないオリジナル問題です。
          </p>
        </Panel>
      </div>
      <Modal
        description="端末内に保存された回答履歴、復習予定、ブックマーク、学習メモを削除します。この操作は元に戻せません。"
        onClose={() => setResetOpen(false)}
        onPrimary={executeReset}
        onSecondary={() => setResetOpen(false)}
        open={resetOpen}
        primaryLabel="リセットする"
        secondaryLabel="キャンセル"
        title="進捗データをリセットしますか"
      />
      <Toast
        message="進捗データをリセットしました。"
        onClose={() => setResetToastOpen(false)}
        open={resetToastOpen}
        type="success"
      />
    </section>
  );
}
