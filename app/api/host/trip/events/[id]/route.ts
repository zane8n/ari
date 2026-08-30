import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { itineraryEvents } from "@/db/schema";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { isTrustedPost } from "@/lib/server/requestGuards";
import { updateEventSchema } from "@/lib/validation/tripSchemas";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidHostSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isTrustedPost(request)) {
    return NextResponse.json({ error: "Rejected." }, { status: 403 });
  }

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }
  const data = parsed.data;

  const db = getDb();

  // Moving an event to a different day is a reschedule — remember where it
  // was first planned (only on the *first* move, so hopping back and forth
  // doesn't lose the original date).
  let originalDay: string | undefined;
  if (data.day !== undefined) {
    const [current] = await db
      .select({ day: itineraryEvents.day, originalDay: itineraryEvents.originalDay })
      .from(itineraryEvents)
      .where(eq(itineraryEvents.id, id))
      .limit(1);
    if (current && current.day !== data.day && !current.originalDay) {
      originalDay = current.day;
    }
  }

  const [row] = await db
    .update(itineraryEvents)
    .set({
      ...(data.day !== undefined ? { day: data.day } : {}),
      ...(originalDay !== undefined ? { originalDay } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.timeOfDay !== undefined ? { timeOfDay: data.timeOfDay } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.linkedBudgetItemId !== undefined ? { linkedBudgetItemId: data.linkedBudgetItemId } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(itineraryEvents.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ event: row });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidHostSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isTrustedPost(request, null)) {
    return NextResponse.json({ error: "Rejected." }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  const deleted = await db.delete(itineraryEvents).where(eq(itineraryEvents.id, id)).returning({ id: itineraryEvents.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
