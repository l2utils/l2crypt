#!/usr/bin/env node
import fs from "node:fs/promises";
import { resolve } from "node:path";
import { Command } from "commander";
import { decode } from "./decoder";

interface DecodeResults {
  success: string[];
  failed: { file: string; error: string }[];
}

async function processDirectory(
  inputDir: string,
  outputDir: string,
): Promise<DecodeResults> {
  const files = await fs.readdir(inputDir);
  const results: DecodeResults = {
    success: [],
    failed: [],
  };

  for (const file of files) {
    const filePath = resolve(inputDir, file);
    const stats = await fs.stat(filePath);

    if (stats.isFile()) {
      try {
        const decoded = await decode(filePath);
        const outPath = resolve(outputDir, file);
        await fs.writeFile(outPath, decoded);
        console.info(`Successfully decoded ${file} to ${outPath}`);
        results.success.push(file);
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error(`Failed to decode ${file}`, error);
        results.failed.push({ file, error: errorMessage });
      }
    }
  }

  return results;
}

function printSummary(results: DecodeResults): void {
  console.info("\nDecoding Summary:");
  console.info(
    `Total processed: ${results.success.length + results.failed.length}`,
  );
  console.info(`Successfully decoded: ${results.success.length}`);
  console.info(`Failed to decode: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.info("\nFailed Files:");
    results.failed.forEach(({ file, error }) => {
      console.info(`- ${file}: ${error}`);
    });
  }
}

const program = new Command();

program
  .name("l2crypt")
  .description("Lineage 2 cryptography tool")
  .version("1.0.0")
  .argument("[input]", "Input file path")
  .option("-i, --input <path>", "Input file path")
  .option("-o, --output <path>", "Output file path")
  .action(async (positionalInput, options) => {
    const inputPath = options.input || positionalInput;
    const outputPath = options.output;

    if (!inputPath) {
      console.error("Error: input file or directory is required");
      program.help();
      process.exit(1);
    }

    const resolvedInputPath = resolve(inputPath);
    try {
      const stats = await fs.stat(resolvedInputPath);

      if (stats.isDirectory()) {
        const outDir = outputPath ? resolve(outputPath) : resolve("out");
        await fs.mkdir(outDir, { recursive: true });
        console.info(`Processing directory: ${resolvedInputPath}`);

        const results = await processDirectory(resolvedInputPath, outDir);
        printSummary(results);
      } else {
        const decoded = await decode(resolvedInputPath);
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
      }
    } catch (error) {
      console.error(`Operation failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
