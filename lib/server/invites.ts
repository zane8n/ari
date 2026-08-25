import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { type InviteSession, inviteSessions } from "@/db/schema";
import type { SealedPayloadV1 } from "@/lib/validation/schemas";
import { encryptPayload } from "./crypto";

/** 192 bits of randomness — comfortably above the 128-bit minimum (section 21). */
export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hashToken(token: string): string {
  return sha256Hex(token);
}

export async function findInviteByToken(token: string): Promise<InviteSession | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(inviteSessions)
    .where(eq(inviteSessions.inviteTokenHash, hashToken(token)))
    .limit(1);
  return row ?? null;
}

/** Idempotent: only the first open flips issued -> opened, so a sealed invite can never regress. */
export async function markOpened(publicId: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db
    .update(inviteSessions)
    .set({ status: "opened", openedAt: now, updatedAt: now })
    .where(and(eq(inviteSessions.publicId, publicId), eq(inviteSessions.status, "issued")));
}

export type SealOutcome =
  | { kind: "sealed"; sealedAt: string }
  | { kind: "alreadySealedSameSubmission"; sealedAt: string }
  | { kind: "conflict" }
  | { kind: "notFound" }
  | { kind: "revoked" };

/**
 * One transaction: lock the row, reject revoked invites, replay a matching
 * idempotency key as success, reject a differing second submission, then
 * encrypt and seal (section 20.1).
 */
export async function sealInvite(params: {
  token: string;
  idempotencyKey: string;
  payload: SealedPayloadV1;
}): Promise<SealOutcome> {
  const db = getDb();
  const tokenHash = hashToken(params.token);
  const idempotencyKeyHash = sha256Hex(params.idempotencyKey);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(inviteSessions)
      .where(eq(inviteSessions.inviteTokenHash, tokenHash))
      .for("update");

    if (!row) return { kind: "notFound" };
    if (row.status === "revoked") return { kind: "revoked" };

    if (row.status === "sealed") {
      if (row.idempotencyKeyHash !== null && row.idempotencyKeyHash === idempotencyKeyHash) {
        return { kind: "alreadySealedSameSubmission", sealedAt: (row.sealedAt as Date).toISOString() };
      }
      return { kind: "conflict" };
    }

    const encryptedPayload = encryptPayload(params.payload, row.publicId, 1);
    const sealedAt = new Date();
    await tx
      .update(inviteSessions)
      .set({
        status: "sealed",
        encryptedPayload,
        payloadSchemaVersion: 1,
        sealedAt,
        updatedAt: sealedAt,
        idempotencyKeyHash,
      })
      .where(eq(inviteSessions.id, row.id));

    return { kind: "sealed", sealedAt: sealedAt.toISOString() };
  });
}
