
import { Worker } from "node:worker_threads";
import * as fs from "node:fs";
import { performance } from "node:perf_hooks";
import type { Product, ProcessedProduct } from "./transform.ts";

function runWorker(
  products: Product[]
): Promise<ProcessedProduct[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./worker.ts", import.meta.url)
    );

    worker.once("message", (result) => {
      worker.terminate();

      if (result?.error) {
        reject(new Error(result.error));
      } else {
        resolve(result as ProcessedProduct[]);
      }
    });

    worker.once("error", reject);

    worker.postMessage(products);
  });
}

async function main() {
  const products: Product[] = JSON.parse(
    fs.readFileSync("data/products_1000.json", "utf-8")
  );

  const middle = Math.ceil(products.length / 2);

  const firstHalf = products.slice(0, middle);
  const secondHalf = products.slice(middle);

  const start = performance.now();

  const [result1, result2] = await Promise.all([
    runWorker(firstHalf),
    runWorker(secondHalf)
  ]);

  const results = [...result1, ...result2];

  console.log("Apdorota produktų:", results.length);
  console.log(
    "Laikas:",
    (performance.now() - start).toFixed(2),
    "ms"
  );

  fs.mkdirSync("results", { recursive: true });
  fs.writeFileSync(
    "results/parallel_test.json",
    JSON.stringify(results)
  );
}

main().catch(console.error);
