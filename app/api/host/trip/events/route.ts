import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { itineraryEvents } from "@/db/schema";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { isTrustedPost } from "@/lib/server/requestGuards";
import { createEventSchema } from "@/lib/validation/tripSchemas";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasValidHostSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const db = getDb();
  const rows = await db.select().from(itineraryEvents).orderBy(itineraryEvents.day, itineraryEvents.sortOrder);
  return NextResponse.json({ events: rows });
}

export async function POST(request: Request) {
  if (!(await hasValidHostSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isTrustedPost(request)) {
    return NextResponse.json({ error: "Rejected." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .insert(itineraryEvents)
    .values({
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
