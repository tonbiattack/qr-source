import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { encode } from "../src/cli/encode.js";
import { decode } from "../src/cli/decode.js";
let root: string;
afterEach(async () => { if (root) await fs.rm(root, { recursive: true, force: true }); });
describe("QR round trip", () => {
  it("restores nested text and binary files after QR files are renamed", async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "qr-source-")); const input = path.join(root, "input"), qr = path.join(root, "qr"), restored = path.join(root, "restored");
    await fs.mkdir(path.join(input, "src", "util"), { recursive: true }); await fs.writeFile(path.join(input, "README.md"), "QR round trip\n"); await fs.writeFile(path.join(input, "src", "util", "bytes.bin"), Buffer.from([0, 255, 7, 42, 128]));
    await encode(input, { output: qr, chunkSize: "100", exclude: [], errorCorrection: "M" });
    const qrFiles = (await fs.readdir(qr)).filter(x => x.endsWith(".png")); await Promise.all(qrFiles.map((name, i) => fs.rename(path.join(qr, name), path.join(qr, `renamed-${qrFiles.length - i}.png`))));
    await decode(qr, { output: restored }); expect(await fs.readFile(path.join(restored, "README.md"), "utf8")).toBe("QR round trip\n"); expect(await fs.readFile(path.join(restored, "src", "util", "bytes.bin"))).toEqual(Buffer.from([0, 255, 7, 42, 128]));
  });
});
