export const FORMAT_VERSION = 1;
export interface QrChunk { version: number; projectId: string; chunkIndex: number; totalChunks: number; checksum: string; payload: string; }
export interface Manifest { version: number; projectId: string; createdAt: string; totalChunks: number; checksum: string; sourceName: string; }
export function parseChunk(value: string): QrChunk {
  let chunk: unknown; try { chunk = JSON.parse(value); } catch { throw new Error("QR payload is not valid JSON"); }
  if (!chunk || typeof chunk !== "object") throw new Error("QR payload is not an object"); const c = chunk as Record<string, unknown>;
  if (c.version !== FORMAT_VERSION || typeof c.projectId !== "string" || !Number.isInteger(c.chunkIndex) || !Number.isInteger(c.totalChunks) || typeof c.checksum !== "string" || typeof c.payload !== "string" || (c.chunkIndex as number) < 0 || (c.totalChunks as number) < 1 || (c.chunkIndex as number) >= (c.totalChunks as number)) throw new Error("QR metadata has an unsupported or invalid shape");
  return c as unknown as QrChunk;
}
