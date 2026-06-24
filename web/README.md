# 5分リーディングドリル Web

Next.js App Router、TypeScript、TailwindCSS、pnpm を使ったアプリ本体です。

## 開発

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## ビルド

```bash
pnpm build
```

`next.config.ts` で `output: "export"` を設定しているため、静的サイトは `out/` に出力されます。

## 検証

```bash
pnpm validate:data
pnpm validate:review
```

`validate:data` は問題データのスキーマ、ID、正解参照、レビュー状態を確認します。`validate:review` はリポジトリ直下の `docs/QUESTION_REVIEW.md` に、レビュー基準と記録フォーマットの必須項目が残っていることを確認します。

## 問題レビュー

問題レビューの観点、判定基準、記録フォーマット、リリース前の確認手順は `docs/QUESTION_REVIEW.md` を参照します。人間レビュー完了の証跡は、JSON の `reviewed: true` だけでなく、同ドキュメントの記録フォーマットに沿って設問単位で残します。

## 規約

プロダクト要件と UI 方針はリポジトリ直下の `docs/` を参照します。
