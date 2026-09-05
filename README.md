# qr-source

ネットワークを使わず、ファイルまたはディレクトリを複数の QR コード PNG に変換し、画像だけから復元する Node.js CLI です。QR 内の `projectId`、`chunkIndex`、SHA-256 を使うため、画像のファイル名や並び順には依存しません。

## 必要環境

Node.js 20 以降。

```bash
npm install
npm run build
node dist/index.js encode ./my-project --output ./qr-output
node dist/index.js decode ./qr-output --output ./restored
```

開発中は `npm run dev -- encode ./my-project` のように実行できます。

## まず動かす

リポジトリ内の `examples/sample-project` は、入れ子のソース・設定・テキストファイルを含む試用用ディレクトリです。次の1コマンドで QR の生成、復元、元ファイルとの完全一致確認まで実行できます。

```bash
npm run demo
```

結果は `test-tmp/demo/qr-images` と `test-tmp/demo/restored` に残ります。どちらも Git 管理外なので、何度実行しても安全です。

## 主なオプション

```text
qr-source encode <input> [-o <directory>] [--chunk-size <100..1200>] [--exclude <name>] [--error-correction <L|M|Q|H>] [--force]
qr-source decode <qr-directory> [-o <directory>] [--force]
```

- 既定チャンクサイズは 800 バイトです。高密度 QR を避けるため、1200 バイトを上限にしています。
- ディレクトリ入力では `.git`、`node_modules`、`dist`、`build`、`coverage`、`.DS_Store` を既定で除外します。追加は `--exclude` を複数指定します。
- 出力先に既存ファイルがあれば中止します。意図的な再利用または上書き時だけ `--force` を指定してください。
- PNG/JPG/JPEG を読み込みます。読めなかった画像は表示しますが、正常な QR が揃っていれば復元を続行します。

## 形式と安全性

各 QR にはフォーマット版、UUID の project ID、0 始まりのチャンク番号、総数、圧縮アーカイブ全体の SHA-256、Base64 ペイロードを JSON で格納します。`manifest.json` は補助情報であり、復元に不要です。

復元前に不足・重複・別プロジェクト混入・メタデータ不整合・チェックサム不一致を検出します。アーカイブのパスは展開先外へ出られないよう検証し、シンボリックリンクは入力時に含めません。

## 検証

```bash
npm test
```

テストは、入れ子のテキスト／バイナリファイルを QR 化し、PNG を別名に変更してから復元し、内容とディレクトリ構造が保たれることを確認します。
