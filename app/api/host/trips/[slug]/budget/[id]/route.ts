import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { budgetItems } from "@/db/schema";
import { serializeBudgetItem } from "@/lib/server/trip";
import { resolveTripRequest } from "@/lib/server/tripRoute";
import { updateBudgetItemSchema } from "@/lib/validation/tripSchemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { slug, id } = await params;
  const resolved = await resolveTripRequest(request, slug, "write");
  if ("response" in resolved) return resolved.response;

  const parsed = updateBudgetItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const data = parsed.data;

  const [row] = await getDb()
    .update(budgetItems)
    .set({
      ...(data.label !== undefined ? { label: data.label } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.day !== undefined ? { day: data.day } : {}),
      ...(data.estimatedUsd !== undefined ? { estimatedUsd: data.estimatedUsd.toFixed(2) } : {}),
      ...(data.kind !== undefined ? { kind: data.kind } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.cutRank !== undefined ? { cutRank: data.cutRank } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.isReserve !== undefined ? { isReserve: data.isReserve } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(budgetItems.id, id), eq(budgetItems.tripId, resolved.trip.id)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ item: serializeBudgetItem(row) });
}

export async function DELETE(request: Request, { params }: Params) {
  const { slug, id } = await params;
  const resolved = await resolveTripRequest(request, slug, "delete");
  if ("response" in resolved) return resolved.response;

  const deleted = await getDb()
    .delete(budgetItems)
    .where(and(eq(budgetItems.id, id), eq(budgetItems.tripId, resolved.trip.id)))
    .returning({ id: budgetItems.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
