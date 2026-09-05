import { promises as fs } from "node:fs";
import path from "node:path";
import jsQRImport from "jsqr";
import { PNG } from "pngjs";
import jpeg from "jpeg-js";
type Image = { data: Uint8Array; width: number; height: number };
type Decoder = (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
const decodeImage = (image: Image): string | null => (jsQRImport as unknown as Decoder)(new Uint8ClampedArray(image.data), image.width, image.height)?.data ?? null;
function grayscaleContrast(image: Image): Image {
  const data = new Uint8Array(image.data);
  for (let i = 0; i < data.length; i += 4) { const value = Math.max(0, Math.min(255, (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] - 128) * 1.35 + 128)); data[i] = data[i + 1] = data[i + 2] = value; }
  return { ...image, data };
}
function rotate(image: Image): Image {
  const data = new Uint8Array(image.data.length), width = image.height, height = image.width;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) { const from = (y * image.width + x) * 4, to = (x * width + (width - 1 - y)) * 4; data.set(image.data.subarray(from, from + 4), to); }
  return { data, width, height };
}
function scale2x(image: Image): Image {
  const width = image.width * 2, height = image.height * 2, data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const from = (Math.floor(y / 2) * image.width + Math.floor(x / 2)) * 4, to = (y * width + x) * 4; data.set(image.data.subarray(from, from + 4), to); }
  return { data, width, height };
}
export function readQrBuffer(data: Buffer, ext: string): string {
  let image: Image;
  if (ext === ".png") { const png = PNG.sync.read(data); image = png; } else if (ext === ".jpg" || ext === ".jpeg") image = jpeg.decode(data, { useTArray: true }); else throw new Error("Unsupported image type");
  const direct = decodeImage(image); if (direct) return direct;
  let transformed = grayscaleContrast(image);
  for (let turns = 0; turns < 4; turns++) { const result = decodeImage(transformed) ?? decodeImage(scale2x(transformed)); if (result) return result; transformed = rotate(transformed); }
  throw new Error("No QR code found after photo recovery attempts");
}
export async function readQr(file: string): Promise<string> {
  return readQrBuffer(await fs.readFile(file), path.extname(file).toLowerCase());
}
