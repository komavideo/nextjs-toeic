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

## 規約

プロダクト要件と UI 方針はリポジトリ直下の `docs/` を参照します。
