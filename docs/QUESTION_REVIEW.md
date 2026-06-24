# 問題レビュー基準と記録フォーマット

この文書は、`web/data/part5.json`、`web/data/part6.json`、`web/data/part7.json` に含まれる Reading 問題を、人間レビューで完了判定するための基準と記録フォーマットを定義する。

`reviewed: true` は自動検証上の必須フラグとして扱う。一方で、`0.1.0` の人間レビュー完了証跡は、この文書のフォーマットに沿ったレビュー記録の総合判定で確認する。

## レビュー対象

- 対象データ: `web/data/part5.json`、`web/data/part6.json`、`web/data/part7.json`
- 対象 Part: Part 5、Part 6、Part 7
- 記録単位: Part 5 / Part 6 / Part 7 をすべて設問単位で記録する
- Part 6 / Part 7 の扱い: 同じパッセージセットに属する設問は `entryId` で追跡する

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

レビュー記録は次の列を持つ表として管理する。新しいレビュー対象を追加するときは、コピー用テンプレートを複製して行を追加する。

| Part | entryId | questionId | レビュー日 | レビュアー | 問題本文 | 選択肢 | 正解参照 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| part5 | p5-001 | p5-001 | 2026-06-24 | 山田 | OK | OK | OK | OK | OK | OK | OK | レビュー完了 | なし |  |
| part6 | p6-set-001 | p6-001-q1 | 2026-06-24 | 山田 | OK | NG | OK | OK | OK | OK | OK | 要修正 | 選択肢 C と D の意味が近いため差し替える | 2026-06-25 |
| part7 | p7-set-001 | p7-001-q1 | 2026-06-24 | 山田 | OK | OK | OK | OK | OK | OK | OK | 保留 | 類似表現の出典確認が必要 | 2026-06-25 |

### Part 5 前半レビュー記録

- 対象範囲: `web/data/part5.json` のファイル順 1〜110 件（`p5-sample-001`〜`p5-generated-105`）
- レビュー日: 2026-06-24
- レビュアー: Codex
- レビュー結果: 110 件はレビュー完了、要修正 0 件（95 件は重複差し替え後に再レビュー済み）

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

### コピー用テンプレート

| Part | entryId | questionId | レビュー日 | レビュアー | 問題本文 | 選択肢 | 正解参照 | 解説 | 難易度 | タグ | 著作権・商標リスク | 総合判定 | 修正内容/保留理由 | 再レビュー日 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## 運用手順

1. `web/` で `pnpm validate:data` を実行し、問題データのスキーマ、ID、選択肢、正解参照、タグ、解説、`reviewed` フラグにエラーがないことを確認する。
2. レビュー対象の設問を設問単位で記録表に追加する。Part 6 / Part 7 はパッセージセットの `entryId` と設問の `questionId` を両方記録する。
3. レビュー観点ごとに `OK`、`NG`、`NA` を記録する。`NA` を使う場合は、`修正内容/保留理由` に適用外と判断した理由を書く。
4. 総合判定を `レビュー完了`、`要修正`、`保留` のいずれかで記録する。
5. `要修正` の設問は問題データ修正後に再レビューし、`保留` の設問は根拠確認後に再判定する。
6. リリース前に `web/` で `pnpm validate:review` と `pnpm build` を実行し、レビュー文書の構造とアプリの静的ビルドが通ることを確認する。

## リリース確認

`0.1.0` のリリース前には、次の条件を満たすことを確認する。

- フラット化後の設問数が300問以上である。
- `web/` で `pnpm validate:data` が成功する。
- レビュー記録の全設問が `レビュー完了` になっている。
- `要修正` または `保留` の設問が残っていない。
- ETS 公式・市販教材・既存問題の再現と判断される設問が残っていない。
- TOEIC 商標は説明目的に限定され、ETS 非提携であることが画面内に明示されている。
