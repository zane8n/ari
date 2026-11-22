import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { tripPasses, type TripPass } from "@/db/schema";
import { getEnv } from "@/lib/config/env";
import { createTripPass } from "@/lib/server/tripAccess";
import { resolveTripRequest } from "@/lib/server/tripRoute";

export const dynamic = "force-dynamic";

/** What the host sees about a pass — never its token (only the hash is stored anyway). */
function view(pass: TripPass) {
  return {
    id: pass.id,
    label: pass.label,
    createdAt: pass.createdAt.toISOString(),
    claimedAt: pass.claimedAt?.toISOString() ?? null,
    lastSeenAt: pass.lastSeenAt?.toISOString() ?? null,
    revokedAt: pass.revokedAt?.toISOString() ?? null,
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolved = await resolveTripRequest(request, (await params).slug, "read", { hostOnly: true });
  if ("response" in resolved) return resolved.response;
  const rows = await getDb().select().from(tripPasses).where(eq(tripPasses.tripId, resolved.trip.id)).orderBy(desc(tripPasses.createdAt));
  return NextResponse.json({ passes: rows.map(view) });
}

const createSchema = z.object({ label: z.string().trim().min(1).max(40) });

/** Mints a pass. The link is returned exactly once — it can't be shown again later. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolved = await resolveTripRequest(request, (await params).slug, "write", { hostOnly: true });
  if ("response" in resolved) return resolved.response;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Give the pass a short name." }, { status: 400 });

  const { pass, token } = await createTripPass(resolved.trip.id, parsed.data.label);
  return NextResponse.json({ pass: view(pass), url: `${getEnv().PUBLIC_SITE_ORIGIN}/pass/${token}` }, { status: 201 });
}
