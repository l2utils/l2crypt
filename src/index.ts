import fs from "node:fs/promises";
import { basename, resolve } from "node:path";
import { decode } from "./decoder";

async function main() {
  const args = process.argv.slice(2);
  let inputPath: string | undefined;
  let outputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-i" && i + 1 < args.length) {
      inputPath = args[++i];
    } else if (arg === "-o" && i + 1 < args.length) {
      outputPath = args[++i];
    } else if (!arg.startsWith("-") && !inputPath) {
      inputPath = arg;
    }
  }

  if (!inputPath) {
    console.error(
      "Usage: npx ts-node src/index.ts -i <input_file> [-o <output_file>]",
    );
    process.exit(1);
  }

  try {
    const decoded = await decode(inputPath);
    if (outputPath) {
      const outPath = resolve(outputPath);
      const outDir = resolve(outPath, "..");
      if (outDir !== resolve(".")) {
        await fs.mkdir(outDir, { recursive: true });
      }
      await fs.writeFile(outPath, decoded);
      console.info(`Successfully decoded ${inputPath} to ${outPath}`);
    } else {
      process.stdout.write(decoded);
    }
  } catch (error) {
    console.error(`Decoding failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
