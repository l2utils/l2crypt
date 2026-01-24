import crypto from "crypto";

export function constructPrivateKey(d: string, n: string, e: string) {
  return crypto.createPrivateKey({
    key: {
      kty: "RSA",
      n: Buffer.from(n, "hex").toString("base64url"),
      e: Buffer.from(e, "hex").toString("base64url"),
      d: Buffer.from(d, "hex").toString("base64url"),
      p: Buffer.alloc(n.length / 2).toString("base64url"),
      q: Buffer.alloc(n.length / 2).toString("base64url"),
      dp: Buffer.alloc(n.length / 2).toString("base64url"),
      dq: Buffer.alloc(n.length / 2).toString("base64url"),
      qi: Buffer.alloc(n.length / 2).toString("base64url"),
    },
    format: "jwk",
  });
}

export function constructPublicKey(n: string, e: string) {
  return crypto.createPublicKey({
    key: {
      kty: "RSA",
      n: Buffer.from(n, "hex").toString("base64url"),
      e: Buffer.from(e, "hex").toString("base64url"),
    },
    format: "jwk",
  });
}
