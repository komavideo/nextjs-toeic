# 問題レビュー基準と記録フォーマット

この文書は、`web/data/part5.json`、`web/data/part6.json`、`web/data/part7.json` に含まれる Reading 問題を、人間レビューで完了判定するための基準と記録フォーマットを定義する。

`reviewed: true` は自動検証上の必須フラグとして扱う。一方で、`0.1.0` の人間レビュー完了証跡は、この文書のフォーマットに沿ったレビュー記録の総合判定で確認する。

## レビュー対象

- 対象データ: `web/data/part5.json`、`web/data/part6.json`、`web/data/part7.json`
- 対象 Part: Part 5、Part 6、Part 7
- 記録単位: Part 5 / Part 7 は設問単位で記録し、Part 6 はセット単位レビューと設問単位レビューを両方記録する
- Part 6 / Part 7 の扱い: 同じパッセージセットに属する設問は `entryId` で追跡する。Part 6 はセット全体の本文・設問対応も `entryId` 単位で確認する

## 正解位置品質チェック

`answer` を生成または追加する場合は、`choices.findIndex((choice) => choice.id === correctChoiceId)` で得られる 0〜3 の整数と一致しなければならない。`choices` 配列は A、B、C、D の ID 順を維持し、`correctChoiceId` は配列内の選択肢を一意に参照する。

2026-06-27 に正解位置の分布を再配置し、次の件数で均等化した。現行データには `answer` フィールドは存在しないが、任意フィールドとして追加された場合は `pnpm validate:data` で正解インデックスとの一致を検証する。

| 範囲 | 設問数 | index 0 | index 1 | index 2 | index 3 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Part 5 | 270 | 67 | 67 | 68 | 68 |
| Part 6 | 98 | 25 | 25 | 24 | 24 |
| Part 7 | 136 | 34 | 34 | 34 | 34 |
| 全体 | 504 | 126 | 126 | 126 | 126 |

## レビュー観点

各設問について、次の観点を同じ粒度で確認する。観点ごとの記録値は `OK`、`NG`、`NA` のいずれかにする。

| 観点 | 確認内容 | OK の基準 |
| --- | --- | --- |
| 問題本文 | Part 5 の `sentence`、Part 6/7 の `passage` と `prompt` が自然で、設問として成立しているか | 英文が自然で、設問に必要な情報が不足していない |
| 選択肢 | A-D の4択が重複せず、文法・語彙・文脈上の選択肢として成立しているか | 正解以外も不自然すぎず、同一表現の重複がない |
| 正解参照 | `correctChoiceId` が実在する選択肢を指し、本文・文脈から一意に正解できるか | 根拠が本文または文法規則から説明でき、別解がない |
| 解説 | `explanation` が正解理由と誤答回避の観点を説明しているか | 学習者がなぜ正解か理解できる具体性がある |
| 難易度 | `difficulty` が `easy`、`medium`、`hard` のいずれかで、内容に対して妥当か | 語彙、文量、推論量に対して過度なずれがない |
| タグ | `tags` が空でなく、学習観点を表しているか | 文法・語彙・読解観点など、復習に使えるタグが付いている |
| 著作権・商標リスク | ETS 公式・市販教材・既存問題の再現や、TOEIC の商標を主ブランド化する表現がないか | オリジナル問題として扱え、TOEIC は説明目的に限られている |

## 判定基準

総合判定は次のいずれかを記録する。

| 総合判定 | 条件 | 次の対応 |
| --- | --- | --- |
| レビュー完了 | すべての必須観点が `OK` または `NA` で、修正不要と判断できる | リリース候補として扱える |
| 要修正 | いずれかの必須観点が `NG` で、問題データの修正が必要 | 修正内容を記録し、修正後に再レビューする |
| 保留 | 根拠確認、追加調査、別レビュアー確認が必要で完了判断できない | 保留理由と確認予定を記録する |

`著作権・商標リスク` が `NG` の設問は、他の観点が `OK` でも `レビュー完了` にしてはならない。

## 記録フォーマット

設問単位のレビュー記録は次の列を持つ表として管理する。新しいレビュー対象を追加するときは、コピー用テンプレートを複製して行を追加する。

