import QRCode from "qrcode";
export async function writeQr(text: string, output: string, correction: "L" | "M" | "Q" | "H"): Promise<void> { await QRCode.toFile(output, text, { errorCorrectionLevel: correction, margin: 2, width: 1000 }); }
