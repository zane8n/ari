import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { budgetItems } from "@/db/schema";
import { convertToUsd } from "@/lib/currency/convert";
import { fetchExchangeRates } from "@/lib/server/currency";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { isTrustedPost } from "@/lib/server/requestGuards";
import { serializeBudgetItem } from "@/lib/server/trip";
import { updateBudgetItemSchema } from "@/lib/validation/tripSchemas";

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
  const parsed = updateBudgetItemSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }
  const data = parsed.data;

  // The amount someone actually paid is entered in whatever currency they
  // paid in (usually TZS cash) — the USD equivalent is always computed here
  // server-side from the current rate, never trusted from the client.
  let actualUsd: string | null | undefined;
  if (data.actualAmount !== undefined) {
    if (data.actualAmount === null) {
      actualUsd = null;
    } else {
      const currency = data.actualCurrency ?? "USD";
      if (currency === "USD") {
        actualUsd = data.actualAmount.toFixed(2);
      } else {
        try {
          const { rates } = await fetchExchangeRates();
          actualUsd = convertToUsd(data.actualAmount, currency, rates).toFixed(2);
        } catch {
          return NextResponse.json({ error: "Could not reach the exchange rate provider — try again in a moment." }, { status: 502 });
        }
      }
    }
  }

  const db = getDb();
  const [row] = await db
    .update(budgetItems)
    .set({
      ...(data.label !== undefined ? { label: data.label } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.day !== undefined ? { day: data.day } : {}),
      ...(data.estimatedUsd !== undefined ? { estimatedUsd: data.estimatedUsd.toFixed(2) } : {}),
      ...(data.actualAmount !== undefined ? { actualAmount: data.actualAmount === null ? null : data.actualAmount.toFixed(2) } : {}),
      ...(data.actualCurrency !== undefined ? { actualCurrency: data.actualCurrency } : {}),
      ...(actualUsd !== undefined ? { actualUsd } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.isReserve !== undefined ? { isReserve: data.isReserve } : {}),
      updatedAt: new Date(),
    })
    .where(eq(budgetItems.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ item: serializeBudgetItem(row) });
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
  const deleted = await db.delete(budgetItems).where(eq(budgetItems.id, id)).returning({ id: budgetItems.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
