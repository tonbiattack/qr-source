import { promises as fs } from "node:fs";
import path from "node:path";
import jsQRImport from "jsqr";
import { PNG } from "pngjs";
import jpeg from "jpeg-js";
export async function readQr(file: string): Promise<string> {
  const data = await fs.readFile(file), ext = path.extname(file).toLowerCase(); let image: { data: Uint8Array; width: number; height: number };
  if (ext === ".png") { const png = PNG.sync.read(data); image = png; } else if (ext === ".jpg" || ext === ".jpeg") image = jpeg.decode(data, { useTArray: true }); else throw new Error("Unsupported image type");
  const jsQR = jsQRImport as unknown as (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
  const decoded = jsQR(new Uint8ClampedArray(image.data), image.width, image.height); if (!decoded) throw new Error("No QR code found"); return decoded.data;
}
