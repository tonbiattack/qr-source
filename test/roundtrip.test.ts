import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { encode } from "../src/cli/encode.js";
import { decode } from "../src/cli/decode.js";
import { writeQr } from "../src/qr/encode.js";
import { readQr } from "../src/qr/decode.js";
import { PNG } from "pngjs";
import jpeg from "jpeg-js";
import { randomBytes } from "node:crypto";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { decodeVideo } from "../src/cli/decode-video.js";
import { buildSlideshowHtml, resolveShowOptions } from "../src/cli/show.js";
let root: string;
const exec = promisify(execFile);
const hasFfmpeg = (() => { try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); return true; } catch { return false; } })();
afterEach(async () => { if (root) await fs.rm(root, { recursive: true, force: true }); });
describe("QR round trip", () => {
  it("restores nested text and binary files after QR files are renamed", async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "qr-source-")); const input = path.join(root, "input"), qr = path.join(root, "qr"), restored = path.join(root, "restored");
    await fs.mkdir(path.join(input, "src", "util"), { recursive: true }); await fs.writeFile(path.join(input, "README.md"), "QR round trip\n"); await fs.writeFile(path.join(input, "src", "util", "bytes.bin"), Buffer.from([0, 255, 7, 42, 128]));
    await encode(input, { output: qr, chunkSize: "100", exclude: [], errorCorrection: "M" });
    const qrFiles = (await fs.readdir(qr)).filter(x => x.endsWith(".png")); await Promise.all(qrFiles.map((name, i) => fs.rename(path.join(qr, name), path.join(qr, `renamed-${qrFiles.length - i}.png`))));
    await fs.copyFile(path.join(qr, "renamed-1.png"), path.join(qr, "IMG_DUPLICATE.JPG")); await fs.writeFile(path.join(qr, "IMG_NOT_A_QR.JPG"), "ordinary photo placeholder");
    await decode(qr, { output: restored }); expect(await fs.readFile(path.join(restored, "README.md"), "utf8")).toBe("QR round trip\n"); expect(await fs.readFile(path.join(restored, "src", "util", "bytes.bin"))).toEqual(Buffer.from([0, 255, 7, 42, 128]));
  });
});

describe("photo image recovery", () => {
  it("reads a rotated JPEG QR image", async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "qr-source-photo-")); const pngPath = path.join(root, "source.png"), jpegPath = path.join(root, "IMG_1001.JPG"), text = "photo-compatible QR payload";
    await writeQr(text, pngPath, { correction: "Q", photoFriendly: true }); const image = PNG.sync.read(await fs.readFile(pngPath)); const width = image.height, height = image.width, data = Buffer.alloc(image.data.length);
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) { const from = (y * image.width + x) * 4, to = (x * width + (width - 1 - y)) * 4; image.data.copy(data, to, from, from + 4); }
    await fs.writeFile(jpegPath, jpeg.encode({ data, width, height }, 75).data); expect(await readQr(jpegPath)).toBe(text);
  });
});

describe("robust default QR output", () => {
  it("uses a 500-byte QR profile and round trips an incompressible payload", async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "qr-source-friendly-")); const input = path.join(root, "input"), qr = path.join(root, "qr"), restored = path.join(root, "restored");
    const payload = randomBytes(750); await fs.mkdir(input); await fs.writeFile(path.join(input, "payload.bin"), payload);
    await encode(input, { output: qr, exclude: [] }); expect(PNG.sync.read(await fs.readFile(path.join(qr, "qr-0001.png"))).width).toBe(1080); await decode(qr, { output: restored });
    expect(await fs.readFile(path.join(restored, "payload.bin"))).toEqual(payload);
  });
});

describe("video round trip", () => {
  const videoIt = hasFfmpeg ? it : it.skip;
  videoIt("restores files from an MP4 generated from QR frames", async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "qr-source-video-")); const input = path.join(root, "input"), qr = path.join(root, "qr"), video = path.join(root, "capture.mp4"), restored = path.join(root, "restored");
    const payload = randomBytes(750); await fs.mkdir(input); await fs.writeFile(path.join(input, "payload.bin"), payload);
    await encode(input, { output: qr, exclude: [], videoFriendly: true });
    await exec("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "2", "-i", path.join(qr, "qr-%04d.png"), "-c:v", "mpeg4", "-q:v", "2", "-pix_fmt", "yuv420p", video]);
    await decodeVideo(video, { output: restored, scanFps: "5" }); expect(await fs.readFile(path.join(restored, "payload.bin"))).toEqual(payload);
  });
});

describe("slideshow controls", () => {
  it("uses visible controls, looping, and 1500ms as the show defaults", () => {
    expect(resolveShowOptions({})).toMatchObject({ interval: 1500, gap: 0, loop: true, recordingMode: false });
    expect(resolveShowOptions({ loop: false, recordingMode: true })).toMatchObject({ loop: false, recordingMode: true });
  });

  it("renders pause, restart, previous, next, and keyboard controls", () => {
    const html = buildSlideshowHtml([{ src: "data:image/png;base64,test", index: 1, total: 2 }], 700, 0, true, true);
    expect(html).toContain('id="restart"'); expect(html).toContain("function restart(){clear();i=0;paused=true;render()}"); expect(html).toContain('id="previous"'); expect(html).toContain('id="pause"'); expect(html).toContain('id="next"'); expect(html).toContain("ArrowLeft"); expect(html).toContain("ArrowRight"); expect(html).toContain("Space"); expect(html).toContain('id="fullscreen"');
  });

  it("starts recording mode paused behind a fullscreen start confirmation", () => {
    const html = buildSlideshowHtml([{ src: "data:image/png;base64,test", index: 1, total: 2 }], 1500, 0, true, false, true);
    expect(html).toContain('id="start-recording"'); expect(html).toContain("Start recording"); expect(html).toContain("recordingMode=true"); expect(html).toContain("paused=recordingMode"); expect(html).toContain("requestFullscreen"); expect(html).toContain(".recording .info{display:none}"); expect(html).toContain("max-width:96vw");
  });
});
