import { open } from "fs/promises";

export const HEADER_SIZE = 28;

export async function getHeader(filepath: string) {
  const file = await open(filepath, "r");
  const buf = Buffer.alloc(HEADER_SIZE);
  const result = await file.read(buf, 0, 28);
  await file.close();
  const header = result.buffer.toString("utf-16le");

  const match = header.match(/Lineage2Ver(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  throw new Error(`Invalid header format: ${header}`);
}
