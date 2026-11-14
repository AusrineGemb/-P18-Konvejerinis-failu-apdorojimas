
import { readProductBatches } from "./stream-reader.ts";

async function main() {
  let total = 0;
  let batches = 0;

  for await (const batch of readProductBatches(
    "data/products_1000.json",
    250
  )) {
    batches++;
    total += batch.length;

    console.log(
      `Partija ${batches}: ${batch.length} produktų`
    );
  }

  console.log(`Iš viso: ${total} produktų`);
  console.log(`Partijų: ${batches}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
