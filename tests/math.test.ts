import { bigIntPowMod } from "../src/utils/math";

describe("bigIntPowMod", () => {
  test("calculates (base^exponent) % modulus correctly", () => {
    // 2^10 % 1000 = 1024 % 1000 = 24
    expect(bigIntPowMod(2n, 10n, 1000n)).toBe(24n);

    // 5^3 % 13 = 125 % 13 = 8 (13*9=117)
    expect(bigIntPowMod(5n, 3n, 13n)).toBe(8n);

    // Large numbers
    const base = BigInt("12345678901234567890");
    const exp = BigInt("123");
    const mod = BigInt("1000000007");
    // (base^exp) % mod should be consistent
    const result = bigIntPowMod(base, exp, mod);
    expect(typeof result).toBe("bigint");
    expect(result).toBeLessThan(mod);
  });

  test("returns 0 when modulus is 1", () => {
    expect(bigIntPowMod(10n, 5n, 1n)).toBe(0n);
  });

  test("handles base larger than modulus", () => {
    expect(bigIntPowMod(15n, 2n, 10n)).toBe(5n); // 15^2 = 225, 225%10 = 5
  });

  test("handles exponent of 0", () => {
    expect(bigIntPowMod(10n, 0n, 100n)).toBe(1n);
  });
});
