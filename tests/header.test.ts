import { getHeader } from "../src/utils/header";
import * as fs from "node:fs/promises";

jest.mock("node:fs/promises");

describe("getHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns version for valid header", async () => {
    const mockFile = {
      read: jest.fn().mockResolvedValue({
        buffer: Buffer.from("Lineage2Ver413" + " ".repeat(14), "utf-16le"),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (fs.open as jest.Mock).mockResolvedValue(mockFile);

    const version = await getHeader("test.ini");
    expect(version).toBe(413);
    expect(fs.open).toHaveBeenCalledWith("test.ini", "r");
    expect(mockFile.close).toHaveBeenCalled();
  });

  test("throws error for invalid header format", async () => {
    const mockFile = {
      read: jest.fn().mockResolvedValue({
        buffer: Buffer.from("InvalidHeader" + " ".repeat(15), "utf-16le"),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (fs.open as jest.Mock).mockResolvedValue(mockFile);

    await expect(getHeader("test.ini")).rejects.toThrow(
      "Invalid header format",
    );
    expect(mockFile.close).toHaveBeenCalled();
  });

  test("throws error if file cannot be opened", async () => {
    (fs.open as jest.Mock).mockRejectedValue(new Error("File not found"));
    await expect(getHeader("test.ini")).rejects.toThrow("File not found");
  });
});
