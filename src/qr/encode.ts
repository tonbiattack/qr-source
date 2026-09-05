import QRCode from "qrcode";
export interface QrWriteOptions { correction: "L" | "M" | "Q" | "H"; photoFriendly?: boolean; }
export async function writeQr(text: string, output: string, options: QrWriteOptions): Promise<void> {
  // 1024 is not divisible by the module grid of some high-density Q codes.
  // 1080 avoids the rounding artefacts that make jsQR reject otherwise valid PNGs.
  await QRCode.toFile(output, text, { errorCorrectionLevel: options.correction, margin: options.photoFriendly ? 4 : 2, width: options.photoFriendly ? 1080 : 1000 });
}
