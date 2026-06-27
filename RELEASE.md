# リリース手順

このプロジェクトは Vercel の Git 連携で公開します。アプリ本体は `web/` にあり、リリース番号はリポジトリ直下の `VERSION` を唯一の手入力元として扱います。

## バージョン更新

1. リポジトリ直下の `VERSION` を次のリリース番号に変更します。
   - 形式は `x.y.z` のみです。
   - 例: `0.1.0` から `0.1.1`
2. バージョンを同期します。

```bash
cd web
pnpm sync:version
```

3. 同期状態を確認します。

```bash
pnpm check:version
```

`pnpm sync:version` は、次のファイルを `VERSION` に合わせて更新します。

- `web/VERSION`
- `web/package.json`
- `web/lib/appVersion.ts`

ドキュメント内の過去リリース記録や将来計画のバージョン番号は自動更新しません。`CHANGELOG.md` やリリースメモが必要な場合は、内容を確認して手動で更新してください。

## リリース前確認

リリース前に、少なくとも次の確認を実行します。

```bash
cd web
node scripts/sync-version.mjs --self-test
pnpm check:version
pnpm build
```

`pnpm build` は、バージョン同期確認、問題データ検証、レビュー文書検証、Next.js の静的エクスポートを実行します。出力先は `web/out/` です。

## Vercel 設定

Vercel プロジェクトは次の設定を前提にします。

- Root Directory: `web`
- Framework Preset: Next.js
- Build Command: `pnpm build`
- Output Directory: `out`

Vercel の Root Directory が `web` の場合、ビルド中にリポジトリ直下の `VERSION` を直接参照できないことがあります。そのため、`pnpm sync:version` で生成される `web/VERSION` も必ずコミットしてください。Vercel の `pnpm build` では、`web/VERSION`、`web/package.json`、`web/lib/appVersion.ts` の一致を確認します。

## 公開

1. 変更内容を確認します。

```bash
git status --short
git diff
```

2. `VERSION`、`web/VERSION`、`web/package.json`、`web/lib/appVersion.ts`、必要に応じて `CHANGELOG.md` をコミットします。
3. 必要であれば `vX.Y.Z` 形式の Git タグを作成します。
4. リリース対象ブランチまたはタグを push します。
5. Vercel の本番デプロイが成功したことを確認します。
6. 公開後、設定画面のバージョン表示が `VERSION` と一致していることを確認します。
