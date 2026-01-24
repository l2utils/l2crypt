#!/usr/bin/env node
import fs from "node:fs/promises";
import { resolve } from "node:path";
import { Command } from "commander";
import { decode } from "./decoder";

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
      console.error("Error: input file is required");
      program.help();
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
  });

program.parse(process.argv);
