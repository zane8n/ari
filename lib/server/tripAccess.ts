import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { tripPasses, type Trip, type TripPass } from "@/db/schema";
import { getEnv } from "@/lib/config/env";
import { hashToken } from "./invites";
import { hasValidHostSession } from "./host-auth";

/**
 * Trip passes: one-time links that let a guest (not the host) into exactly
 * one trip. The link's token is shown once and only its hash is stored.
 * Claiming it (an explicit POST — link-preview bots fetching the URL can't
 * burn it) binds the device with a signed, long-lived cookie naming the pass.
 * Every request re-checks the pass, so revoking it signs that device out.
 */
export const TRIP_PASS_COOKIE_NAME = "trip_pass";
/** Browsers cap cookie lifetime at ~400 days. */
export const TRIP_PASS_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

export type TripAccess = "host" | "guest";

function signPassId(passId: string): string {
  return createHmac("sha256", Buffer.from(getEnv().HOST_SESSION_SECRET, "base64")).update(`trip-pass:${passId}`).digest("base64url");
}

export function createPassCookieValue(passId: string): string {
  return `${passId}.${signPassId(passId)}`;
}

/** Returns the pass id the cookie vouches for, or null if it's missing or forged. */
export function readPassCookieValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const [passId, signature] = value.split(".");
  if (!passId || !signature) return null;
  const expected = Buffer.from(signPassId(passId));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return passId;
}

export async function createTripPass(tripId: string, label: string): Promise<{ pass: TripPass; token: string }> {
  const token = randomBytes(24).toString("base64url");
  const [pass] = await getDb().insert(tripPasses).values({ tripId, label, tokenHash: hashToken(token) }).returning();
  return { pass, token };
}

export async function findPassByToken(token: string): Promise<TripPass | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const [row] = await getDb().select().from(tripPasses).where(eq(tripPasses.tokenHash, hashToken(token))).limit(1);
  return row ?? null;
}

/** Atomically claims an unclaimed, unrevoked pass. Returns null if someone (or something) got there first. */
export async function claimPass(token: string): Promise<TripPass | null> {
  const now = new Date();
  const [row] = await getDb()
    .update(tripPasses)
    .set({ claimedAt: now, lastSeenAt: now })
    .where(and(eq(tripPasses.tokenHash, hashToken(token)), isNull(tripPasses.claimedAt), isNull(tripPasses.revokedAt)))
    .returning();
  return row ?? null;
}

/** The pass this device holds, if it's still valid. */
export async function currentGuestPass(): Promise<TripPass | null> {
  const passId = readPassCookieValue((await cookies()).get(TRIP_PASS_COOKIE_NAME)?.value);
  if (!passId) return null;
  const [pass] = await getDb().select().from(tripPasses).where(eq(tripPasses.id, passId)).limit(1);
  if (!pass || pass.revokedAt || !pass.claimedAt) return null;
  // Touch "last seen" at most hourly — enough for the host's list, cheap on writes.
  if (!pass.lastSeenAt || Date.now() - pass.lastSeenAt.getTime() > 60 * 60 * 1000) {
    await getDb().update(tripPasses).set({ lastSeenAt: new Date() }).where(eq(tripPasses.id, pass.id));
  }
  return pass;
}

/** Host session wins; otherwise a valid pass for this exact trip; otherwise no access. */
export async function getTripAccess(trip: Pick<Trip, "id">): Promise<TripAccess | null> {
  if (await hasValidHostSession()) return "host";
  const pass = await currentGuestPass();
  return pass && pass.tripId === trip.id ? "guest" : null;
}
