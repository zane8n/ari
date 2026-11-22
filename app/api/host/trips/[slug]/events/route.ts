import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { itineraryEvents } from "@/db/schema";
import { resolveTripRequest } from "@/lib/server/tripRoute";
import { createEventSchema } from "@/lib/validation/tripSchemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolved = await resolveTripRequest(request, (await params).slug, "write");
  if ("response" in resolved) return resolved.response;

  const parsed = createEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event." }, { status: 400 });

  const [row] = await getDb()
    .insert(itineraryEvents)
    .values({
      tripId: resolved.trip.id,
      day: parsed.data.day,
      sortOrder: parsed.data.sortOrder ?? 999,
      timeOfDay: parsed.data.timeOfDay ?? null,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      location: parsed.data.location ?? null,
      linkedBudgetItemId: parsed.data.linkedBudgetItemId ?? null,
      isCustom: true,
    })
    .returning();

  return NextResponse.json({ event: row }, { status: 201 });
}