| Part | entryId | questionId | レビュー日 | レビュアー | 問題本文 | 選択肢 | 正解参照 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| part5 | p5-001 | p5-001 | 2026-06-24 | 山田 | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-set-001 | p6-001-q1 | 2026-06-24 | 山田 | OK | NG | OK | OK | OK | OK | OK | 要修正 | 選択肢 C と D の意味が近いため差し替える | 2026-06-25 |
| part7 | p7-set-001 | p7-001-q1 | 2026-06-24 | 山田 | OK | OK | OK | OK | OK | OK | OK | 保留 | 類似表現の出典確認が必要 | 2026-06-25 |

Part 6 は、設問単位レビューに加えて、セット単位レビューを必須記録として管理する。セット単位レビューでは、同じ `entryId` に属する本文と設問群の対応、正解根拠、解説、難易度、タグ、著作権・商標リスクを確認する。

| Part | entryId | レビュー日 | レビュアー | 本文・設問対応 | 正解根拠 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| part6 | p6-set-001 | 2026-06-24 | 山田 | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |

### Part 5 レビュー記録

- 対象範囲: `web/data/part5.json` のファイル順 1〜270 件（`p5-sample-001`〜`p5-generated-265`）
- レビュー日: 2026-06-24、2026-06-27（追加分）
- レビュアー: Codex
- レビュー結果: 270 件はレビュー完了、要修正 0 件（205 件は重複差し替え後に再レビュー済み）
- Issue #19 対象範囲: ファイル順 1〜110 件（`p5-sample-001`〜`p5-generated-105`）
- Issue #20 対象範囲: ファイル順 111〜220 件（`p5-generated-106`〜`p5-generated-215`）
- Issue #20 確認結果: 後半 110 件の英文、選択肢、正解参照、解説、タグ、難易度、著作権・商標リスクを確認し、要修正 0 件、保留 0 件。同型テンプレートの反復は完全重複ではなく、公式問題や既存教材の再現に見える表現は確認されなかった。
- 2026-06-27 追加確認結果: `p5-generated-216`〜`p5-generated-225` の英文、選択肢、正解参照、解説、タグ、難易度、著作権・商標リスクを確認し、要修正 0 件、保留 0 件。公式問題や既存教材の再現に見える表現は確認されなかった。
- 2026-06-27 問題集量産追加確認結果: `p5-generated-226`〜`p5-generated-245` の英文、選択肢、正解参照、解説、タグ、難易度、著作権・商標リスクを確認し、要修正 0 件、保留 0 件。公式問題や既存教材の再現に見える表現は確認されなかった。
- 2026-06-27 Reading 実戦バランス増強追加確認結果: `p5-generated-246`〜`p5-generated-265` の英文、選択肢、正解参照、解説、タグ、難易度、著作権・商標リスクを確認し、要修正 0 件、保留 0 件。公式問題や既存教材の再現に見える表現は確認されなかった。

