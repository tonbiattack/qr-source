import { promises as fs } from "node:fs";
import path from "node:path";
import { unpack } from "../archive/unpack.js";
import { sha256 } from "../checksum/sha256.js";
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
  const groups = new Map<string, QrChunk[]>(); for (const chunk of chunks) groups.set(chunk.projectId, [...(groups.get(chunk.projectId) ?? []), chunk]); if (groups.size !== 1) throw new Error(`Multiple projects detected.\n\n${[...groups].map(([id, cs]) => `Project ${id}: ${cs.length} QR codes`).join("\n")}`);
  const project = [...groups.values()][0]!; const first = project[0]; if (project.some(c => c.totalChunks !== first.totalChunks || c.checksum !== first.checksum)) throw new Error("Inconsistent metadata among QR chunks");
  const indexed = new Map<number, QrChunk>(); for (const chunk of project) { const old = indexed.get(chunk.chunkIndex); if (old && old.payload !== chunk.payload) throw new Error(`Conflicting duplicate QR chunk: ${chunk.chunkIndex}`); indexed.set(chunk.chunkIndex, chunk); }
  const missing = Array.from({ length: first.totalChunks }, (_, i) => i).filter(i => !indexed.has(i)); if (missing.length) throw new Error(`QR chunks are missing.\n\nExpected: ${first.totalChunks}\nFound: ${indexed.size}\n\nMissing:\n${missing.map(i => `- chunk ${i}`).join("\n")}`);
  const data = Buffer.concat(Array.from({ length: first.totalChunks }, (_, i) => Buffer.from(indexed.get(i)!.payload, "base64"))); if (sha256(data) !== first.checksum) throw new Error("checksum verification failed");
  console.log(`\nProject ID:\n${first.projectId}\n\nChunks:\n${indexed.size} / ${first.totalChunks}\n\nChecksum: OK\n\nRestoring files...\n`); const count = await unpack(data, output, Boolean(options.force)); console.log(`${count} files restored.\n\nDone.`);
}
