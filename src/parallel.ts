
import * as fs from "node:fs";
import { once } from "node:events";
import { Worker } from "node:worker_threads";
import { performance } from "node:perf_hooks";

import { BoundedQueue } from "./bounded-queue.ts";
import { readProductBatches } from "./stream-reader.ts";
import type { Product, ProcessedProduct } from "./transform.ts";

type Batch = {
  batchId: number;
  products: Product[];
};

type ResultBatch = {
  batchId: number;
  products: ProcessedProduct[];
};

const count = Number(process.argv[2] ?? 1000);
const workerCount = Number(process.argv[3] ?? 4);
const batchSize = 250;
const queueCapacity = 5;

if (
  !Number.isSafeInteger(count) || count <= 0 ||
  !Number.isSafeInteger(workerCount) || workerCount <= 0
) {
  throw new Error("Neteisingi argumentai");
}

function processBatch(
  worker: Worker,
  batch: Batch
): Promise<ResultBatch> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      worker.off("message", onMessage);
      worker.off("error", onError);
      worker.off("exit", onExit);
    };

    const onMessage = (
      result: ResultBatch & { error?: string }
    ) => {
      cleanup();

      if (result.error) {
        reject(new Error(result.error));
      } else {
        resolve(result);
      }
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onExit = (code: number) => {
      cleanup();
      reject(new Error(`Worker baigė darbą: ${code}`));
    };

    worker.on("message", onMessage);
    worker.on("error", onError);
    worker.on("exit", onExit);
    worker.postMessage(batch);
  });
}

async function main() {
  const input = `data/products_${count}.json`;
  const output = `results/parallel_${count}.json`;

  fs.mkdirSync("results", { recursive: true });

  const inputQueue = new BoundedQueue<Batch>(queueCapacity);
  const outputQueue = new BoundedQueue<ResultBatch>(queueCapacity);

  const workers = Array.from(
    { length: workerCount },
    () => new Worker(new URL("./worker.ts", import.meta.url))
  );

  let readTime = 0;
  let transformWorkTime = 0;
  let writeTime = 0;
  let processedCount = 0;

  const totalStart = performance.now();

  // 1 etapas: srautinis nuskaitymas
  const producer = async () => {
    let batchId = 0;
    const start = performance.now();

    try {
      for await (const products of readProductBatches(
        input,
        batchSize
      )) {
        await inputQueue.push({ batchId: batchId++, products });
      }
    } finally {
      readTime = performance.now() - start;
      inputQueue.close();
    }
  };

  // 2 etapas: lygiagretus transformavimas
  const transformers = workers.map(async worker => {
    while (true) {
      const batch = await inputQueue.pop();
      if (batch === null) break;

      const start = performance.now();
      const result = await processBatch(worker, batch);
      transformWorkTime += performance.now() - start;

      await outputQueue.push(result);
    }
  });

  // 3 etapas: srautinis įrašymas
  const writer = async () => {
    const stream = fs.createWriteStream(output, {
      encoding: "utf8"
    });

    const pending = new Map<number, ProcessedProduct[]>();
    let nextBatchId = 0;
    let first = true;

    const write = async (text: string) => {
      const start = performance.now();

      if (!stream.write(text)) {
        await once(stream, "drain");
      }

      writeTime += performance.now() - start;
    };

    try {
      await write("[");

      while (true) {
        const result = await outputQueue.pop();
        if (result === null) break;

        pending.set(result.batchId, result.products);

        while (pending.has(nextBatchId)) {
          const products = pending.get(nextBatchId)!;
          pending.delete(nextBatchId);

          for (const product of products) {
            await write(
              (first ? "" : ",") + JSON.stringify(product)
            );

            first = false;
            processedCount++;
          }

          nextBatchId++;
        }
      }

      if (pending.size > 0) {
        throw new Error("Trūksta apdorotų partijų");
      }

      await write("]");
      stream.end();
      await once(stream, "finish");
    } catch (error) {
      stream.destroy();
      throw error;
    }
  };

  try {
    const producerPromise = producer();
    const transformerPromise = Promise.all(transformers);
    const writerPromise = writer();

    await producerPromise;
    await transformerPromise;

    outputQueue.close();
    await writerPromise;
  } finally {
    await Promise.all(workers.map(w => w.terminate()));
  }

  const totalTime = performance.now() - totalStart;
  const throughput = processedCount / (totalTime / 1000);

  console.log("\n=== SRAUTINIS LYGIAGRETUS KONVEJERIS ===");
  console.log(`Produktų: ${processedCount}`);
  console.log(`Worker Threads: ${workerCount}`);
  console.log(`Partijos dydis: ${batchSize}`);
  console.log(`Eilės talpa: ${queueCapacity}`);
  console.log(`Nuskaitymo etapo trukmė: ${readTime.toFixed(2)} ms`);
  console.log(`Transformavimo darbo suma: ${transformWorkTime.toFixed(2)} ms`);
  console.log(`Įrašymo operacijų suma: ${writeTime.toFixed(2)} ms`);
  console.log(`Bendras laikas: ${totalTime.toFixed(2)} ms`);
  console.log(`Pralaidumas: ${throughput.toFixed(2)} produktų/s`);
  console.log(`Rezultatas: ${output}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
