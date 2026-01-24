import { constructPrivateKey, constructPublicKey } from "../src/utils/crypto";
import crypto from "crypto";

describe("crypto utils", () => {
  const n =
    "97df398472ddf737ef0a0cd17e8d172f0fef1661a38a8ae1d6e829bc1c6e4c3cfc19292dda9ef90175e46e7394a18850b6417d03be6eea274d3ed1dde5b5d7bde72cc0a0b71d03608655633881793a02c9a67d9ef2b45eb7c08d4be329083ce450e68f7867b6749314d40511d09bc5744551baa86a89dc38123dc1668fd72d83";
  const e =
    "30b4c2d798d47086145c75063c8e841e719776e400291d7838d3e6c4405b504c6a07f8fca27f32b86643d2649d1d5f124cdd0bf272f0909dd7352fe10a77b34d831043d9ae541f8263c6fe3d1c14c2f04e43a7253a6dda9a8c1562cbd493c1b631a1957618ad5dfe5ca28553f746e2fc6f2db816c7db223ec91e955081c1de65";
  const d = "35";

  test("constructPrivateKey returns a valid KeyObject", () => {
    const key = constructPrivateKey(d, n, e);
    expect(key).toBeInstanceOf(crypto.KeyObject);
    expect(key.type).toBe("private");
  });

  test("constructPublicKey returns a valid KeyObject", () => {
    const key = constructPublicKey(n, e);
    expect(key).toBeInstanceOf(crypto.KeyObject);
    expect(key.type).toBe("public");
  });
});
