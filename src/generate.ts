
import * as fs from "node:fs";
import * as path from "node:path";

interface Product {
  id: number;
  title: string;
  vendor: string;
  price: number;
  inventory: number;
  description: string;
  tags: string[];
}

function generateProducts(count: number): Product[] {
  const products: Product[] = [];

  const vendors = ["Nike", "Adidas", "Puma", "Reebok"];
  const categories = ["Shoes", "T-Shirt", "Hoodie", "Jacket"];

  for (let i = 1; i <= count; i++) {
    products.push({
      id: i,
      title: `${categories[i % categories.length]} ${i}`,
      vendor: vendors[i % vendors.length]!,
      price: Number((10 + (i % 200) * 1.5).toFixed(2)),
      inventory: i % 100,
      description: `Product ${i} description for Shopify store`,
      tags: ["shopify", "fashion", "test"]
    });
  }

  return products;
}

const count = Number(process.argv[2] ?? 1000);

if (!Number.isSafeInteger(count) || count <= 0) {
  throw new Error("Produktų skaičius turi būti teigiamas sveikasis skaičius.");
}

const products = generateProducts(count);

const outputPath = path.join("data", `products_${count}.json`);

fs.mkdirSync("data", { recursive: true });

fs.writeFileSync(
  outputPath,
  JSON.stringify(products, null, 2),
  "utf-8"
);

console.log(`Sugeneruota produktų: ${count}`);
console.log(`Failas: ${outputPath}`);
