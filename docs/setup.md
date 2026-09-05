# 開発環境とCLIセットアップ

Node.js 24以降が必要です。リポジトリ内から直接実行する場合は、次のとおりです。

```bash
npm install
npm run build
node dist/index.js encode ./my-project
```

## `npm link` で任意のディレクトリから実行する

`package.json` の `bin` とエントリーポイントのshebangにより、開発中はグローバルCLIとしてリンクできます。リポジトリのルートで一度実行してください。

```bash
npm install
npm run build
npm link
```

以後は別ディレクトリから実行できます。

```powershell
cd C:\work\other-project
qr-source encode .
qr-source decode ./qr-output
```

ソース変更後は`npm run build`を再実行します。通常は`npm link`をやり直す必要はありません。リンク解除は`npm unlink -g qr-source`です。npm公開後は`npm install -g qr-source`で導入できる予定ですが、現時点では未公開です。
