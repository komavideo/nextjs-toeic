# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

「5分リーディングドリル」は TOEIC **Reading 特化**（Part 5 / 6 / 7）の学習 Web アプリ。隙間時間に「演習 → 即時採点 → 解説 → 進捗保存 → 簡易 SRS 復習」を完結させることを狙う。**完全クライアント完結**を最優先し、静的エクスポートで動く（サーバー・外部 API・ログイン・音声なし）。

現状は **0.1.0 公開候補段階**: 主要ルート、演習・復習・進捗・設定 UI、進捗保存、SRS、問題バンク、検証スクリプト、364問の静的問題データが実装済み。**実装の設計指針は `docs/` を正とする**（後述）。

## アプリの場所とコマンド

アプリ本体は `web/` 配下にあり、パッケージマネージャは **pnpm**（`web/pnpm-workspace.yaml` がワークスペースルート）。コマンドは `web/` で実行する。

```bash
cd web
pnpm install          # 依存インストール
pnpm dev              # 開発サーバ (http://localhost:3000)
pnpm build            # 静的サイトを web/out/ に出力 (output: "export")
pnpm exec tsc --noEmit # 型チェック（PRD の完了条件「既知の TS エラーがない」の確認に使う）
```

- **lint スクリプトは存在しない**（リンタ未導入）。`pnpm lint` を勝手に前提にしない。`pnpm test` は存在する（`node --test` による単体テストと、`validate:data` / `validate:review` の自己テスト）。型エラーの確認は上記 `tsc` を使う。
- **テスト実行方針**: コード修正後は **変更分に直接関係する最小限のテストだけ**を実行する。プロジェクト全体のテスト・単体テスト全件・UI テスト全件は、**利用者が手動で明確に指示した場合のみ**実行する。
- Node バージョン指定（`.nvmrc` / `engines`）はなし。

## アーキテクチャ（全体像）

技術スタック: Next.js 16（App Router）/ React 19 / TypeScript 5 / TailwindCSS 4 / pnpm。

- **静的エクスポート前提**: `web/next.config.ts` で `output: "export"`、`images.unoptimized: true`。静的エクスポートでは `next/image` の最適化が使えない。**Server Actions・Route Handler・実行時の外部 API / サーバー処理・実行時 LLM 呼び出しは使わない（非ゴール）**。
- **RSC / Client の責務分担**: RSC は静的なページ構成・初期 HTML 生成のみ。演習状態・回答操作・採点・進捗保存・SRS 更新はすべて **Client Component** が担う。
- **データの流れ（2 系統）**:
  - 問題データ = ビルド時に確定する静的 JSON（`web/data/part5.json` / `part6.json` / `part7.json`、型は `QuestionBankEntry`）。実行時に書き換えない。
  - 進捗データ = ブラウザの `localStorage`（キー `toeicReadingProgress:v3`、型は `ProgressState`）。アプリ起動時に読み込み、セッション完了時に保存する。旧 `toeicReadingProgress:v1` / `v2` は初回読み込み時に v3 へ移行する。自動移行では旧キーを削除せず、v3 保存時に v2 互換スナップショットも維持する。`ProgressState` は獲得バッジ（`unlockedBadges`、バッジ ID → 解除日時 ISO）を含む。
- **`/practice` の特殊な作り**: Part 選択・問題表示・解説・結果の各画面は **URL を分割せず、単一の Client Component 内の状態遷移**で扱う（WIREFLOW の `screen-*` を参照）。ブラウザ更新時は未完了セッションを復元せず Part 選択に戻してよい。
- **簡易 SRS**: 正解で `1 → 3 → 7 → 14 → 30 日` と間隔を延長、不正解で翌日（1 日）にリセット、30 日クリアで定着済み扱い。
- **型は単一の真実源**: `web/types/question.ts`（問題）と `web/types/progress.ts`（進捗・SRS）。ドメインの形はここに集約する。

### ルートと意図されたディレクトリ構成（`web/`）

- ルート: `/`（ホーム）, `/practice`（演習）, `/review`（復習）, `/progress`（進捗）, `/settings`（設定）。Phase 1 は拡張画面を含む計 14 画面で、画面遷移・状態更新・例外処理は `docs/WIREFLOW.md` が正。
- `components/{practice,progress,shared}/` と `lib/{badges,question-bank,progress,srs,storage,validation}/` が主な配置先。追加実装はこの構成に沿って行う。
- パスエイリアス: `@/*` → `web/` 直下（`web/tsconfig.json`、strict 有効）。

## 設計ドキュメント（実装前に必ず参照）

`docs/` がプロダクトの設計仕様であり、コードより先に更新・参照されている。

- `docs/PRD.md` — 要件、フェーズ計画、アーキテクチャ方針、データ型、実装優先順位（1〜12）
- `docs/WIREFLOW.md` — 14 画面の遷移図・画面別イベント・状態更新タイミング・エラー復旧導線
- `docs/UI-DESIGN.md` / `docs/VISUAL-COMPANION.html` — 視覚仕様・画面見本

## プロジェクト固有の制約

- **問題はオリジナルのみ**: ETS 公式・市販教材の問題を再現／模倣しない。ETS 非提携であることを画面（ホーム・設定）に明示する。Phase 2 完了条件として全問 `reviewed: true`（人間レビュー済み）。
- **依存は最小限**: 実行時依存は `next` / `react` / `react-dom` のみ。依存追加は事前に理由を説明してから行う。
- **日本語 UI**: 表示・コメント・ドキュメントは日本語で統一する。

## Git ワークフロー

- ブランチは `feature/issue-<番号>` 形式（リポジトリ直下の `_git_create_branch.sh` が生成）。
- `issues/` は `.gitignore` 対象（コミットしない）。
