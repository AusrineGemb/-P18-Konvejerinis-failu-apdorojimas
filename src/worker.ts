
import { parentPort } from "node:worker_threads";
import { transformProduct, type Product } from "./transform.ts";

if (!parentPort) {
  throw new Error("Worker turi būti paleistas per Worker Threads");
}

parentPort.on(
  "message",
  (message: { batchId: number; products: Product[] }) => {
    try {
      const products = message.products.map(transformProduct);

      parentPort!.postMessage({
        batchId: message.batchId,
        products
      });
    } catch (error) {
      parentPort!.postMessage({
        batchId: message.batchId,
        error: String(error)
      });
    }
  }
);
