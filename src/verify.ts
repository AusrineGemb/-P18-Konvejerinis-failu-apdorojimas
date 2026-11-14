
import * as fs from "node:fs";
import * as path from "node:path";
import { isDeepStrictEqual } from "node:util";
import type {
  Product,
  ProcessedProduct
} from "./transform.ts";

const count = Number(process.argv[2] ?? 1000);

if (!Number.isSafeInteger(count) || count <= 0) {
  throw new Error("Neteisingas produktų skaičius");
}

const inputPath = path.join("data", `products_${count}.json`);

const sequentialPath = path.join(
  "results",
  `sequential_${count}.json`
);

const parallelPath = path.join(
  "results",
  `parallel_${count}.json`
);

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function verify() {
  const input = readJson<Product[]>(inputPath);
  const sequential = readJson<ProcessedProduct[]>(sequentialPath);
  const parallel = readJson<ProcessedProduct[]>(parallelPath);

  console.log("\n=== REZULTATŲ TIKRINIMAS ===");
  console.log(`Pradinių produktų: ${input.length}`);
  console.log(`Nuosekliai apdorota: ${sequential.length}`);
  console.log(`Lygiagrečiai apdorota: ${parallel.length}`);

  if (
    input.length !== count ||
    sequential.length !== input.length ||
    parallel.length !== input.length
  ) {
    throw new Error("Produktų skaičius nesutampa!");
  }

  let errors = 0;

  for (let i = 0; i < input.length; i++) {
    const original = input[i]!;
    const seq = sequential[i]!;
    const par = parallel[i]!;

    if (!isDeepStrictEqual(seq, par)) {
      errors++;

      if (errors <= 5) {
        console.error(
          `Skirtumas ties produktu ${i + 1}, ID ${original.id}`
        );
      }
    }

    if (
      seq.id !== original.id ||
      seq.price !== Number((original.price * 1.1).toFixed(2)) ||
      seq.seoTitle !==
        `${original.title} | ${original.vendor} | Shopify` ||
      seq.inStock !== (original.inventory > 0)
    ) {
      errors++;

      if (errors <= 5) {
        console.error(
          `Neteisinga transformacija: ID ${original.id}`
        );
      }
    }
  }

  if (errors === 0) {
    console.log("Visi produktai apdoroti teisingai!");
    console.log("Nuoseklūs ir lygiagretūs rezultatai sutampa.");
    console.log("Klaidų: 0");
  } else {
    console.error(`Rasta klaidų: ${errors}`);
    process.exitCode = 1;
  }
}

verify();
