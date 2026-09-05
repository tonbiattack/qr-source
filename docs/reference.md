# CLIリファレンスと検証

## コマンド

```text
qr-source encode <input> [-o <directory>] [--chunk-size <100..1200>] [--exclude <name>] [--error-correction <L|M|Q|H>] [--photo-friendly|--video-friendly] [--force]
qr-source decode <qr-directory> [-o <directory>] [--force]
qr-source show <qr-directory> [--interval <ms>] [--gap <ms>] [--loop] [--fullscreen] [--chunks <indexes>]
qr-source decode-video <video> [-o <directory>] [--scan-fps <number>] [--force]
```

- 通常の既定チャンクサイズは800バイト、上限は1200バイトです。
- `.git`、`node_modules`、`dist`、`build`、`coverage`、`.DS_Store`はディレクトリ入力時に除外されます。`--exclude`を複数指定して追加できます。
- 出力先に既存ファイルがあれば中止します。意図的に再利用・上書きするときだけ`--force`を指定してください。

## 安全性と整合性

各QRにはフォーマット版、UUIDのproject ID、0始まりのチャンク番号、総数、圧縮アーカイブ全体のSHA-256、Base64ペイロードをJSONで保存します。`manifest.json`は補助情報であり、復元に不要です。

復元前に不足、重複、別プロジェクト混入、メタデータ不整合、チェックサム不一致を検出します。アーカイブは展開先外へ出られないようパスを検証し、シンボリックリンクは入力に含めません。

## テスト

```bash
npm test
```

テストでは、入れ子のテキスト・バイナリ、画像名変更、JPEG・回転・重複・非QR画像、video-friendly出力を確認します。FFmpegがある環境では、QR PNG群からMP4を生成し、`decode-video`で元バイナリが完全一致する動画E2Eテストも実行します。FFmpegがないローカル環境では動画テストだけをskipし、GitHub ActionsではFFmpegを導入して実行します。
