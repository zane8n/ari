import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { budgetItems } from "@/db/schema";
import { serializeBudgetItem } from "@/lib/server/trip";
import { resolveTripRequest } from "@/lib/server/tripRoute";
import { createBudgetItemSchema } from "@/lib/validation/tripSchemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolved = await resolveTripRequest(request, (await params).slug, "write");
  if ("response" in resolved) return resolved.response;

  const parsed = createBudgetItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid budget item." }, { status: 400 });

  const [row] = await getDb()
    .insert(budgetItems)
    .values({
      tripId: resolved.trip.id,
      category: parsed.data.category,
      label: parsed.data.label,
      day: parsed.data.day ?? null,
      estimatedUsd: parsed.data.estimatedUsd.toFixed(2),
      kind: parsed.data.kind ?? "fixed",
      notes: parsed.data.notes ?? null,
      isReserve: parsed.data.isReserve ?? false,
      isCustom: true,
    })
    .returning();

  return NextResponse.json({ item: serializeBudgetItem(row) }, { status: 201 });
}
