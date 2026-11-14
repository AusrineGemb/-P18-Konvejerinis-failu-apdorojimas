
import * as fs from "node:fs";
import * as path from "node:path";
import { performance } from "node:perf_hooks";

interface Product {
  id: number;
  title: string;
  vendor: string;
  price: number;
  inventory: number;
  description: string;
  tags: string[];
}

interface ProcessedProduct extends Product {
  seoTitle: string;
  inStock: boolean;
}

// 1. Produkto transformavimas
function transformProduct(product: Product): ProcessedProduct {
  return {
    ...product,
    price: Number((product.price * 1.1).toFixed(2)),
    seoTitle: `${product.title} | ${product.vendor} | Shopify`,
    inStock: product.inventory > 0
  };
}

// 2. Nuoseklus apdorojimas
function processSequential(count: number): void {
  const inputPath = path.join("data", `products_${count}.json`);
  const outputPath = path.join("results", `sequential_${count}.json`);

  fs.mkdirSync("results", { recursive: true });

  const totalStart = performance.now();

  // 1 etapas: nuskaitymas
  const readStart = performance.now();

  const fileContent = fs.readFileSync(inputPath, "utf-8");
  const products: Product[] = JSON.parse(fileContent);

  const readTime = performance.now() - readStart;

  // 2 etapas: transformavimas
  const transformStart = performance.now();

  const processedProducts = products.map(transformProduct);

  const transformTime = performance.now() - transformStart;

  // 3 etapas: įrašymas
  const writeStart = performance.now();

  fs.writeFileSync(
    outputPath,
    JSON.stringify(processedProducts),
    "utf-8"
  );

  const writeTime = performance.now() - writeStart;
  const totalTime = performance.now() - totalStart;

  const throughput = products.length / (totalTime / 1000);

  console.log("\n=== NUOSEKLUS APDOROJIMAS ===");
  console.log(`Produktų skaičius: ${products.length}`);
  console.log(`Nuskaitymas: ${readTime.toFixed(2)} ms`);
  console.log(`Transformavimas: ${transformTime.toFixed(2)} ms`);
  console.log(`Įrašymas: ${writeTime.toFixed(2)} ms`);
  console.log(`Bendras laikas: ${totalTime.toFixed(2)} ms`);
  console.log(`Pralaidumas: ${throughput.toFixed(2)} produktų/s`);
  console.log(`Rezultatas: ${outputPath}`);
}

const count = Number(process.argv[2] ?? 1000);

if (!Number.isSafeInteger(count) || count <= 0) {
  throw new Error("Neteisingas produktų skaičius.");
}

processSequential(count);
