import { describe, expect, it } from "vitest";
import { decryptPayload, encryptPayload } from "@/lib/server/crypto";

describe("encryptPayload / decryptPayload", () => {
  const payload = { preferredName: "Alex", themeId: "teal", note: "hello" };

  it("round-trips a payload with the same publicId and schema version", () => {
    const envelope = encryptPayload(payload, "public-1", 1);
    const decrypted = decryptPayload<typeof payload>(envelope, "public-1", 1);
    expect(decrypted).toEqual(payload);
  });

  it("produces a different envelope every time (fresh IV)", () => {
    const a = encryptPayload(payload, "public-1", 1);
    const b = encryptPayload(payload, "public-1", 1);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt when the AAD (publicId) does not match", () => {
    const envelope = encryptPayload(payload, "public-1", 1);
    expect(() => decryptPayload(envelope, "public-2", 1)).toThrow();
  });

  it("fails to decrypt when the schema version does not match", () => {
    const envelope = encryptPayload(payload, "public-1", 1);
    expect(() => decryptPayload(envelope, "public-1", 2)).toThrow();
  });

  it("fails to decrypt when the ciphertext has been tampered with", () => {
    const envelope = encryptPayload(payload, "public-1", 1);
    const decoded = JSON.parse(Buffer.from(envelope, "base64").toString("utf8"));
    const tamperedCiphertext = Buffer.from(decoded.ciphertext, "base64");
    tamperedCiphertext[0] ^= 0xff;
    decoded.ciphertext = tamperedCiphertext.toString("base64");
    const tamperedEnvelope = Buffer.from(JSON.stringify(decoded)).toString("base64");
    expect(() => decryptPayload(tamperedEnvelope, "public-1", 1)).toThrow();
  });

  it("fails to decrypt when the auth tag has been tampered with", () => {
    const envelope = encryptPayload(payload, "public-1", 1);
    const decoded = JSON.parse(Buffer.from(envelope, "base64").toString("utf8"));
    const tamperedTag = Buffer.from(decoded.tag, "base64");
    tamperedTag[0] ^= 0xff;
    decoded.tag = tamperedTag.toString("base64");
    const tamperedEnvelope = Buffer.from(JSON.stringify(decoded)).toString("base64");
    expect(() => decryptPayload(tamperedEnvelope, "public-1", 1)).toThrow();
  });
});
