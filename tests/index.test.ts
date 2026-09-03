import * as l2crypt from "../src/index";
import { decode } from "../src/decoder";
import { getHeader, HEADER_SIZE } from "../src/utils/header";
import { bigIntPowMod } from "../src/utils/math";
import {
  privateModulus,
  privateExponent,
  publicExponent,
} from "../src/constants";

describe("index exports", () => {
  test("exports core library functions and constants", () => {
    expect(l2crypt.decode).toBe(decode);
    expect(l2crypt.getHeader).toBe(getHeader);
    expect(l2crypt.HEADER_SIZE).toBe(HEADER_SIZE);
    expect(l2crypt.bigIntPowMod).toBe(bigIntPowMod);
    expect(l2crypt.privateModulus).toBe(privateModulus);
    expect(l2crypt.privateExponent).toBe(privateExponent);
    expect(l2crypt.publicExponent).toBe(publicExponent);
  });
});