| Part | entryId | questionId | レビュー日 | レビュアー | 問題本文 | 選択肢 | 正解参照 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| part5 | p5-sample-001 | p5-sample-001 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-sample-002 | p5-sample-002 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-sample-003 | p5-sample-003 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-sample-004 | p5-sample-004 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-sample-005 | p5-sample-005 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-001 | p5-generated-001 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-002 | p5-generated-002 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-003 | p5-generated-003 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-004 | p5-generated-004 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-005 | p5-generated-005 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-006 | p5-generated-006 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-007 | p5-generated-007 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-008 | p5-generated-008 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-009 | p5-generated-009 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-010 | p5-generated-010 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-011 | p5-generated-011 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-012 | p5-generated-012 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-013 | p5-generated-013 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-014 | p5-generated-014 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-015 | p5-generated-015 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-016 | p5-generated-016 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-017 | p5-generated-017 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-018 | p5-generated-018 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-019 | p5-generated-019 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-020 | p5-generated-020 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-021 | p5-generated-021 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-022 | p5-generated-022 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-023 | p5-generated-023 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-024 | p5-generated-024 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-025 | p5-generated-025 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-026 | p5-generated-026 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-027 | p5-generated-027 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-028 | p5-generated-028 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-029 | p5-generated-029 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-030 | p5-generated-030 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-031 | p5-generated-031 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-032 | p5-generated-032 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-033 | p5-generated-033 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-034 | p5-generated-034 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-035 | p5-generated-035 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-036 | p5-generated-036 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-037 | p5-generated-037 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-038 | p5-generated-038 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-039 | p5-generated-039 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-040 | p5-generated-040 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-041 | p5-generated-041 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-042 | p5-generated-042 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-043 | p5-generated-043 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-044 | p5-generated-044 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-045 | p5-generated-045 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-046 | p5-generated-046 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-047 | p5-generated-047 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-048 | p5-generated-048 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-049 | p5-generated-049 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-050 | p5-generated-050 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-051 | p5-generated-051 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-052 | p5-generated-052 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-053 | p5-generated-053 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-054 | p5-generated-054 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-055 | p5-generated-055 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-056 | p5-generated-056 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-057 | p5-generated-057 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-058 | p5-generated-058 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-059 | p5-generated-059 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-060 | p5-generated-060 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-061 | p5-generated-061 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-062 | p5-generated-062 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-063 | p5-generated-063 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-064 | p5-generated-064 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-065 | p5-generated-065 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-066 | p5-generated-066 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-067 | p5-generated-067 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-068 | p5-generated-068 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-069 | p5-generated-069 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-070 | p5-generated-070 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-071 | p5-generated-071 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-072 | p5-generated-072 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-073 | p5-generated-073 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-074 | p5-generated-074 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-075 | p5-generated-075 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-076 | p5-generated-076 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-077 | p5-generated-077 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-078 | p5-generated-078 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-079 | p5-generated-079 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-080 | p5-generated-080 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-081 | p5-generated-081 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-082 | p5-generated-082 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-083 | p5-generated-083 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-084 | p5-generated-084 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-085 | p5-generated-085 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-086 | p5-generated-086 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-087 | p5-generated-087 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-088 | p5-generated-088 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-089 | p5-generated-089 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-090 | p5-generated-090 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-091 | p5-generated-091 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-092 | p5-generated-092 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-093 | p5-generated-093 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-094 | p5-generated-094 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-095 | p5-generated-095 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-096 | p5-generated-096 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-097 | p5-generated-097 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-098 | p5-generated-098 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-099 | p5-generated-099 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-100 | p5-generated-100 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-101 | p5-generated-101 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-102 | p5-generated-102 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-103 | p5-generated-103 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-104 | p5-generated-104 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-105 | p5-generated-105 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-106 | p5-generated-106 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-107 | p5-generated-107 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-108 | p5-generated-108 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-109 | p5-generated-109 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-110 | p5-generated-110 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-111 | p5-generated-111 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-112 | p5-generated-112 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-113 | p5-generated-113 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-114 | p5-generated-114 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-115 | p5-generated-115 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-116 | p5-generated-116 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-117 | p5-generated-117 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-118 | p5-generated-118 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-119 | p5-generated-119 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-120 | p5-generated-120 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-121 | p5-generated-121 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-122 | p5-generated-122 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-123 | p5-generated-123 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-124 | p5-generated-124 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-125 | p5-generated-125 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-126 | p5-generated-126 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-127 | p5-generated-127 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-128 | p5-generated-128 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-129 | p5-generated-129 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-130 | p5-generated-130 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-131 | p5-generated-131 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-132 | p5-generated-132 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-133 | p5-generated-133 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-134 | p5-generated-134 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-135 | p5-generated-135 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-136 | p5-generated-136 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-137 | p5-generated-137 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-138 | p5-generated-138 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-139 | p5-generated-139 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-140 | p5-generated-140 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-141 | p5-generated-141 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-142 | p5-generated-142 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-143 | p5-generated-143 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-144 | p5-generated-144 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-145 | p5-generated-145 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-146 | p5-generated-146 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-147 | p5-generated-147 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-148 | p5-generated-148 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-149 | p5-generated-149 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-150 | p5-generated-150 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-151 | p5-generated-151 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-152 | p5-generated-152 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-153 | p5-generated-153 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-154 | p5-generated-154 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-155 | p5-generated-155 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-156 | p5-generated-156 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-157 | p5-generated-157 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-158 | p5-generated-158 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-159 | p5-generated-159 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-160 | p5-generated-160 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-161 | p5-generated-161 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-162 | p5-generated-162 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-163 | p5-generated-163 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-164 | p5-generated-164 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-165 | p5-generated-165 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-166 | p5-generated-166 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-167 | p5-generated-167 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-168 | p5-generated-168 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-169 | p5-generated-169 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-170 | p5-generated-170 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-171 | p5-generated-171 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-172 | p5-generated-172 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-173 | p5-generated-173 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-174 | p5-generated-174 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-175 | p5-generated-175 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-176 | p5-generated-176 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-177 | p5-generated-177 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-178 | p5-generated-178 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-179 | p5-generated-179 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-180 | p5-generated-180 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-181 | p5-generated-181 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-182 | p5-generated-182 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-183 | p5-generated-183 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-184 | p5-generated-184 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-185 | p5-generated-185 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-186 | p5-generated-186 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-187 | p5-generated-187 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-188 | p5-generated-188 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-189 | p5-generated-189 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-190 | p5-generated-190 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-191 | p5-generated-191 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-192 | p5-generated-192 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-193 | p5-generated-193 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-194 | p5-generated-194 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-195 | p5-generated-195 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-196 | p5-generated-196 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-197 | p5-generated-197 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-198 | p5-generated-198 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-199 | p5-generated-199 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-200 | p5-generated-200 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-201 | p5-generated-201 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-202 | p5-generated-202 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-203 | p5-generated-203 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-204 | p5-generated-204 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-205 | p5-generated-205 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-206 | p5-generated-206 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-207 | p5-generated-207 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-208 | p5-generated-208 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-209 | p5-generated-209 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-210 | p5-generated-210 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-211 | p5-generated-211 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-212 | p5-generated-212 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-213 | p5-generated-213 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-214 | p5-generated-214 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-215 | p5-generated-215 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 重複差し替え後に再レビュー済み | 2026-06-24 |
| part5 | p5-generated-216 | p5-generated-216 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-217 | p5-generated-217 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-218 | p5-generated-218 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-219 | p5-generated-219 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-220 | p5-generated-220 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-221 | p5-generated-221 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-222 | p5-generated-222 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-223 | p5-generated-223 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-224 | p5-generated-224 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-225 | p5-generated-225 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-226 | p5-generated-226 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-227 | p5-generated-227 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-228 | p5-generated-228 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-229 | p5-generated-229 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-230 | p5-generated-230 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-231 | p5-generated-231 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-232 | p5-generated-232 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-233 | p5-generated-233 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-234 | p5-generated-234 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-235 | p5-generated-235 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-236 | p5-generated-236 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-237 | p5-generated-237 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-238 | p5-generated-238 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-239 | p5-generated-239 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-240 | p5-generated-240 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-241 | p5-generated-241 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-242 | p5-generated-242 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-243 | p5-generated-243 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-244 | p5-generated-244 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-245 | p5-generated-245 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-246 | p5-generated-246 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-247 | p5-generated-247 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-248 | p5-generated-248 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-249 | p5-generated-249 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-250 | p5-generated-250 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-251 | p5-generated-251 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-252 | p5-generated-252 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-253 | p5-generated-253 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-254 | p5-generated-254 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-255 | p5-generated-255 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-256 | p5-generated-256 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-257 | p5-generated-257 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-258 | p5-generated-258 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-259 | p5-generated-259 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-260 | p5-generated-260 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-261 | p5-generated-261 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-262 | p5-generated-262 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-263 | p5-generated-263 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-264 | p5-generated-264 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part5 | p5-generated-265 | p5-generated-265 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |

