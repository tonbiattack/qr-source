import { promises as fs } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import type { PackedFile } from "./pack.js";
function safePath(output: string, relative: string): string {
  if (!relative || path.isAbsolute(relative) || /^[a-zA-Z]:/.test(relative)) throw new Error(`Unsafe archive path: ${relative}`);
  const resolved = path.resolve(output, relative), base = path.resolve(output) + path.sep;
  if (!resolved.startsWith(base)) throw new Error(`Unsafe archive path: ${relative}`); return resolved;
}
export async function unpack(data: Buffer, output: string, force: boolean): Promise<number> {
  let archive: { version: number; files: PackedFile[] }; try { archive = JSON.parse(gunzipSync(data).toString("utf8")); } catch { throw new Error("Archive could not be decompressed or parsed"); }
  if (archive.version !== 1 || !Array.isArray(archive.files)) throw new Error("Unsupported archive format");
  const targets = archive.files.map(file => ({ file, target: safePath(output, file.path) }));
  for (const { target } of targets) if (!force && await fs.stat(target).then(() => true).catch(() => false)) throw new Error("output directory already contains files (use --force to overwrite)");
  for (const { file, target } of targets) { await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, Buffer.from(file.data, "base64")); }
  return targets.length;
}
