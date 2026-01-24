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
        `Decompressed size mismatch: expected ${expectedDecompressedSize}, got ${decompressed.length}`,
      );
    }

    return decompressed;
  } finally {
    await fileHandle.close();
  }
}