### Part 6 レビュー記録

- 対象範囲: `web/data/part6.json` の全 40 セット / 98 設問（`p6-sample-set-001`、`p6-generated-set-001`〜`p6-generated-set-039`）
- レビュー日: 2026-06-24、2026-06-27（追加分）
- レビュアー: Codex
- レビュー結果: 98 設問はレビュー完了、要修正 0 件、保留 0 件
- Issue #21 確認結果: 全セットの本文、設問、選択肢、正解参照、解説、難易度、タグ、著作権・商標リスクを確認し、本文または文脈から正解を一意に説明できることを確認した。
- 2026-06-27 追加確認結果: `p6-generated-set-021`〜`p6-generated-set-030` の本文、設問、選択肢、正解参照、解説、難易度、タグ、著作権・商標リスクを確認し、本文または文脈から正解を一意に説明できることを確認した。
- 2026-06-27 問題集量産追加確認結果: `p6-generated-set-031`〜`p6-generated-set-034` の本文、設問、選択肢、正解参照、解説、難易度、タグ、著作権・商標リスクを確認し、本文または文脈から正解を一意に説明できることを確認した。
- 2026-06-27 Reading 実戦バランス増強追加確認結果: `p6-generated-set-035`〜`p6-generated-set-039` の本文、空所設問、選択肢、正解参照、解説、難易度、タグ、著作権・商標リスクを確認し、本文または文脈から正解を一意に説明できることを確認した。
- 注意事項: `p6-generated-set-001`〜`p6-generated-set-020` は同じメモ構造、同じ 2 設問構成、正解位置 A/B の反復がある。現行 Issue では本文と設問の対応、正解根拠、解説、タグ、権利リスクが受け入れ条件を満たすためレビュー完了とし、設問バリエーションの拡充は将来の改善候補として扱う。

