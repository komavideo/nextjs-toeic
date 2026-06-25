# リリース QA

`0.1.0` 公開前に、問題データレビュー以外のリリース必須ロジックを確認した記録です。

## SRS・進捗ロジック境界ケース確認

対応 Issue: #24 `[M2][P0] SRS・進捗ロジックの境界ケース確認`

| 検証日時 | 実行コマンド | 結果 |
| --- | --- | --- |
| 2026-06-24 22:00:55 JST (+0900) | `cd web && pnpm test` | 成功（11 tests / 11 pass、問題データ検証とレビュー文書検証の自己テストも成功） |

### 確認観点

- 不正解時に翌日相当の復習予定へ戻ることを確認した。
- 正解時に `1日 -> 3日 -> 7日 -> 14日 -> 30日` の順で SRS 間隔が進むことを確認した。
- 30日間隔で正解した問題が定着済みとして扱われることを確認した。
- 同日複数回答では連続学習日数が増えず、翌日回答では増え、学習していない日を挟むと1日に戻ることを確認した。
- 今日以前の復習予定だけが期限到来として日付順に返ることを確認した。

## localStorage 保存・復元・破損データ確認

対応 Issue: #25 `[M2][P0] localStorage保存・復元・破損データの確認`

| 検証日時 | 実行コマンド | 結果 |
| --- | --- | --- |
| 2026-06-25 09:00:42 JST (+0900) | `cd web && pnpm exec node --no-warnings --test --experimental-strip-types lib/storage/progressStorage.test.ts` | 成功（12 tests / 12 pass） |
| 2026-06-25 09:00:42 JST (+0900) | `cd web && pnpm build` | 成功（問題データ検証、レビュー文書検証、静的エクスポート 8 routes） |
| 2026-06-25 08:14:33 JST (+0900) | `cd web && pnpm dev`、Playwright で `http://localhost:3000` を確認 | 成功（演習完了保存、再訪復元、破損 JSON、version 不一致、localStorage 利用不可相当の表示を確認。console warning/error は 0 件） |

### 確認観点

- 演習完了後、`toeicReadingProgress:v1` に回答履歴 5 件と SRS 状態 5 件が保存されることを確認した。
- ページ再訪後、`/progress` で保存済み進捗が読み込まれ、`3/5 正解` として表示されることを確認した。
- `toeicReadingProgress:v1` に破損 JSON を設定すると `screen-error` が表示され、「再試行」と「データ初期化」の導線が出ることを確認した。
- `version: 2` の保存データを設定すると `screen-error` が表示され、「再試行」と「データ初期化」の導線が出ることを確認した。
- `localStorage.getItem` が失敗する状態では、localStorage が利用できない旨のメッセージと初期化導線が表示されることを確認した。
- 「データ初期化」から確認モーダルを経由して保存キーが削除され、空の進捗画面に復帰することを確認した。

## Part 5 5問クイック・復習導線E2E確認

対応 Issue: #27 `[M2][P0] 主要学習フローのE2E手動確認`

このセクションは手動 QA 記録です。`pnpm validate:review` は `docs/QUESTION_REVIEW.md` の問題レビュー記録を検証するコマンドであり、`docs/RELEASE_QA.md` は自動検証対象外です。

| 検証日時 | 実行コマンド | 結果 |
| --- | --- | --- |
| 2026-06-25 09:45:39 JST (+0900) | `cd web && pnpm dev --port 3000`、Playwright で `http://localhost:3000` を確認 | 成功（初回ホーム、5問クイック、回答、採点、解説、結果、ホーム復帰、進捗反映を確認。モバイル幅 390x844 を主確認、デスクトップ幅 1280x800 を軽量確認。console warning/error は 0 件） |
| 2026-06-25 10:09:22 JST (+0900) | `cd web && pnpm build`、`cd web && python3 -m http.server 4173 --directory out`、Playwright で `http://localhost:4173` を確認 | 成功（静的 export 配信で初回ホーム、5問クイック、回答、採点、解説、結果、復習導線、ホーム、進捗、復習を確認。期限到来データを一時設定して `復習を開始` から `/practice/?mode=review` に遷移できることを確認。モバイル幅 390x844 とデスクトップ幅 1280x800 で空白・Next.js エラー overlay なし。console warning/error は 0 件） |

### 確認観点

