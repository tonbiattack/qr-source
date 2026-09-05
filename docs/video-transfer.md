# 動画撮影による転送

FFmpegが使える環境では、QRをブラウザでスライド表示し、スマートフォン等で撮影した動画から復元できます。

```bash
qr-source encode ./project --video-friendly --output ./qr-output
qr-source show ./qr-output --interval 700 --loop --fullscreen
qr-source decode-video ./capture.mp4 --scan-fps 5 --output ./restored
```

`show`はQR内部のチャンク番号順に表示します。プレーヤーには**First**（1枚目へ戻して停止）、**Previous**、**Pause / Resume**、**Next**の操作ボタンがあります。キーボードの`←`/`→`とSpaceでも同じ操作ができます。`--fullscreen`ではプレーヤー内の全画面ボタンを表示します。動画ではQRが大きく写る距離でカメラを固定し、ピント、反射、手ブレに注意して1周分が終わるまで撮影してください。

`decode-video`は、FFmpegが読み込めるMP4/MOV/WebM/MKVなどを対象にします。5fpsを既定としてPNGフレームを順次解析し、重複QRを除外します。全チャンクが揃った時点で解析を停止します。

## FFmpegセットアップ

`decode-video`を実行する同じ環境で`ffmpeg`と`ffprobe`がPATHから見つかる必要があります。PowerShellとWSLは別環境なので、使う側へ導入してください。

### Windows PowerShell

```powershell
winget install -e --id Gyan.FFmpeg
ffmpeg -version
ffprobe -version

cd C:\work\my-project
qr-source decode-video .\capture.mp4 --scan-fps 5 --output .\restored
```

インストール後は新しいPowerShellを開くとPATH変更が反映されます。

### WSL（Ubuntu / Debian系）

```bash
sudo apt update
sudo apt install -y ffmpeg
ffmpeg -version
ffprobe -version

cd /mnt/c/work/my-project
qr-source decode-video ./capture.mp4 --scan-fps 5 --output ./restored
```

PowerShell側のFFmpegは、WSLのPATHへ自動追加されません。

## 実機検証

2026-09-05に、PCスライドショーをスマートフォンで撮影したHEVC動画（1920×1080、約2.55秒、約5.3MB）で検証しました。5fps・3フレームで2/2チャンクを取得し、SHA-256検証後に`examples`配下の4ファイルを復元しました。復元ファイルと元ファイルのSHA-256はすべて一致しました。