#### Part 6 セット単位レビュー

| Part | entryId | レビュー日 | レビュアー | 本文・設問対応 | 正解根拠 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| part6 | p6-sample-set-001 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-001 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-002 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-003 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-004 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-005 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-006 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-007 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-008 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-009 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-010 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-011 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-012 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-013 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-014 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-015 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-016 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-017 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-018 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-019 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-020 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-021 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-022 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-023 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-024 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-025 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-026 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-027 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-028 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-029 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-030 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-031 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-032 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-033 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-034 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-035 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-036 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-037 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-038 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-039 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |

#### Part 6 設問単位レビュー

| Part | entryId | questionId | レビュー日 | レビュアー | 問題本文 | 選択肢 | 正解参照 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| part6 | p6-sample-set-001 | p6-sample-001 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-sample-set-001 | p6-sample-002 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-001 | p6-generated-q-001-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-001 | p6-generated-q-001-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-002 | p6-generated-q-002-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-002 | p6-generated-q-002-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-003 | p6-generated-q-003-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-003 | p6-generated-q-003-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-004 | p6-generated-q-004-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-004 | p6-generated-q-004-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-005 | p6-generated-q-005-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-005 | p6-generated-q-005-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-006 | p6-generated-q-006-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-006 | p6-generated-q-006-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-007 | p6-generated-q-007-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-007 | p6-generated-q-007-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-008 | p6-generated-q-008-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-008 | p6-generated-q-008-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-009 | p6-generated-q-009-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-009 | p6-generated-q-009-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-010 | p6-generated-q-010-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-010 | p6-generated-q-010-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-011 | p6-generated-q-011-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-011 | p6-generated-q-011-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-012 | p6-generated-q-012-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-012 | p6-generated-q-012-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-013 | p6-generated-q-013-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-013 | p6-generated-q-013-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-014 | p6-generated-q-014-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-014 | p6-generated-q-014-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-015 | p6-generated-q-015-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-015 | p6-generated-q-015-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-016 | p6-generated-q-016-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-016 | p6-generated-q-016-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-017 | p6-generated-q-017-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-017 | p6-generated-q-017-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-018 | p6-generated-q-018-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-018 | p6-generated-q-018-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-019 | p6-generated-q-019-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-019 | p6-generated-q-019-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-020 | p6-generated-q-020-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-020 | p6-generated-q-020-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-021 | p6-generated-q-021-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-021 | p6-generated-q-021-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-022 | p6-generated-q-022-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-022 | p6-generated-q-022-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-023 | p6-generated-q-023-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-023 | p6-generated-q-023-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-024 | p6-generated-q-024-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-024 | p6-generated-q-024-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-025 | p6-generated-q-025-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-025 | p6-generated-q-025-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-026 | p6-generated-q-026-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-026 | p6-generated-q-026-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-027 | p6-generated-q-027-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-027 | p6-generated-q-027-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-028 | p6-generated-q-028-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-028 | p6-generated-q-028-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-029 | p6-generated-q-029-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-029 | p6-generated-q-029-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-030 | p6-generated-q-030-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-030 | p6-generated-q-030-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-031 | p6-generated-q-031-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-031 | p6-generated-q-031-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-031 | p6-generated-q-031-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-031 | p6-generated-q-031-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-032 | p6-generated-q-032-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-032 | p6-generated-q-032-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-032 | p6-generated-q-032-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-032 | p6-generated-q-032-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-033 | p6-generated-q-033-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-033 | p6-generated-q-033-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-033 | p6-generated-q-033-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-033 | p6-generated-q-033-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-034 | p6-generated-q-034-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-034 | p6-generated-q-034-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-034 | p6-generated-q-034-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-034 | p6-generated-q-034-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-035 | p6-generated-q-035-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-035 | p6-generated-q-035-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-035 | p6-generated-q-035-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-035 | p6-generated-q-035-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-036 | p6-generated-q-036-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-036 | p6-generated-q-036-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-036 | p6-generated-q-036-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-036 | p6-generated-q-036-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-037 | p6-generated-q-037-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-037 | p6-generated-q-037-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-037 | p6-generated-q-037-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-037 | p6-generated-q-037-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-038 | p6-generated-q-038-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-038 | p6-generated-q-038-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-038 | p6-generated-q-038-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-038 | p6-generated-q-038-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-039 | p6-generated-q-039-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-039 | p6-generated-q-039-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-039 | p6-generated-q-039-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-generated-set-039 | p6-generated-q-039-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |

