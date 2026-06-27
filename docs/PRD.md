# PRD: 5分リーディングドリル

## 1. プロダクト概要

### 1.1 概要

「5分リーディングドリル」は、TOEIC 対策を目的とした Reading 特化の学習 Web アプリである。通勤中や待ち時間などの短い時間で、Part 5 / Part 6 / Part 7 相当の問題演習、即時採点、解説確認、復習予定の更新までを完了できる体験を提供する。

TOEIC は ETS の登録商標であり、本プロダクトは ETS と提携・承認・推薦されたものではない。問題は既存教材や公式問題の複製ではなく、LLM 生成後に検証・レビューしたオリジナル問題のみを扱う。

### 1.2 コアバリュー

通勤・隙間時間だけで、Reading の弱点を継続的に潰せる学習体験を作る。

### 1.3 ターゲットユーザー

- TOEIC 受験予定があり、Reading の演習量を増やしたい社会人・学生
- 学習時間をまとまって確保しづらく、スマートフォンで短時間学習したいユーザー
- ログインや学習サービス登録なしで、すぐに問題演習を始めたいユーザー
- 自分の苦手 Part と復習対象を軽量に把握したいユーザー

### 1.4 表示言語

- 初回リリース `0.1.0` は日本語のみ
- 多言語対応は `0.2.0` 以降の拡張候補

## 2. 主要ユーザーフロー

### 2.1 クイック演習フロー

1. ユーザーがダッシュボードを開く
2. 「クイック演習」または Part 別メニューを選ぶ
3. Part 5 は単問を 3 / 5 / 10 問から選んで（既定 5 問）、Part 6 / Part 7 はパッセージセットを1セッションとして出題する
4. ユーザーが各設問に回答する
5. 回答直後またはセッション終了時に採点と解説を表示する
6. 正誤、回答時刻、Part、タグ、難易度をローカルに保存する
7. 誤答または低定着の問題は簡易 SRS の復習予定に追加する
8. セッション結果で正答率、弱点 Part、次の復習候補を表示する

### 2.2 復習フロー

1. ユーザーが復習画面を開く
2. 復習予定日が到来した問題を優先して出題する
3. 正解時は次回復習間隔を延長する
4. 不正解時は短い間隔で再出題予定に戻す
5. 復習後、進捗サマリと苦手タグを更新する

## 3. 開発計画

### 3.1 Phase 1 — 実装 MVP

#### ゴール

動作する Reading 学習ループを完成させる。見た目の作り込みや大量問題投入より、Part 5 / Part 6 / Part 7 の基本演習、採点、解説、進捗保存、復習予定更新が一通り動くことを唯一のゴールとする。

#### 含む機能

- 静的 JSON からの問題読み込み
- Part 5 / Part 6 / Part 7 相当の Reading 問題表示
- Part 5 は 3 / 5 / 10 問から選択（既定 5 問）、Part 6 / Part 7 はパッセージセット単位の短時間セッション
- 選択式回答、即時採点、解説表示
- `localStorage` による進捗保存
- 正答率、学習日数、Part 別成績の簡易表示
- 簡易 SRS による復習予定管理
- 日本語 UI
- スマートフォン縦持ちを優先した基本レスポンシブ UI

#### 含めない機能

- Listening 問題
- 音声再生、効果音、音声生成
- ログイン、ユーザー管理、アカウント同期
- 外部 API 呼び出し
- サーバーサイドの実行時処理
- 決済、ランキング、SNS 共有
- 多言語対応
- 300問以上の本番問題バンク投入

#### 完了の定義

- 静的サイトとしてローカルで起動できる
- Part 5 / Part 6 / Part 7 の代表問題を演習できる
- 回答、採点、解説、結果表示が破綻なく動く
- ページ再訪後も `localStorage` から進捗が復元される
- 復習予定の追加、延期、再出題が動く
- スマートフォン幅で主要操作が片手で完了できる
- 既知の TypeScript エラーがない

### 3.2 Phase 2 — 商品 MVP

#### ゴール

Phase 1 を公開できる水準に拡張し、初回リリース `0.1.0` として成立させる。

#### 追加スコープ

- Reading 問題バンクを300問以上に拡充
- 全問の人間レビュー完了
- 問題スキーマ、ID 重複、正解参照、選択肢重複、レビュー状態の自動検証
- ダッシュボード、進捗分析、復習、設定画面の UI 品質向上
- 初回利用、空状態、データリセット、保存失敗時の表示
- Lighthouse と手動確認による基本的なアクセシビリティ改善
- 静的ホスティングでの公開確認

#### 完了の定義

- `0.1.0` として Reading 300問以上を提供できる
- すべての問題に `reviewed: true` が設定され、人間レビューが完了している
- 問題データ検証でエラーが出ない
- PC / スマートフォン / タブレットの主要幅で UI が破綻しない
- 実行時に外部クラウドサービス・外部 API へ依存しない
- 進捗データの保存、復元、リセットがユーザー操作で完結する
- ETS 非提携とオリジナル問題方針が明示されている

