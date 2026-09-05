#!/usr/bin/env node
import { Command } from "commander";
import { encode } from "./cli/encode.js";
import { decode } from "./cli/decode.js";
const app = new Command().name("qr-source").description("Encode files into offline QR image sets and restore them").version("0.1.0");
app.command("encode <input>").option("-o, --output <directory>", "output directory").option("--chunk-size <bytes>", "raw payload bytes per QR", "800").option("--exclude <pattern>", "exclude entry name", (value, all: string[]) => [...all, value], []).option("--error-correction <level>", "L, M, Q, or H", "M").option("--force", "allow a non-empty output directory").action(async (input, options) => encode(input, options));
app.command("decode <qr-directory>").option("-o, --output <directory>", "restoration directory").option("--force", "overwrite restored files").action(async (directory, options) => decode(directory, options));
app.parseAsync().catch((error: Error) => { console.error(`Error: ${error.message}`); process.exitCode = 1; });