### Part 7 レビュー記録

- 対象範囲: `web/data/part7.json` の全 52 セット / 136 設問（`p7-sample-set-001`、`p7-generated-set-001`〜`p7-generated-set-051`）
- レビュー日: 2026-06-24、2026-06-27、2026-06-30（追加分）
- レビュアー: Codex
- レビュー結果: 136 設問はレビュー完了、要修正 0 件、保留 0 件
- Issue #22 確認結果: 全セットの本文、設問、選択肢、正解参照、解説、難易度、タグ、著作権・商標リスクを確認し、本文または文脈から正解を一意に説明できることを確認した。
- 2026-06-27 追加確認結果: `p7-generated-set-021`〜`p7-generated-set-035` の本文、設問、選択肢、正解参照、解説、難易度、タグ、著作権・商標リスクを確認し、本文または文脈から正解を一意に説明できることを確認した。
- 2026-06-27 問題集量産追加確認結果: `p7-generated-set-036`〜`p7-generated-set-041` の本文、設問、選択肢、正解参照、解説、難易度、タグ、著作権・商標リスクを確認し、本文または文脈から正解を一意に説明できることを確認した。
- 2026-06-27 Reading 実戦バランス増強追加確認結果: `p7-generated-set-042`〜`p7-generated-set-046` の本文、設問、選択肢、正解参照、解説、難易度、タグ、著作権・商標リスクを確認し、本文または文脈から正解を一意に説明できることを確認した。
- 2026-06-30 最新受験情報確認後の Part 7 追加確認結果: `p7-generated-set-047`〜`p7-generated-set-051` の本文、設問、選択肢、正解参照、解説、難易度、タグ、著作権・商標リスクを確認し、本文または文脈から正解を一意に説明できることを確認した。
- 修正内容: `p7-generated-set-001`〜`p7-generated-set-020` はセットIDと設問IDを維持したまま、同一の設問文・選択肢が反復していた箇所を本文根拠に基づく設問、選択肢、解説へ差し替えた。
- 注意事項: 生成セットのパッセージ本文は、各設問の正解根拠が本文から明確に取れる範囲で維持した。公式問題や市販教材の再現に見える表現、TOEIC の商標を主ブランド化する表現は確認されなかった。

