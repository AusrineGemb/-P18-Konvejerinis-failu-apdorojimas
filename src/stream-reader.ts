import * as fs from "node:fs";
import { createRequire } from "node:module";
import type { Product } from "./transform.ts";

const require = createRequire(import.meta.url);

const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray.js");

export async function* readProductBatches(
  filePath: string,
  batchSize: number
): AsyncGenerator<Product[]> {

  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error("Neteisingas partijos dydis");
  }

  const stream = fs
    .createReadStream(filePath)
    .pipe(parser())
    .pipe(streamArray());

  let batch: Product[] = [];

  for await (const item of stream) {
    batch.push(item.value as Product);

    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  }

  if (batch.length > 0) {
    yield batch;
  }
}
