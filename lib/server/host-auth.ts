import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/config/env";

export const HOST_SESSION_COOKIE_NAME = "birthday_host_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

/** Format: scrypt:<saltHex>:N:r:p:<hashHex> — self-describing so params can change without breaking old hashes. */
export function hashHostPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt:${salt.toString("hex")}:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${derived.toString("hex")}`;
}

export function verifyHostPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, saltHex, nRaw, rRaw, pRaw, hashHex] = parts;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = scryptSync(password, salt, expected.length, {
      N: Number(nRaw),
      r: Number(rRaw),
      p: Number(pRaw),
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

type HostSessionPayload = { iat: number; exp: number };

function getSessionSecret(): Buffer {
  return Buffer.from(getEnv().HOST_SESSION_SECRET, "base64");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", getSessionSecret()).update(payloadB64).digest("base64url");
}

export function createHostSessionToken(): string {
  const now = Date.now();
  const payload: HostSessionPayload = { iat: now, exp: now + SESSION_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyHostSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return false;

  const expected = Buffer.from(sign(payloadB64));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as HostSessionPayload;
    return typeof payload.exp === "number" && Date.now() < payload.exp;
  } catch {
    return false;
  }
}

export const HOST_SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