| Part | entryId | questionId | レビュー日 | レビュアー | 問題本文 | 選択肢 | 正解参照 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| part7 | p7-sample-set-001 | p7-sample-001 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし | 2026-06-24 |
| part7 | p7-sample-set-001 | p7-sample-002 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし | 2026-06-24 |
| part7 | p7-generated-set-001 | p7-generated-q-001-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-001 | p7-generated-q-001-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-002 | p7-generated-q-002-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-002 | p7-generated-q-002-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-003 | p7-generated-q-003-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-003 | p7-generated-q-003-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-004 | p7-generated-q-004-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-004 | p7-generated-q-004-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-005 | p7-generated-q-005-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-005 | p7-generated-q-005-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-006 | p7-generated-q-006-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-006 | p7-generated-q-006-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-007 | p7-generated-q-007-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-007 | p7-generated-q-007-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-008 | p7-generated-q-008-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-008 | p7-generated-q-008-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-009 | p7-generated-q-009-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-009 | p7-generated-q-009-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-010 | p7-generated-q-010-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-010 | p7-generated-q-010-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-011 | p7-generated-q-011-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-011 | p7-generated-q-011-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-012 | p7-generated-q-012-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-012 | p7-generated-q-012-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-013 | p7-generated-q-013-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-013 | p7-generated-q-013-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-014 | p7-generated-q-014-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-014 | p7-generated-q-014-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-015 | p7-generated-q-015-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-015 | p7-generated-q-015-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-016 | p7-generated-q-016-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-016 | p7-generated-q-016-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-017 | p7-generated-q-017-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-017 | p7-generated-q-017-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-018 | p7-generated-q-018-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-018 | p7-generated-q-018-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-019 | p7-generated-q-019-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-019 | p7-generated-q-019-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-020 | p7-generated-q-020-01 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-020 | p7-generated-q-020-02 | 2026-06-24 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | 設問・選択肢の反復を修正後に再レビュー済み | 2026-06-24 |
| part7 | p7-generated-set-021 | p7-generated-q-021-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-021 | p7-generated-q-021-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-022 | p7-generated-q-022-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-022 | p7-generated-q-022-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-023 | p7-generated-q-023-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-023 | p7-generated-q-023-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-024 | p7-generated-q-024-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-024 | p7-generated-q-024-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-025 | p7-generated-q-025-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-025 | p7-generated-q-025-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-026 | p7-generated-q-026-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-026 | p7-generated-q-026-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-027 | p7-generated-q-027-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-027 | p7-generated-q-027-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-028 | p7-generated-q-028-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-028 | p7-generated-q-028-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-029 | p7-generated-q-029-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-029 | p7-generated-q-029-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-030 | p7-generated-q-030-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-030 | p7-generated-q-030-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-031 | p7-generated-q-031-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-031 | p7-generated-q-031-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-032 | p7-generated-q-032-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-032 | p7-generated-q-032-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-033 | p7-generated-q-033-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-033 | p7-generated-q-033-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-034 | p7-generated-q-034-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-034 | p7-generated-q-034-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-035 | p7-generated-q-035-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-035 | p7-generated-q-035-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-036 | p7-generated-q-036-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-036 | p7-generated-q-036-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-036 | p7-generated-q-036-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-036 | p7-generated-q-036-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-037 | p7-generated-q-037-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-037 | p7-generated-q-037-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-037 | p7-generated-q-037-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-037 | p7-generated-q-037-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-038 | p7-generated-q-038-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-038 | p7-generated-q-038-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-038 | p7-generated-q-038-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-038 | p7-generated-q-038-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-039 | p7-generated-q-039-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-039 | p7-generated-q-039-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-039 | p7-generated-q-039-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-039 | p7-generated-q-039-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-040 | p7-generated-q-040-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-040 | p7-generated-q-040-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-040 | p7-generated-q-040-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-040 | p7-generated-q-040-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-041 | p7-generated-q-041-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-041 | p7-generated-q-041-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-041 | p7-generated-q-041-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-041 | p7-generated-q-041-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-042 | p7-generated-q-042-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-042 | p7-generated-q-042-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-042 | p7-generated-q-042-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-042 | p7-generated-q-042-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-043 | p7-generated-q-043-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-043 | p7-generated-q-043-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-043 | p7-generated-q-043-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-043 | p7-generated-q-043-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-044 | p7-generated-q-044-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-044 | p7-generated-q-044-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-044 | p7-generated-q-044-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-044 | p7-generated-q-044-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-045 | p7-generated-q-045-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-045 | p7-generated-q-045-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-045 | p7-generated-q-045-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-045 | p7-generated-q-045-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-046 | p7-generated-q-046-01 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-046 | p7-generated-q-046-02 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-046 | p7-generated-q-046-03 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-046 | p7-generated-q-046-04 | 2026-06-27 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-047 | p7-generated-q-047-01 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-047 | p7-generated-q-047-02 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-047 | p7-generated-q-047-03 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-047 | p7-generated-q-047-04 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-048 | p7-generated-q-048-01 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-048 | p7-generated-q-048-02 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-048 | p7-generated-q-048-03 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-048 | p7-generated-q-048-04 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-049 | p7-generated-q-049-01 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-049 | p7-generated-q-049-02 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-049 | p7-generated-q-049-03 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-049 | p7-generated-q-049-04 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-050 | p7-generated-q-050-01 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-050 | p7-generated-q-050-02 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-050 | p7-generated-q-050-03 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-050 | p7-generated-q-050-04 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-051 | p7-generated-q-051-01 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-051 | p7-generated-q-051-02 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-051 | p7-generated-q-051-03 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part7 | p7-generated-set-051 | p7-generated-q-051-04 | 2026-06-30 | Codex | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |

