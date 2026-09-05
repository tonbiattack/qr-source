import QRCode from "qrcode";
export interface QrWriteOptions { correction: "L" | "M" | "Q" | "H"; photoFriendly?: boolean; }
export async function writeQr(text: string, output: string, options: QrWriteOptions): Promise<void> {
  await QRCode.toFile(output, text, { errorCorrectionLevel: options.correction, margin: options.photoFriendly ? 4 : 2, width: options.photoFriendly ? 1024 : 1000 });
}
