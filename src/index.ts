#!/usr/bin/env node
import { Command } from "commander";
import { encode } from "./cli/encode.js";
import { decode } from "./cli/decode.js";
import { decodeVideo } from "./cli/decode-video.js";
import { show } from "./cli/show.js";
const app = new Command().name("qr-source").description("Encode files into offline QR image sets and restore them").version("0.1.0");
app.command("encode <input>").option("-o, --output <directory>", "output directory").option("--chunk-size <bytes>", "raw payload bytes per QR").option("--exclude <pattern>", "exclude entry name", (value, all: string[]) => [...all, value], []).option("--error-correction <level>", "L, M, Q, or H").option("--photo-friendly", "compatibility alias for the robust default").option("--video-friendly", "compatibility alias for the robust default").option("--normal", "use 800B/M/1000px instead of the robust default").option("--force", "allow a non-empty output directory").action(async (input, options) => encode(input, options));
app.command("decode <qr-directory>").option("-o, --output <directory>", "restoration directory").option("--force", "overwrite restored files").action(async (directory, options) => decode(directory, options));
app.command("show <qr-directory>").option("--interval <ms>", "milliseconds per QR", "1500").option("--gap <ms>", "black-screen gap between QR images", "0").option("--no-loop", "stop after the final slide").option("--fullscreen", "show fullscreen hint in the player").option("--no-recording-mode", "show player controls instead of the recording screen").option("--chunks <indexes>", "comma-separated zero-based chunk indexes").action(async (directory, options) => show(directory, options));
app.command("decode-video <video>").option("-o, --output <directory>", "restoration directory").option("--scan-fps <number>", "frames to scan per second", "5").option("--force", "overwrite restored files").action(async (video, options) => decodeVideo(video, options));
app.parseAsync().catch((error: Error) => { console.error(`Error: ${error.message}`); process.exitCode = 1; });