- 確認範囲は Part 5 の5問クイック演習と、結果画面からの復習導線に限定した。
- 初回ホームの `screen-empty` から「5問クイックを開始」を押し、`/practice/?mode=quick&part=part5` の演習へ遷移できることを確認した。
- Part 5 先頭5問で選択肢 A を回答し、各問で「選択」「回答する」「正誤表示」「解説確認」「次へ」の流れが動くことを確認した。
- 回答パターン A/A/A/A/A により、正解、不正解、正解、不正解、正解の順で採点されることを確認した。
- セッション結果で `3/5`、正答率 `60%`、誤答 `p5-sample-002` / `p5-sample-004`、復習予定追加数 `5` が表示されることを確認した。
- 結果画面に「復習する」「もう1セット」「ホームへ戻る」が表示され、「復習する」から `/review/` へ、「ホームへ戻る」からホームへ自然に遷移できることを確認した。
- 復習予定の `dueDate` を当日にした保存データでは、`/review/` に「今日の復習 5件」と「復習を開始」が表示され、「復習を開始」から `/practice/?mode=review` の復習セッションへ遷移できることを確認した。
- 演習完了後、`toeicReadingProgress:v1` に回答履歴 5 件、SRS 状態 5 件、正解数 3 件が保存されることを確認した。
- ホームでは今日の学習数 5、全体正答率 60%、連続学習日数 1 日、直近履歴 5 件が表示されることを確認した。
- 進捗画面では `3/5 正解`、直近7日の学習量 `2026-06-25: 5問`、復習予定 5 件が表示されることを確認した。
- デスクトップ幅ではホーム、演習中、結果、進捗の主要画面が空白や Next.js エラー overlay なしで表示されることを確認した。
- in-app Browser は `iab` が利用できなかったため、Playwright で代替確認した。

## 復習フローE2E確認

対応 Issue: #28 `[M2][P0] 復習フローのE2E手動確認`

このセクションは手動 QA 記録です。`pnpm build` は問題データ検証、レビュー文書検証、静的エクスポートの確認であり、`docs/RELEASE_QA.md` 自体は自動検証対象外です。復習対象ありケースは、再現性を優先して `toeicReadingProgress:v1` に以下の `ProgressState` を投入して確認しました。

```json
{
  "version": 1,
  "totalAnswered": 0,
  "totalCorrect": 0,
  "currentStreakDays": 0,
  "answers": [],
  "srs": {
    "p5-sample-001": {
      "questionId": "p5-sample-001",
      "intervalDays": 1,
      "dueDate": "2026-06-25",
      "correctStreak": 1,
      "lastAnsweredAt": "2026-06-24T01:30:03.000Z"
    },
    "p5-sample-002": {
      "questionId": "p5-sample-002",
      "intervalDays": 1,
      "dueDate": "2026-06-25",
      "correctStreak": 0,
      "lastAnsweredAt": "2026-06-24T01:30:03.000Z"
    }
  }
}
```

| 検証日時 | 実行コマンド | 結果 |
| --- | --- | --- |
| 2026-06-25 10:30:03 JST (+0900) | `cd web && pnpm build`、`cd web && python3 -m http.server 4173 --directory out`、Playwright で `http://localhost:4173` を確認 | 成功（復習対象なし、期限到来 2 件の復習一覧、復習開始、回答、採点、解説、結果、正解時と不正解時の SRS 保存更新を確認。モバイル幅 390x844 を主確認、デスクトップ幅 1280x800 を軽量確認。console warning/error は 0 件） |

### 確認観点

- `toeicReadingProgress:v1` を削除した状態で `/review/` を表示し、「復習対象はありません」と「通常演習へ」が表示されることを確認した。
- 投入した初期 SRS は `p5-sample-001`: `intervalDays: 1`、`correctStreak: 1`、`dueDate: 2026-06-25`、`p5-sample-002`: `intervalDays: 1`、`correctStreak: 0`、`dueDate: 2026-06-25`（いずれも期限到来）であり、後述の保存データ更新後値はこの初期状態から検算できる。
- `p5-sample-001` と `p5-sample-002` の期限到来 SRS を投入し、`/review/` に「今日の復習 2件」と「復習を開始」が表示されることを確認した。
- 「復習を開始」から `/practice/?mode=review` に遷移し、復習セッションが 2 問で開始されることを確認した。
- 1 問目 `p5-sample-001` で選択肢 A を回答し、正解表示、解説、`復習予定: 2026-06-28` が表示されることを確認した。
- 2 問目 `p5-sample-002` で選択肢 A を回答し、不正解表示、正解 B、解説、`復習予定: 2026-06-26` が表示されることを確認した。
- セッション結果で `1/2`、正答率 `50%`、誤答 `p5-sample-002: 選択 A` が表示されることを確認した。復習モードは既存の復習予定を更新するのみで新規登録は発生しないため、復習予定追加数 `0`（主要学習フローの `5` とは異なり、復習モードでは期待値）が表示されることを確認した。
- セッション完了後の保存データで、`p5-sample-001` は `intervalDays: 3`、`dueDate: 2026-06-28`、`correctStreak: 2` に更新されることを確認した。
- セッション完了後の保存データで、`p5-sample-002` は `intervalDays: 1`、`dueDate: 2026-06-26`、`correctStreak: 0` に更新されることを確認した。
- モバイル幅 390x844 とデスクトップ幅 1280x800 で、復習一覧、解説、結果の主要表示に空白・Next.js エラー overlay・明らかな表示崩れがないことを確認した。
- in-app Browser は `iab` が利用できなかったため、Playwright で代替確認した。