### コピー用テンプレート

設問単位レビュー用:

| Part | entryId | questionId | レビュー日 | レビュアー | 問題本文 | 選択肢 | 正解参照 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

Part 6 セット単位レビュー用:

| Part | entryId | レビュー日 | レビュアー | 本文・設問対応 | 正解根拠 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |  |  |  |

## 運用手順

1. `web/` で `pnpm validate:data` を実行し、問題データのスキーマ、ID、選択肢、正解参照、`answer` インデックス、正解位置分布、タグ、解説、`reviewed` フラグにエラーがないことを確認する。
2. レビュー対象の設問を設問単位で記録表に追加する。Part 6 / Part 7 はパッセージセットの `entryId` と設問の `questionId` を両方記録する。Part 6 はあわせてセット単位レビュー表にも `entryId` 単位で記録する。
3. レビュー観点ごとに `OK`、`NG`、`NA` を記録する。`NA` を使う場合は、`修正内容/保留理由` に適用外と判断した理由を書く。
4. 総合判定を `レビュー完了`、`要修正`、`保留` のいずれかで記録する。
5. `要修正` の設問は問題データ修正後に再レビューし、`保留` の設問は根拠確認後に再判定する。
6. リリース前に `web/` で `pnpm validate:review` と `pnpm build` を実行し、レビュー文書の構造とアプリの静的ビルドが通ることを確認する。

## リリース確認

`0.1.0` のリリース前には、次の条件を満たすことを確認する。

- フラット化後の設問数が300問以上である。
- `web/` で `pnpm validate:data` が成功し、正解位置分布の偏りが検出されない。
- レビュー記録の全設問が `レビュー完了` になっている。
- `要修正` または `保留` の設問が残っていない。
- ETS 公式・市販教材・既存問題の再現と判断される設問が残っていない。
- TOEIC 商標は説明目的に限定され、ETS 非提携であることが画面内に明示されている。

### 0.1.0 問題データ検証実行記録

| 検証日時 | 実行コマンド | 結果 | フラット化後の設問数 | reviewed 確認 |
| --- | --- | --- | --- | --- |
| 2026-06-24 20:51:42 JST (+0900) | `cd web && pnpm validate:data` | 成功（`問題データ検証に成功しました。`） | 304問（Part 5: 220問、Part 6: 42問、Part 7: 42問） | 設問 304/304、Part 6/7 セット 42/42 が `reviewed: true` |
| 2026-06-27 11:13:23 JST (+0900) | `cd web && pnpm validate:data` | 成功（`問題データ検証に成功しました。`） | 364問（Part 5: 230問、Part 6: 62問、Part 7: 72問） | 設問 364/364、Part 6/7 セット 67/67 が `reviewed: true` |
| 2026-06-27 20:31:25 JST (+0900) | `cd web && pnpm validate:data` | 成功（`問題データ検証に成功しました。`） | 424問（Part 5: 250問、Part 6: 78問、Part 7: 96問） | 設問 424/424、Part 6/7 セット 77/77 が `reviewed: true` |
| 2026-06-27 22:03:22 JST (+0900) | `cd web && pnpm validate:data` | 成功（`問題データ検証に成功しました。`） | 484問（Part 5: 270問、Part 6: 98問、Part 7: 116問） | 設問 484/484、Part 6/7 セット 87/87 が `reviewed: true`。正解位置は全体 121/121/121/121 |
| 2026-06-30 08:36:34 JST (+0900) | `cd web && pnpm validate:data && pnpm validate:review` | 成功（問題データ検証・レビュー文書検証に成功） | 504問（Part 5: 270問、Part 6: 98問、Part 7: 136問） | 設問 504/504、Part 6/7 セット 92/92 が `reviewed: true`。正解位置は全体 126/126/126/126 |
