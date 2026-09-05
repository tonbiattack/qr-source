import { promises as fs } from "node:fs";
import path from "node:path";
import { restoreChunks } from "../chunk/restore.js";
import { parseChunk, type QrChunk } from "../metadata/schema.js";
import { readQr } from "../qr/decode.js";
export interface DecodeOptions { output?: string; force?: boolean; }
export async function decode(directory: string, options: DecodeOptions): Promise<void> {
  const source = path.resolve(directory), output = path.resolve(options.output ?? "restored");
  const files = (await fs.readdir(source, { withFileTypes: true })).filter(e => e.isFile() && [".png", ".jpg", ".jpeg"].includes(path.extname(e.name).toLowerCase())).map(e => e.name);
  if (!files.length) throw new Error("No PNG, JPG, or JPEG images found"); console.log("Scanning QR images...\n");
  const chunks: QrChunk[] = [], failed: string[] = [];
  for (const name of files) try { chunks.push(parseChunk(await readQr(path.join(source, name)))); } catch { failed.push(name); }
  console.log(`Images: ${files.length}\nValid:  ${chunks.length}`); if (failed.length) console.log(`\nFailed to read QR:\n\n${failed.map(f => `- ${f}`).join("\n")}`); if (!chunks.length) throw new Error("No valid QR chunks found");
  const unique = new Set(chunks.map(c => c.chunkIndex)).size, first = chunks[0]; console.log(`\nProject ID:\n${first.projectId}\n\nChunks:\n${unique} / ${first.totalChunks}\n\nChecksum: OK\n\nRestoring files...\n`); const result = await restoreChunks(chunks, output, Boolean(options.force)); console.log(`${result.fileCount} files restored.\n\nDone.`);
}
