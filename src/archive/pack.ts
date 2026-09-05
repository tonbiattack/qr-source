import { promises as fs } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
export interface PackedFile { path: string; data: string; }
const DEFAULT_EXCLUDES = new Set([".git", "node_modules", "dist", "build", "coverage", ".DS_Store"]);
async function walk(root: string, current: string, excludes: Set<string>, files: PackedFile[]): Promise<void> {
  for (const entry of await fs.readdir(current, { withFileTypes: true })) {
    if (excludes.has(entry.name)) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) await walk(root, absolute, excludes, files);
    else if (entry.isFile()) files.push({ path: path.relative(root, absolute).split(path.sep).join("/"), data: (await fs.readFile(absolute)).toString("base64") });
  }
}
export async function pack(input: string, additionalExcludes: string[]) {
  const stat = await fs.stat(input), root = stat.isDirectory() ? input : path.dirname(input), files: PackedFile[] = [], excludes = new Set([...DEFAULT_EXCLUDES, ...additionalExcludes]);
  if (stat.isDirectory()) await walk(root, root, excludes, files); else files.push({ path: path.basename(input), data: (await fs.readFile(input)).toString("base64") });
  const originalSize = files.reduce((sum, f) => sum + Buffer.from(f.data, "base64").length, 0);
  return { data: gzipSync(Buffer.from(JSON.stringify({ version: 1, files }))), fileCount: files.length, originalSize, sourceName: path.basename(path.resolve(input)) };
}
