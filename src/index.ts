import fs from "node:fs/promises";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { basename, resolve } from "node:path";
import { HEADER_SIZE, getHeader } from "./utils/header";
import { privateModulus, privateExponent } from "./constants";

const CHUNK_SIZE = 128;

function bigIntPowMod(base: bigint, exponent: bigint, modulus: bigint) {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent >> 1n;
    base = (base * base) % modulus;
  }
  return result;
}

async function decode(filepath: string): Promise<Buffer> {
  const version = await getHeader(filepath).catch(() => null);
  if (version !== 413) {
    throw new Error(`Unsupported or invalid file header for version: ${version}`);
  }

  const fileHandle = await fs.open(filepath, "r");
  try {
    const stats = await fileHandle.stat();
    const fileSize = stats.size;
    const numBlocks = Math.floor((fileSize - HEADER_SIZE) / CHUNK_SIZE);

    if (numBlocks <= 0) {
      throw new Error("File is too small or empty");
    }

    const decryptedChunks: Buffer[] = [];
    const blockBuf = Buffer.alloc(CHUNK_SIZE);

    for (let i = 0; i < numBlocks; i++) {
      const { bytesRead } = await fileHandle.read(
        blockBuf,
        0,
        CHUNK_SIZE,
        HEADER_SIZE + i * CHUNK_SIZE
      );

      if (bytesRead !== CHUNK_SIZE) {
        throw new Error(`Unexpected end of file at block ${i}`);
      }

      const blockBigInt = BigInt("0x" + blockBuf.toString("hex"));
      const result = bigIntPowMod(blockBigInt, privateExponent, privateModulus);

      const hex = result.toString(16).padStart(250, "0");
      const decrypted = Buffer.from(hex, "hex");

      const dataSize = decrypted[0];
      let actualData: Buffer;

      if (dataSize !== 0x7c) {
        let p = decrypted.length - dataSize;
        while (p > 2 && decrypted[p - 1] !== 0) --p;
        actualData = decrypted.subarray(p, p + dataSize);
      } else {
        actualData = decrypted.subarray(1);
      }

      decryptedChunks.push(actualData);
    }

    const combinedData = Buffer.concat(decryptedChunks);
    const expectedDecompressedSize = combinedData.readUInt32LE(0);
    const compressedData = combinedData.subarray(4);

    const decompressed = zlib.inflateSync(compressedData);
    if (decompressed.length !== expectedDecompressedSize) {
      throw new Error(
        `Decompressed size mismatch: expected ${expectedDecompressedSize}, got ${decompressed.length}`
      );
    }

    return decompressed;
  } finally {
    await fileHandle.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const filepath = args.find((arg) => !arg.startsWith("-"));

  if (!filepath) {
    console.error("Usage: npx ts-node src/index2.ts <filepath>");
    process.exit(1);
  }

  try {
    const decoded = await decode(filepath);
    const outPath = resolve("out", basename(filepath));
    await fs.mkdir("out", { recursive: true });
    await fs.writeFile(outPath, decoded);
    console.info(`Successfully decoded ${filepath} to ${outPath}`);
  } catch (error) {
    console.error(`Decoding failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
