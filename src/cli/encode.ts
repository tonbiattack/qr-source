import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pack } from "../archive/pack.js";
import { sha256 } from "../checksum/sha256.js";
import { FORMAT_VERSION, type Manifest, type QrChunk } from "../metadata/schema.js";
import { writeQr } from "../qr/encode.js";
export interface EncodeOptions { output?: string; chunkSize?: string; exclude: string[]; errorCorrection?: string; photoFriendly?: boolean; videoFriendly?: boolean; force?: boolean; }
const bytes = (n: number) => n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
export async function encode(input: string, options: EncodeOptions): Promise<void> {
  const output = path.resolve(options.output ?? "qr-output"), entries = await fs.readdir(output).catch(() => []);
  if (entries.length && !options.force) throw new Error("output directory already contains files (use --force to overwrite)");
  const friendly = options.photoFriendly || options.videoFriendly; if (options.photoFriendly && options.videoFriendly) throw new Error("Use either --photo-friendly or --video-friendly, not both"); const chunkSize = Number(options.chunkSize ?? (friendly ? "500" : "800")); const maxChunkSize = friendly ? 600 : 1200; if (!Number.isInteger(chunkSize) || chunkSize < 100 || chunkSize > maxChunkSize) throw new Error(`--chunk-size must be an integer from 100 to ${maxChunkSize} bytes${friendly ? " in friendly mode" : ""}`);
  const level = (options.errorCorrection ?? (friendly ? "Q" : "M")).toUpperCase(); if (!(["L", "M", "Q", "H"] as string[]).includes(level)) throw new Error("--error-correction must be L, M, Q, or H");
  console.log("Scanning files...\n"); const packed = await pack(path.resolve(input), options.exclude); if (!packed.fileCount) throw new Error("No files found to encode");
  const checksum = sha256(packed.data), projectId = randomUUID(), chunks: Buffer[] = [];
  for (let start = 0; start < packed.data.length; start += chunkSize) chunks.push(packed.data.subarray(start, start + chunkSize));
  console.log(`Files:           ${packed.fileCount}\nOriginal size:   ${bytes(packed.originalSize)}\nCompressed size: ${bytes(packed.data.length)}\nChunks:          ${chunks.length}\n`);
  if (chunks.length >= (friendly ? 50 : 100)) console.warn(`Warning: This operation will generate ${chunks.length} QR codes.${friendly ? " Smartphone transfer may be impractical." : ""}`);
  await fs.mkdir(output, { recursive: true }); console.log("Generating QR codes...\n");
  if (friendly) console.log(`${options.videoFriendly ? "Video" : "Photo"}-friendly mode: 500-byte default chunks, Q correction, 1080px images, and a wide quiet zone.\n`);
  for (const [index, chunk] of chunks.entries()) { const record: QrChunk = { version: FORMAT_VERSION, projectId, chunkIndex: index, totalChunks: chunks.length, checksum, payload: chunk.toString("base64") }; const name = `qr-${String(index + 1).padStart(4, "0")}.png`; await writeQr(JSON.stringify(record), path.join(output, name), { correction: level as "L" | "M" | "Q" | "H", photoFriendly: friendly }); console.log(`[${index + 1}/${chunks.length}] ${name}`); }
  const manifest: Manifest = { version: FORMAT_VERSION, projectId, createdAt: new Date().toISOString(), totalChunks: chunks.length, checksum, sourceName: packed.sourceName };
  await fs.writeFile(path.join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n"); console.log("\nDone.");
}
