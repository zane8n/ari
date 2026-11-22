import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { budgetItems, itineraryEvents } from "@/db/schema";
import { serializeBudgetItem } from "@/lib/server/trip";
import { resolveTripRequest } from "@/lib/server/tripRoute";
import { updateEventSchema } from "@/lib/validation/tripSchemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { slug, id } = await params;
  const resolved = await resolveTripRequest(request, slug, "write");
  if ("response" in resolved) return resolved.response;
  const { trip } = resolved;

  const parsed = updateEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const data = parsed.data;
  const db = getDb();

  const [current] = await db
    .select()
    .from(itineraryEvents)
    .where(and(eq(itineraryEvents.id, id), eq(itineraryEvents.tripId, trip.id)))
    .limit(1);
  if (!current) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Moving an event to a different day is a reschedule — remember where it
  // was first planned (only on the first move, so hopping back and forth
  // doesn't lose the original date).
  const originalDay = data.day !== undefined && data.day !== current.day && !current.originalDay ? current.day : undefined;

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

  // Skipping an activity frees its still-unpaid cost line; un-skipping puts it back.
  let item = null;
  if (data.status !== undefined && row.linkedBudgetItemId) {
    const [line] = await db.select().from(budgetItems).where(eq(budgetItems.id, row.linkedBudgetItemId)).limit(1);
    if (line && line.kind === "fixed") {
      const next = data.status === "skipped" && line.status === "open" ? "dropped" : data.status !== "skipped" && line.status === "dropped" ? "open" : null;
      const [updated] = next
        ? await db.update(budgetItems).set({ status: next, updatedAt: new Date() }).where(eq(budgetItems.id, line.id)).returning()
        : [line];
      item = serializeBudgetItem(updated);
    }
  }

  return NextResponse.json({ event: row, item });
}

export async function DELETE(request: Request, { params }: Params) {
  const { slug, id } = await params;
  const resolved = await resolveTripRequest(request, slug, "delete");
  if ("response" in resolved) return resolved.response;

  const deleted = await getDb()
    .delete(itineraryEvents)
    .where(and(eq(itineraryEvents.id, id), eq(itineraryEvents.tripId, resolved.trip.id)))
    .returning({ id: itineraryEvents.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
