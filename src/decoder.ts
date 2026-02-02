import fs from "node:fs/promises";
import zlib from "node:zlib";
import { privateExponent, privateModulus } from "./constants";
import { HEADER_SIZE, getHeader } from "./utils/header";
import { bigIntPowMod } from "./utils/math";

const CHUNK_SIZE = 128;

export async function decode(filepath: string): Promise<Buffer> {
  const version = await getHeader(filepath).catch(() => null);
  if (version !== 413) {
    throw new Error(
      `Unsupported or invalid file header for version: ${version}`,
    );
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
        HEADER_SIZE + i * CHUNK_SIZE,
      );

      if (bytesRead !== CHUNK_SIZE) {
        throw new Error(`Unexpected end of file at block ${i}`);
      }

      const blockBigInt = BigInt("0x" + blockBuf.toString("hex"));
      const result = bigIntPowMod(blockBigInt, privateExponent, privateModulus);

      const hex = result.toString(16).padStart(250, "0");
      const decrypted = Buffer.from(hex, "hex");

      const dataSize = decrypted[0];
      let p: number;
      let len: number;

      if (dataSize === 0x7c) {
        p = 1;
        len = 124;
      } else {
        p = 125 - dataSize;
        while (p > 1 && decrypted[p - 1] !== 0) --p;
        len = dataSize;
      }

      if (i === 0) {
        // Robust alignment for the first block using zlib signature
        let zlibIdx = -1;
        for (let j = 0; j < decrypted.length - 1; j++) {
          if (
            decrypted[j] === 0x78 &&
            (decrypted[j + 1] === 0x9c ||
              decrypted[j + 1] === 0xda ||
              decrypted[j + 1] === 0x01)
          ) {
            zlibIdx = j;
            break;
          }
        }
        if (zlibIdx >= 4) {
          p = zlibIdx - 4;
          len = 125 - p;
        }
      }

      decryptedChunks.push(decrypted.subarray(p, p + len));
    }

    const combinedData = Buffer.concat(decryptedChunks);
    if (combinedData.length < 4) {
      throw new Error("Decrypted data is too small to contain size field");
    }

    const expectedDecompressedSize = combinedData.readUInt32LE(0);
    const compressedData = combinedData.subarray(4);

    try {
      const decompressed = zlib.inflateSync(compressedData);
      if (decompressed.length !== expectedDecompressedSize) {
        throw new Error(
          `Decompressed size mismatch: expected ${expectedDecompressedSize}, got ${decompressed.length}`,
        );
      }
      return decompressed;
    } catch (error) {
      console.error(`Decompression failed for ${filepath}:`);
      console.error(
        `- Expected decompressed size: ${expectedDecompressedSize}`,
      );
      console.error(`- Compressed data length: ${compressedData.length}`);
      console.error(
        `- First 16 bytes of compressed data: ${compressedData.subarray(0, 16).toString("hex")}`,
      );
      throw error;
    }
  } finally {
    await fileHandle.close();
  }
}
