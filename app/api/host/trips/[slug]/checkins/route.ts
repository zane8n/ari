import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { tripCheckins } from "@/db/schema";
import { resolveTripRequest } from "@/lib/server/tripRoute";
import { checkinSchema } from "@/lib/validation/tripSchemas";

export const dynamic = "force-dynamic";

/** Marks a day's evening check-in done (re-submitting a day just updates its note). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolved = await resolveTripRequest(request, (await params).slug, "write");
  if ("response" in resolved) return resolved.response;

  const parsed = checkinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid check-in." }, { status: 400 });
  const values = {
    highlight: parsed.data.highlight || null,
    mood: parsed.data.mood ?? null,
    completedAt: new Date(),
  };

  const [row] = await getDb()
    .insert(tripCheckins)
    .values({ tripId: resolved.trip.id, day: parsed.data.day, ...values })
    .onConflictDoUpdate({ target: [tripCheckins.tripId, tripCheckins.day], set: values })
    .returning();

  return NextResponse.json({ checkin: { day: row.day, highlight: row.highlight, mood: row.mood, completedAt: row.completedAt.toISOString() } });
}
