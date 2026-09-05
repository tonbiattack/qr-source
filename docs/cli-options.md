# CLIオプション一覧

通常は、READMEの最小コマンドだけで使えます。このページは既定値を変えたい場合の参照用です。

## `encode <input>`

ファイルまたはディレクトリをQR PNG群へ変換します。出力先の既定値は`qr-output`です。

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `-o, --output <directory>` | `qr-output` | QR PNGと`manifest.json`の出力先 |
| `--chunk-size <bytes>` | `500` | 1枚に入れる圧縮データ量。堅牢プロファイルでは100〜600 |
| `--exclude <name>` | なし | 指定名のファイル・ディレクトリを除外。複数指定可能 |
| `--error-correction <L\|M\|Q\|H>` | `Q` | QR訂正レベル |
| `--normal` | なし | 800B、M訂正、1000pxへ切替。QR枚数を減らしたい場合向け |
| `--photo-friendly` | なし | 堅牢プロファイルの互換エイリアス |
| `--video-friendly` | なし | 堅牢プロファイルの互換エイリアス |
| `--force` | なし | 空でない出力先への生成を許可 |

既定の堅牢プロファイルは500B、Q訂正、1080px、広いQuiet Zoneです。`--normal`と`--photo-friendly`または`--video-friendly`は併用できません。

## `decode <qr-directory>`

PNG/JPG/JPEGのQR画像フォルダから復元します。出力先の既定値は`restored`です。

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `-o, --output <directory>` | `restored` | 復元先 |
| `--force` | なし | 復元先にある同名ファイルの上書きを許可 |

画像のファイル名・配置順は使いません。同じQRの重複は無視し、異なるプロジェクトや不足チャンクはエラーにします。

## `show <qr-directory>`

QRをブラウザで順番に表示します。チャンク番号順に並べ、既定で最後から先頭へループします。

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `--interval <ms>` | `2000` | 1枚あたりの表示時間。最小300ms |
| `--gap <ms>` | `0` | QRの間に入れる黒画面の時間 |
| `--no-loop` | なし | 最後のQRで停止 |
| `--fullscreen` | なし | 通常プレーヤーに全画面ボタンを表示 |
| `--recording-mode` | なし | 操作UIを隠してQRを最大化し、開始操作で全画面再生 |
| `--chunks <indexes>` | なし | 表示する0始まりのチャンク番号をカンマ区切りで指定 |

既定ではコントローラーを表示します。**First**は1枚目へ戻して停止、**Previous**と**Next**は手動移動、**Pause / Resume**は自動切替を停止・再開します。キーボードの`←`、`→`、Spaceも使えます。

## `decode-video <video>`

FFmpegで動画からフレームを取り出し、QRを復元します。出力先の既定値は`restored`です。

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `-o, --output <directory>` | `restored` | 復元先 |
| `--scan-fps <number>` | `5` | 解析するフレームレート。0より大きく30以下 |
| `--force` | なし | 復元先にある同名ファイルの上書きを許可 |

MP4/MOV/WebM/MKVなど、ローカルのFFmpegが読める形式を対象にします。全チャンクが揃うと解析を停止します。
