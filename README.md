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

## 任意のディレクトリから `qr-source` を実行する（開発用）

このリポジトリには、`package.json` の `bin` と `src/index.ts` の Node.js shebang が設定されています。開発中にグローバルCLIとして試すには、リポジトリのルートで一度だけリンクを作成します。

```bash
npm install
npm run build
npm link
```

以後は別のディレクトリから、`node dist/index.js` を指定せずに実行できます。

```powershell
cd C:\work\other-project
qr-source encode . --output ./qr-output
qr-source decode ./qr-output --output ./restored
```

ソースを変更した場合は `npm run build` を再実行してください。通常、`npm link` をやり直す必要はありません。リンクを外す場合は `npm unlink -g qr-source` を実行します。

将来npmへ公開した後は、利用者は `npm install -g qr-source` で同じCLIを導入できます。現時点では未公開のため、開発・検証用途には `npm link` を使用してください。

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

### スマートフォンで撮影して復元する

PCで表示したQRをスマートフォンで撮影し、写真をPC上の1フォルダへコピーして復元できます。撮影順や `IMG_0001.JPG` のようなファイル名は使いません。

```bash
qr-source encode ./my-project --photo-friendly --output ./qr-output
qr-source decode ./photos --output ./restored
```

`--photo-friendly` は既定で500バイトのチャンク、Q訂正、1080px画像、広いQuiet Zoneを使います。明示的なチャンクサイズは600バイトまでです。枚数は増えますが、スマートフォンでの読取りを優先します。撮影時は、QR全体と周囲の余白を入れ、ピント・明るさを確保し、反射・手ブレ・極端な斜め撮影を避けてください。

復元はPNG/JPG/JPEG（拡張子の大文字小文字を問わない）を受け付けます。まず元画像を読み、失敗した画像に限ってグレースケール・コントラスト補正・2倍拡大・90度単位の回転を試します。読めなかった画像は表示しますが、必要なQRがすべて揃っていれば復元を続行します。

### 動画で撮影して復元する

FFmpegをインストールしてPATHへ追加した環境で、QRをブラウザのスライドショーとして表示し、撮影した動画から復元できます。`show` はQR内部のチャンク番号順で表示し、ファイル名は使いません。`--fullscreen` はプレーヤー内の全画面ボタンを表示します。

`decode-video` を実行する**同じ環境**で `ffmpeg` コマンドが見つかる必要があります。PowerShellとWSLは別環境なので、使う側にインストールしてください。

#### Windows PowerShell

PowerShellでWindows版FFmpegを導入して確認します。インストール後に新しいPowerShellを開くとPATHの変更が反映されます。

```powershell
winget install -e --id Gyan.FFmpeg
ffmpeg -version
ffprobe -version
```

そのままWindows側のプロジェクトで実行できます。

```powershell
cd C:\work\my-project
qr-source decode-video .\capture.mp4 --scan-fps 5 --output .\restored
```

#### WSL（Ubuntu / Debian系）

WSL側で実行する場合は、WSLディストリビューション内にFFmpegを導入して確認します。

```bash
sudo apt update
sudo apt install -y ffmpeg
ffmpeg -version
ffprobe -version
```

Windows上の動画やリポジトリへアクセスする例です。パスは環境に合わせて変更してください。

```bash
cd /mnt/c/work/my-project
qr-source decode-video ./capture.mp4 --scan-fps 5 --output ./restored
```

`ffmpeg -version` が見つからない場合は、インストール後に新しいターミナルを開きます。PowerShellで導入したFFmpegがWSLのPATHに自動追加されるわけではありません。

```bash
qr-source encode ./project --video-friendly --output ./qr-output
qr-source show ./qr-output --interval 700 --loop --fullscreen
qr-source decode-video ./capture.mp4 --scan-fps 5 --output ./restored
```

`decode-video` はMP4/MOV/WebM/MKVなど、ローカルのFFmpegが読み込める動画を対象にします。PNGフレームをパイプから順次解析し、同じQRを複数フレームから検出しても1件として扱います。全チャンクが揃うとFFmpegを停止します。動画ではQRが十分大きく入る距離で、カメラを固定し、ピント・反射・手ブレに注意して、1周分が終わるまで撮影してください。

#### 動画E2Eテストと実機検証

`npm test` はFFmpegが利用できる環境では、QR PNG群からMP4を生成し、`decode-video` で復元したバイナリが元ファイルと完全一致することまで確認します。FFmpegがないローカル環境では、この動画テストだけをskipします。GitHub ActionsではFFmpegを導入して必ず実行します。

2026-09-05には、PCのスライドショーをスマートフォンで撮影したHEVC動画（1920×1080、約2.55秒、約5.3MB）でも検証しました。5fpsの解析で3フレームから2/2チャンクを取得し、SHA-256検証後に`examples`配下の4ファイルを復元しました。復元した4ファイルは元ファイルとSHA-256がすべて一致しました。

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
