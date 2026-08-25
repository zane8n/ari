import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getEnv } from "@/lib/config/env";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const ENVELOPE_VERSION = 1;

type EncryptedEnvelope = {
  v: number;
  iv: string;
  tag: string;
  ciphertext: string;
};

function getKey(): Buffer {
  return Buffer.from(getEnv().RESPONSE_ENCRYPTION_KEY, "base64");
}

/** Binds the envelope to the invite it belongs to, so one row's ciphertext can't be replayed onto another. */
function buildAad(publicId: string, schemaVersion: number): Buffer {
  return Buffer.from(`${publicId}:${schemaVersion}`, "utf8");
}

export function encryptPayload(plaintext: unknown, publicId: string, schemaVersion: number): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  cipher.setAAD(buildAad(publicId, schemaVersion));
  const json = Buffer.from(JSON.stringify(plaintext), "utf8");
  const ciphertext = Buffer.concat([cipher.update(json), cipher.final()]);
  const tag = cipher.getAuthTag();

  const envelope: EncryptedEnvelope = {
    v: ENVELOPE_VERSION,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
  return Buffer.from(JSON.stringify(envelope), "utf8").toString("base64");
}

export function decryptPayload<T>(envelopeBase64: string, publicId: string, schemaVersion: number): T {
  const envelope = JSON.parse(Buffer.from(envelopeBase64, "base64").toString("utf8")) as EncryptedEnvelope;
  if (envelope.v !== ENVELOPE_VERSION) {
    throw new Error(`Unsupported sealed-payload envelope version: ${envelope.v}`);
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(envelope.iv, "base64"));
  decipher.setAAD(buildAad(publicId, schemaVersion));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}
