import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseChunk } from "../metadata/schema.js";
import { readQr } from "../qr/decode.js";
export interface ShowOptions { interval?: string; gap?: string; loop?: boolean; fullscreen?: boolean; chunks?: string; }
export async function show(directory: string, options: ShowOptions): Promise<void> {
  const interval = Number(options.interval ?? "700"), gap = Number(options.gap ?? "0"); if (!Number.isInteger(interval) || interval < 300) throw new Error("--interval must be an integer of at least 300 ms"); if (!Number.isInteger(gap) || gap < 0) throw new Error("--gap must be a non-negative integer");
  const files = (await fs.readdir(directory, { withFileTypes: true })).filter(e => e.isFile() && [".png", ".jpg", ".jpeg"].includes(path.extname(e.name).toLowerCase())).map(e => e.name);
  const records = await Promise.all(files.map(async file => ({ file, chunk: parseChunk(await readQr(path.join(directory, file))) }))); const projectIds = new Set(records.map(r => r.chunk.projectId)); if (projectIds.size !== 1) throw new Error("Multiple projects detected in slideshow source");
  const requested = options.chunks ? new Set(options.chunks.split(",").map(value => Number(value.trim()))) : undefined; const slides = records.filter(r => !requested || requested.has(r.chunk.chunkIndex)).sort((a, b) => a.chunk.chunkIndex - b.chunk.chunkIndex); if (!slides.length) throw new Error("No matching QR images found");
  const images = await Promise.all(slides.map(async ({ file, chunk }) => ({ src: `data:image/${path.extname(file).slice(1).toLowerCase() === "png" ? "png" : "jpeg"};base64,${(await fs.readFile(path.join(directory, file))).toString("base64")}`, index: chunk.chunkIndex + 1, total: chunk.totalChunks })));
  const fullscreenButton = options.fullscreen ? `<button id="fullscreen">Enter fullscreen</button>` : "";
  const html = `<!doctype html><meta charset="utf-8"><title>qr-source slideshow</title><style>html,body{margin:0;background:#000;color:#fff;height:100%;font:20px system-ui}main{height:100%;display:grid;grid-template-rows:1fr auto;place-items:center}img{max-width:88vw;max-height:84vh;image-rendering:auto;background:#fff;padding:28px}.info{padding:16px;text-align:center}.hint{font-size:13px;color:#bbb}button{margin-left:12px;padding:5px 10px}</style><main><img id="qr"><div class="info"><span id="count"></span><div class="hint">Esc exits fullscreen ${fullscreenButton}</div></div></main><script>const slides=${JSON.stringify(images)},interval=${interval},gap=${gap},loop=${Boolean(options.loop)};let i=0;const img=document.querySelector('#qr'),count=document.querySelector('#count');document.querySelector('#fullscreen')?.addEventListener('click',()=>document.documentElement.requestFullscreen());function next(){if(i>=slides.length){if(!loop)return;i=0}const s=slides[i++];img.src=s.src;count.textContent=s.index+' / '+s.total;if(gap)setTimeout(()=>{img.style.visibility='hidden';setTimeout(()=>{img.style.visibility='visible';next()},gap)},interval);else setTimeout(next,interval)}next();</script>`;
  const output = path.join(os.tmpdir(), `qr-source-show-${randomUUID()}.html`); await fs.writeFile(output, html); console.log(`Opening ${slides.length} QR slides every ${interval} ms.${options.fullscreen ? " Click Enter fullscreen in the opened player." : ""}`);
  if (process.platform === "win32") execFile("cmd", ["/c", "start", "", output]); else if (process.platform === "darwin") execFile("open", [output]); else execFile("xdg-open", [output]);
}
