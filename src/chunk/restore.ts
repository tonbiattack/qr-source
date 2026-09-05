import { unpack } from "../archive/unpack.js";
import { sha256 } from "../checksum/sha256.js";
import type { QrChunk } from "../metadata/schema.js";

export interface RestoredChunks { projectId: string; totalChunks: number; fileCount: number; }
export async function restoreChunks(chunks: QrChunk[], output: string, force: boolean): Promise<RestoredChunks> {
  if (!chunks.length) throw new Error("No valid QR chunks found");
  const groups = new Map<string, QrChunk[]>(); for (const chunk of chunks) groups.set(chunk.projectId, [...(groups.get(chunk.projectId) ?? []), chunk]);
  if (groups.size !== 1) throw new Error(`Multiple projects detected.\n\n${[...groups].map(([id, cs]) => `Project ${id}: ${cs.length} QR codes`).join("\n")}`);
  const project = [...groups.values()][0]!, first = project[0];
  if (project.some(c => c.totalChunks !== first.totalChunks || c.checksum !== first.checksum)) throw new Error("Inconsistent metadata among QR chunks");
  const indexed = new Map<number, QrChunk>(); for (const chunk of project) { const old = indexed.get(chunk.chunkIndex); if (old && old.payload !== chunk.payload) throw new Error(`Conflicting duplicate QR chunk: ${chunk.chunkIndex}`); indexed.set(chunk.chunkIndex, chunk); }
  const missing = Array.from({ length: first.totalChunks }, (_, i) => i).filter(i => !indexed.has(i));
  if (missing.length) throw new Error(`QR chunks are missing.\n\nExpected: ${first.totalChunks}\nFound: ${indexed.size}\n\nMissing:\n${missing.map(i => `- chunk ${i}`).join("\n")}`);
  const data = Buffer.concat(Array.from({ length: first.totalChunks }, (_, i) => Buffer.from(indexed.get(i)!.payload, "base64")));
  if (sha256(data) !== first.checksum) throw new Error("checksum verification failed");
  const fileCount = await unpack(data, output, force); return { projectId: first.projectId, totalChunks: first.totalChunks, fileCount };
}
