
import { BoundedQueue } from "./bounded-queue.ts";

async function main() {
  const queue = new BoundedQueue<number>(2);

  const producer = async () => {
    for (let i = 1; i <= 5; i++) {
      await queue.push(i);
      console.log("Įdėta:", i);
    }
    queue.close();
  };

  const consumer = async () => {
    while (true) {
      const value = await queue.pop();

      if (value === null) break;

      console.log("Paimta:", value);
    }
  };

  await Promise.all([producer(), consumer()]);

  console.log("Eilės testas baigtas!");
}

main().catch(console.error);
