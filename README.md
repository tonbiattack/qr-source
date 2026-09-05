# qr-source

ネットワークを使わず、ファイルやディレクトリを複数のQRコードPNGへ変換し、画像・写真・動画から復元するNode.js CLIです。QR内部の`projectId`、`chunkIndex`、SHA-256で整合性を確認するため、ファイル名や撮影順には依存しません。

## 最短で試す

Node.js 20以降で、次を実行します。

```bash
npm install
npm run build
npm run demo
```

`npm run demo` はサンプルのQR生成、復元、完全一致確認まで行います。

## 主なコマンド

```bash
node dist/index.js encode ./my-project --output ./qr-output
node dist/index.js decode ./qr-output --output ./restored
```

## ドキュメント

- [開発環境と `npm link` のセットアップ](docs/setup.md)
- [スマートフォン写真からの復元](docs/photo-transfer.md)
- [動画撮影による転送](docs/video-transfer.md)
- [CLIオプション、安全性、検証](docs/reference.md)
- [ドキュメント一覧](docs/README.md)
