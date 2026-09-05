import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "../src/cli/encode.js";
import { decode } from "../src/cli/decode.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "examples", "sample-project");
const run = path.join(root, "test-tmp", "demo");
const qr = path.join(run, "qr-images");
const restored = path.join(run, "restored");

async function fileMap(directory: string, prefix = ""): Promise<Map<string, Buffer>> {
  const result = new Map<string, Buffer>();
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name), absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) for (const [key, value] of await fileMap(absolute, relative)) result.set(key, value);
    else if (entry.isFile()) result.set(relative, await fs.readFile(absolute));
  }
  return result;
}

await fs.rm(run, { recursive: true, force: true });
await encode(fixture, { output: qr, chunkSize: "800", exclude: [], errorCorrection: "M" });
await decode(qr, { output: restored });
const original = await fileMap(fixture), recovered = await fileMap(restored);
if (original.size !== recovered.size || [...original].some(([name, data]) => !recovered.get(name)?.equals(data))) throw new Error("Restored files differ from the sample project");
console.log(`\nDemo passed: ${original.size} files match exactly.`);
console.log(`QR images: ${qr}`);
console.log(`Restored:  ${restored}`);
