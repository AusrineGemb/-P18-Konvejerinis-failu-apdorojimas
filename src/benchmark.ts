
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";

const sizes = [1000, 10000, 100000];
const workerCounts = [1, 2, 4, 8];
const repetitions = 5;

type Result = {
  size: number;
  mode: string;
  workers: number;
  run: number;
  timeMs: number;
  throughput: number;
};

const results: Result[] = [];

function runProgram(
  file: string,
  args: number[]
): { timeMs: number; throughput: number } {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", file, ...args.map(String)],
    {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    }
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      `Programos klaida:\n${result.stderr || result.error}`
    );
  }

  const timeMatch = result.stdout.match(
    /Bendras laikas:\s*([\d.]+)\s*ms/
  );

  const throughputMatch = result.stdout.match(
    /Pralaidumas:\s*([\d.]+)\s*produktų\/s/
  );

  if (!timeMatch || !throughputMatch) {
    throw new Error(
      `Nepavyko nuskaityti rezultatų:\n${result.stdout}`
    );
  }

  return {
    timeMs: Number(timeMatch[1]),
    throughput: Number(throughputMatch[1])
  };
}

function main() {
  fs.mkdirSync("results", { recursive: true });

  for (const size of sizes) {
    console.log(`\n=== ${size} PRODUKTŲ ===`);

    for (let run = 1; run <= repetitions; run++) {
      const result = runProgram(
        "src/sequential.ts",
        [size]
      );

      results.push({
        size,
        mode: "sequential",
        workers: 0,
        run,
        ...result
      });

      console.log(
        `Nuoseklus ${run}/${repetitions}: ${result.timeMs} ms`
      );
    }

    for (const workers of workerCounts) {
      for (let run = 1; run <= repetitions; run++) {
        const result = runProgram(
          "src/parallel.ts",
          [size, workers]
        );

        results.push({
          size,
          mode: "parallel",
          workers,
          run,
          ...result
        });

        console.log(
          `${workers} workers, ${run}/${repetitions}: ${result.timeMs} ms`
        );
      }
    }
  }

  const header = "size,mode,workers,run,timeMs,throughput";

  const rows = results.map(r =>
    [
      r.size,
      r.mode,
      r.workers,
      r.run,
      r.timeMs,
      r.throughput
    ].join(",")
  );

  fs.writeFileSync(
    "results/benchmark.csv",
    [header, ...rows].join("\n"),
    "utf8"
  );

  console.log("\nEksperimentai baigti!");
  console.log("Rezultatai: results/benchmark.csv");
}

main();
