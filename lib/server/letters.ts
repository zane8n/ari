import "server-only";
import { and, desc, eq, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { type Letter, letters } from "@/db/schema";
import { hashToken } from "./invites";

export async function findLetterByToken(token: string): Promise<Letter | null> {
  const [row] = await getDb().select().from(letters).where(eq(letters.tokenHash, hashToken(token))).limit(1);
  return row ?? null;
}

export function isLetterUnlocked(letter: Pick<Letter, "unlockAt">, now: Date = new Date()): boolean {
  return now.getTime() >= letter.unlockAt.getTime();
}

/** First open only, and only once the lock has lifted — the timestamps can't be set early. */
export async function markLetterOpened(token: string): Promise<void> {
  const now = new Date();
  await getDb()
    .update(letters)
    .set({ openedAt: now })
    .where(and(eq(letters.tokenHash, hashToken(token)), isNull(letters.openedAt), lte(letters.unlockAt, now)));
}

export async function markLetterFinished(token: string): Promise<void> {
  const now = new Date();
  await getDb()
    .update(letters)
    .set({ finishedAt: now, openedAt: sql`coalesce(${letters.openedAt}, ${now.toISOString()}::timestamptz)` })
    .where(and(eq(letters.tokenHash, hashToken(token)), isNull(letters.finishedAt), lte(letters.unlockAt, now)));
}

export type LetterStatus = Pick<Letter, "id" | "unlockAt" | "openedAt" | "finishedAt" | "createdAt">;

/** Host view — status only, never the body. */
export async function listLetterStatuses(): Promise<LetterStatus[]> {
  return getDb()
    .select({
      id: letters.id,
      unlockAt: letters.unlockAt,
      openedAt: letters.openedAt,
      finishedAt: letters.finishedAt,
      createdAt: letters.createdAt,
    })
    .from(letters)
    .orderBy(desc(letters.createdAt));
}
