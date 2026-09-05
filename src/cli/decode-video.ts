import { spawn } from "node:child_process";
import { parseChunk, type QrChunk } from "../metadata/schema.js";
import { readQrBuffer } from "../qr/decode.js";
import { restoreChunks } from "../chunk/restore.js";

const PNG_END = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
export interface DecodeVideoOptions { output?: string; scanFps?: string; force?: boolean; }
export async function decodeVideo(video: string, options: DecodeVideoOptions): Promise<void> {
  const fps = Number(options.scanFps ?? "5"); if (!Number.isFinite(fps) || fps <= 0 || fps > 30) throw new Error("--scan-fps must be a number from 0 to 30");
  console.log(`Scanning video...\n\nScan rate: ${fps} fps\n`);
  const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", video, "-vf", `fps=${fps}`, "-f", "image2pipe", "-vcodec", "png", "pipe:1"], { stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "", pending = Buffer.alloc(0), frames = 0, complete = false; const chunks: QrChunk[] = [], seen = new Map<number, QrChunk>();
  child.stderr.on("data", data => { stderr += data.toString(); });
  try {
    for await (const data of child.stdout) {
      pending = Buffer.concat([pending, data as Buffer]);
      while (true) {
        const end = pending.indexOf(PNG_END); if (end < 0) break; const image = pending.subarray(0, end + PNG_END.length); pending = pending.subarray(end + PNG_END.length); frames++;
        try { const chunk = parseChunk(readQrBuffer(image, ".png")); const existing = seen.get(chunk.chunkIndex); if (existing && existing.payload !== chunk.payload) throw new Error(`Conflicting duplicate QR chunk: ${chunk.chunkIndex}`); if (!existing) { seen.set(chunk.chunkIndex, chunk); chunks.push(chunk); console.log(`Found chunk ${chunk.chunkIndex + 1} / ${chunk.totalChunks}`); if (seen.size === chunk.totalChunks) { complete = true; child.kill(); break; } } } catch (error) { if (error instanceof Error && error.message.startsWith("Conflicting")) throw error; }
      }
      if (complete) break;
    }
  } finally { if (!child.killed) child.kill(); }
  await new Promise<void>(resolve => child.once("close", () => resolve()));
  if (!chunks.length) throw new Error(`No valid QR chunks found in video.${stderr ? ` FFmpeg: ${stderr.trim()}` : ""}`);
  const first = chunks[0], unique = seen.size; console.log(`\nVideo scan complete.\n\nFrames scanned: ${frames}\nProject ID:\n${first.projectId}\n\nChunks:\n${unique} / ${first.totalChunks}`);
  try { const result = await restoreChunks(chunks, options.output ?? "restored", Boolean(options.force)); console.log(`\nChecksum: OK\n\nRestoring files...\n\n${result.fileCount} files restored.\n\nDone.`); } catch (error) { console.log("\nUnable to restore."); throw error; }
}
