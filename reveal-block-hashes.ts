import * as Log from "./log";

Log.info("starting block hash scan");

const readAndParseGzippedJson = async (file: BunFile) => {
  const decoder = new TextDecoder();

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Use Bun's gunzipSync to decompress
  const decompressed = Bun.gunzipSync(uint8Array);
  const decoded = decoder.decode(decompressed);
  const parsed = JSON.parse(decoded);
  return parsed;
};

import { readdir } from "node:fs/promises";
import { BunFile } from "bun";

const paths = await readdir("./submissions-7454864");

for (const path of paths) {
  const bunFile = Bun.file(`./submissions-7454864/${path}`);
  const parsedObj = await readAndParseGzippedJson(bunFile);
  console.log(parsedObj.payload.execution_payload.block_hash);
}