## 4. 機能スコープ表

| 機能 | 担当フェーズ | 優先度 | 備考 |
| --- | --- | --- | --- |
| Part 5 単問演習 | Phase 1 | Must | 最初の基本演習パターン |
| Part 6 パッセージ演習 | Phase 1 | Must | 文章付き設問セット |
| Part 7 長文演習 | Phase 1 | Must | 長文読解の基本形 |
| クイックセッション（Part 5 は 3 / 5 / 10 問から選択、既定 5 問） | Phase 1 | Must | 隙間時間モードの中核 |
| 即時採点 | Phase 1 | Must | 回答後に正誤を表示 |
| 解説表示 | Phase 1 | Must | 正解根拠と学習ポイントを表示 |
| 進捗保存 | Phase 1 | Must | `localStorage` で保存 |
| 進捗ダッシュボード | Phase 1 | Must | 正答率、連続学習日数、弱点 Part |
| 問題到達率メーター | Phase 1 | Should | 全体・Part 別に回答済み / 未回答 / 定着済みを集計して進捗画面に表示。未回答があれば `/practice?mode=part&part=<part>&unanswered=1` で未回答優先演習へ誘導 |
| 簡易 SRS 復習 | Phase 1 | Must | 日付ベースで復習予定を管理 |
| 弱点優先セッション | Phase 1 | Should | Part / タグ別正答率が最低の領域を自動出題（`/practice?mode=weakness`、回答3件未満は Part 5 クイックへフォールバック） |
| 問題データ検証 | Phase 1 | Must | 型・整合性の検証 |
| 300問以上の問題バンク | Phase 2 | Must | `0.1.0` の商品価値 |
| 全問人間レビュー | Phase 2 | Must | 問題品質の担保 |
| UI 品質改善 | Phase 2 | Must | 公開可能な見た目と操作性 |
| 空状態・エラー表示 | Phase 2 | Should | 保存不可、復習なしなど |
| データリセット | Phase 2 | Should | 端末内データの削除 |
| Listening 対応 | 0.2.0 以降 | Won't | 音声素材方針が別途必要 |
| ログイン・同期 | 0.2.0 以降 | Won't | 完全クライアント完結と衝突 |

## 5. アーキテクチャ方針

### 5.1 基本方針

- Next.js App Router、TypeScript、TailwindCSS、pnpm を採用する
- 完全クライアント完結を優先し、`output: 'export'` による静的サイトを前提にする
- 実行時のサーバーサイド処理、外部 API 呼び出し、クラウド保存は行わない
- 問題バンクはビルド時に確定した静的 JSON として `/data` 配下に配置する
- 進捗はブラウザ内の `localStorage` に保存する

### 5.2 RSC / Client Component の責務

| 領域 | 方針 |
| --- | --- |
| RSC | 静的ページ構成、静的 JSON の参照、初期 HTML 生成に限定 |
| Client Component | 演習状態、回答操作、採点表示、進捗保存、復習予定更新 |
| Server Actions | 使用しない |
| Route Handler | 使用しない |
| 外部 API | 使用しない |

`RSC を活用すること` と `完全クライアント完結` は方向性が衝突しうるため、本プロダクトでは完全クライアント完結を優先する。RSC は実行時サーバーの機能としてではなく、静的サイトを構成するためのビルド時・静的生成用途として扱う。

### 5.3 永続化方式

MVP では `localStorage` を採用する。

理由:

- 保存対象が進捗サマリ、回答履歴、SRS 状態に限定される
- 問題本文は静的 JSON から読み込むため保存不要
- IndexedDB より実装、デバッグ、データリセットが単純
- 端末内完結の要件と相性がよい

IndexedDB は、大量の回答イベント履歴、音声キャッシュ、教材のオフライン配信が必要になった段階で再検討する。

保存キー例:

```ts
type ProgressStorageKey = "toeicReadingProgress:v3";
```

既存の `toeicReadingProgress:v1` / `toeicReadingProgress:v2` は、初回読み込み時に `version: 3` 形式へ移行する（移行後は移行元キーを削除するため、旧バージョンへロールバックすると進捗を引き継げない点に注意）。

### 5.4 簡易 SRS 方針

- 初回不正解または低定着の問題を復習対象にする
- 不正解時は翌日に再出題する
- 正解時は `1日 -> 3日 -> 7日 -> 14日 -> 30日` の順に間隔を延ばす
- 30日間隔をクリアした問題は定着済みとして扱う
- MVP では高度な記憶モデルや通知は扱わない

## 6. 推奨ディレクトリ構成

```text
app/
  layout.tsx
  page.tsx
  practice/
    page.tsx
  review/
    page.tsx
  progress/
    page.tsx
  settings/
    page.tsx
components/
  practice/
  progress/
  shared/
data/
  part5.json
  part6.json
  part7.json
lib/
  question-bank/
  progress/
  srs/
  storage/
  validation/
types/
  question.ts
  progress.ts
docs/
  PRD.md
  UI-DESIGN.md
  VISUAL-COMPANION.html
```

