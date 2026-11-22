import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tripPasses } from "@/db/schema";
import { resolveTripRequest } from "@/lib/server/tripRoute";

export const dynamic = "force-dynamic";

/** Revokes a pass: an unused link stops working, and a device already holding it is signed out on its next request. */
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const resolved = await resolveTripRequest(request, slug, "delete", { hostOnly: true });
  if ("response" in resolved) return resolved.response;
  const [row] = await getDb()
    .update(tripPasses)
    .set({ revokedAt: new Date() })
    .where(and(eq(tripPasses.id, id), eq(tripPasses.tripId, resolved.trip.id)))
    .returning({ id: tripPasses.id });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
