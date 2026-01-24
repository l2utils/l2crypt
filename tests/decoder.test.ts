import { decode } from "../src/decoder";
import fs from "node:fs/promises";
import { getHeader } from "../src/utils/header";
import zlib from "node:zlib";
import { bigIntPowMod } from "../src/utils/math";

jest.mock("node:fs/promises");
jest.mock("../src/utils/header");
jest.mock("node:zlib");
jest.mock("../src/utils/math");

describe("decode", () => {
  const CHUNK_SIZE = 128;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("throws error for unsupported versions", async () => {
    (getHeader as jest.Mock).mockResolvedValue(414);
    await expect(decode("dummy.ini")).rejects.toThrow(
      "Unsupported or invalid file header for version: 414",
    );
  });

  test("handles getHeader failure (catch coverage)", async () => {
    (getHeader as jest.Mock).mockRejectedValue(new Error("Header fail"));
    await expect(decode("dummy.ini")).rejects.toThrow(
      "Unsupported or invalid file header for version: null",
    );
  });

  test("throws error for empty/small files", async () => {
    (getHeader as jest.Mock).mockResolvedValue(413);
    const mockFileHandle = {
      stat: jest.fn().mockResolvedValue({ size: 20 }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (fs.open as jest.Mock).mockResolvedValue(mockFileHandle);

    await expect(decode("dummy.ini")).rejects.toThrow(
      "File is too small or empty",
    );
    expect(mockFileHandle.close).toHaveBeenCalled();
  });

  test("successfully decodes multiple blocks (including 0x7c case)", async () => {
    (getHeader as jest.Mock).mockResolvedValue(413);

    // Header (28) + 2 blocks (128 * 2) = 284 bytes
    const mockFileHandle = {
      stat: jest.fn().mockResolvedValue({ size: 284 }),
      read: jest
        .fn()
        .mockResolvedValueOnce({ bytesRead: CHUNK_SIZE })
        .mockResolvedValueOnce({ bytesRead: CHUNK_SIZE }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (fs.open as jest.Mock).mockResolvedValue(mockFileHandle);

    // Block 1: size 10, first 4 bytes indicate decompressed size 100
    const decrypted1 = Buffer.alloc(125, 0);
    decrypted1[0] = 10;
    decrypted1.writeUInt32LE(100, 125 - 10);

    // Block 2: size 0x7c
    const decrypted2 = Buffer.alloc(125, 0);
    decrypted2[0] = 0x7c;

    (bigIntPowMod as jest.Mock)
      .mockReturnValueOnce(BigInt("0x" + decrypted1.toString("hex")))
      .mockReturnValueOnce(BigInt("0x" + decrypted2.toString("hex")));

    (zlib.inflateSync as jest.Mock).mockReturnValue(Buffer.alloc(100));

    const result = await decode("dummy.ini");
    expect(result.length).toBe(100);
    expect(mockFileHandle.close).toHaveBeenCalled();
  });

  test("throws error if read bytes mismatch", async () => {
    (getHeader as jest.Mock).mockResolvedValue(413);
    const mockFileHandle = {
      stat: jest.fn().mockResolvedValue({ size: 156 }),
      read: jest.fn().mockResolvedValue({ bytesRead: 100 }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (fs.open as jest.Mock).mockResolvedValue(mockFileHandle);

    await expect(decode("dummy.ini")).rejects.toThrow(
      "Unexpected end of file at block 0",
    );
    expect(mockFileHandle.close).toHaveBeenCalled();
  });

  test("throws error if decompressed size mismatch", async () => {
    (getHeader as jest.Mock).mockResolvedValue(413);
    const mockFileHandle = {
      stat: jest.fn().mockResolvedValue({ size: 156 }),
      read: jest.fn().mockResolvedValue({ bytesRead: CHUNK_SIZE }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (fs.open as jest.Mock).mockResolvedValue(mockFileHandle);

    const decrypted = Buffer.alloc(125, 0);
    decrypted[0] = 10;
    decrypted.writeUInt32LE(100, 115); // p = 125 - 10 = 115

    (bigIntPowMod as jest.Mock).mockReturnValue(
      BigInt("0x" + decrypted.toString("hex")),
    );
    (zlib.inflateSync as jest.Mock).mockReturnValue(Buffer.alloc(50));

    await expect(decode("dummy.ini")).rejects.toThrow(
      "Decompressed size mismatch: expected 100, got 50",
    );
  });

  test("p logic covers the loop while decrypted[p - 1] !== 0", async () => {
    (getHeader as jest.Mock).mockResolvedValue(413);
    const mockFileHandle = {
      stat: jest.fn().mockResolvedValue({ size: 156 }),
      read: jest.fn().mockResolvedValue({ bytesRead: CHUNK_SIZE }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (fs.open as jest.Mock).mockResolvedValue(mockFileHandle);

    // Simplest way: set dataSize to something that makes p small.
    // If dataSize is 120, then p = 125 - 120 = 5.
    // Loop checks decrypted[4], decrypted[3], decrypted[2].
    // If decrypted[3] is 0, loop stops at p=4.
    const decrypted = Buffer.alloc(125, 1); // Not 0
    decrypted[0] = 120;
    decrypted[3] = 0; // p-1 = 3 -> p=4.
    decrypted.writeUInt32LE(100, 4); // actualData starts at 4

    (bigIntPowMod as jest.Mock).mockReturnValue(
      BigInt("0x" + decrypted.toString("hex")),
    );
    (zlib.inflateSync as jest.Mock).mockReturnValue(Buffer.alloc(100));

    const result = await decode("dummy.ini");
    expect(result.length).toBe(100);
  });
});