## 7. 問題データ型

```ts
type ToeicReadingPart = "part5" | "part6" | "part7";
type Difficulty = "easy" | "medium" | "hard";
type ChoiceId = "A" | "B" | "C" | "D";

type Choice = {
  id: ChoiceId;
  text: string;
};

type QuestionItem = {
  id: string;
  prompt: string;
  choices: Choice[];
  correctChoiceId: ChoiceId;
  explanation: string;
  difficulty: Difficulty;
  tags: string[];
  reviewed: boolean;
};

type Part5Question = QuestionItem & {
  part: "part5";
  sentence: string;
};

type PassageQuestionSet = {
  id: string;
  part: "part6" | "part7";
  title?: string;
  passage: string;
  questions: QuestionItem[];
  difficulty: Difficulty;
  tags: string[];
  reviewed: boolean;
};

type QuestionBankEntry = Part5Question | PassageQuestionSet;
```

## 8. 進捗データ型

```ts
type AnswerResult = {
  questionId: string;
  part: ToeicReadingPart;
  selectedChoiceId: ChoiceId;
  correct: boolean;
  answeredAt: string;
  elapsedMs: number;
  tags: string[];
};

type SrsState = {
  questionId: string;
  intervalDays: 1 | 3 | 7 | 14 | 30;
  dueDate: string;
  correctStreak: number;
  lastAnsweredAt: string;
};

type ProgressState = {
  version: 3;
  totalAnswered: number;
  totalCorrect: number;
  currentStreakDays: number;
  lastStudiedDate?: string;
  answers: AnswerResult[];
  srs: Record<string, SrsState>;
  bookmarkedQuestionIds: string[];
  questionNotes: Record<string, string>;
  // バッジ ID -> 解除日時(ISO)。定義からいつでも再導出できるため、読み込み時は緩く検証する。
  unlockedBadges: Record<string, string>;
};
```

`unlockedBadges` は獲得済みバッジの解除日時を記録する。バッジ定義は回答履歴と SRS 状態から導出され、問題バンク JSON には依存しない。定義に存在しない孤児 ID は保持しつつ集計・表示では無視するため、バッジ定義の追加・改名・削除が既存の進捗データを破壊しない。

`questionNotes` は問題 ID をキーにした任意の学習メモで、保存時に前後空白を取り除き、200 文字以内の非空文字列のみ保持する。空文字または空白だけで保存した場合は、その問題 ID のメモを削除する。既存の v3 保存データに `questionNotes` が存在しない場合は `{}` を補完して読み込み、補完後の v3 データを再保存する。`questionNotes` がオブジェクトでない、空文字・空白のみ・200 文字超・文字列以外の値を含む場合は未対応/破損データとして扱う。

## 9. 非ゴール

- ETS 公式または既存教材の問題再現
- TOEIC をアプリ名、ロゴ、主ブランドとして使うこと
- ユーザー登録、ログイン、ログアウト
- クラウド同期
- 実行時のサーバーサイド処理
- 実行時の LLM 呼び出し
- 実行時の外部 API 呼び出し
- Listening 問題と音声アセット
- 決済、ランキング、コミュニティ機能
- 多言語対応

## 10. 設計上の懸念点とトレードオフ

### 10.1 静的サイトと RSC

完全クライアント完結を優先する場合、Next.js の RSC を実行時サーバー機能として活かす余地は小さい。静的エクスポートを優先し、RSC は静的ページ構成に限定する。これによりサーバー不要、外部依存なし、静的ホスティング容易という価値を守る。

### 10.2 localStorage と IndexedDB

`localStorage` は容量と同期 API という制約がある一方、MVP の保存対象には十分である。IndexedDB は将来の大規模履歴や教材キャッシュで検討する。MVP では複雑さを避け、保存形式をバージョン付き JSON にする。

### 10.3 問題品質

300問以上を扱う場合、LLM 生成だけでは品質が安定しない。スキーマ検証、重複検出、正解整合性、難易度・タグ確認に加え、全問人間レビューを `0.1.0` の完了条件に含める。

### 10.4 商標・著作権

TOEIC は説明目的に限定して使う。問題はオリジナルに限定し、公式問題や市販教材の表現を模倣しない。画面内には ETS 非提携であることを明記する。

## 11. 実装優先順位

1. Next.js / TypeScript / TailwindCSS / pnpm の最小セットアップ
2. 問題データ型と静的 JSON のサンプル作成
3. 問題データ検証の最小スクリプト作成
4. Part 5 の演習ループ実装
5. Part 6 / Part 7 のパッセージ演習ループ実装
6. 採点、解説、セッション結果の実装
7. `localStorage` による進捗保存と復元
8. 簡易 SRS 復習画面の実装
9. ダッシュボードと進捗分析の実装
10. レスポンシブ UI とアクセシビリティの調整
11. 300問以上の問題投入、全問レビュー、自動検証
12. `0.1.0` 公開確認
