import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { budgetItems } from "@/db/schema";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { isTrustedPost } from "@/lib/server/requestGuards";
import { serializeBudgetItem } from "@/lib/server/trip";
import { createBudgetItemSchema } from "@/lib/validation/tripSchemas";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasValidHostSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const db = getDb();
  const rows = await db.select().from(budgetItems).orderBy(budgetItems.day, budgetItems.createdAt);
  return NextResponse.json({ items: rows.map(serializeBudgetItem) });
}

export async function POST(request: Request) {
  if (!(await hasValidHostSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isTrustedPost(request)) {
    return NextResponse.json({ error: "Rejected." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createBudgetItemSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid budget item." }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .insert(budgetItems)
    .values({
      category: parsed.data.category,
      label: parsed.data.label,
      day: parsed.data.day ?? null,
      estimatedUsd: parsed.data.estimatedUsd.toFixed(2),
      notes: parsed.data.notes ?? null,
      isReserve: parsed.data.isReserve ?? false,
      isCustom: true,
    })
    .returning();

  return NextResponse.json({ item: serializeBudgetItem(row) }, { status: 201 });
}
