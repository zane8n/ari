import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { budgetItems, expenses } from "@/db/schema";
import { convertToUsd, FALLBACK_RATES } from "@/lib/currency/convert";
import { fetchExchangeRates } from "@/lib/server/currency";
import { serializeBudgetItem, serializeExpense } from "@/lib/server/trip";
import { resolveTripRequest } from "@/lib/server/tripRoute";
import { todayInZone } from "@/lib/trip/dates";
import { statusAfterLogging } from "@/lib/trip/money";
import { createExpenseSchema } from "@/lib/validation/tripSchemas";

export const dynamic = "force-dynamic";

/**
 * Logs one real payment. The USD equivalent is always computed here from
 * the current rate (never trusted from the client) and frozen on the row.
 * If the rate provider is down the planning rate is used instead — a log
 * must never be lost to a rate lookup on a beach with one bar of signal.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolved = await resolveTripRequest(request, (await params).slug, "write");
  if ("response" in resolved) return resolved.response;
  const { trip } = resolved;

  const parsed = createExpenseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid expense." }, { status: 400 });
  const data = parsed.data;
  const db = getDb();

  let linked = null;
  if (data.budgetItemId) {
    [linked] = await db
      .select()
      .from(budgetItems)
      .where(and(eq(budgetItems.id, data.budgetItemId), eq(budgetItems.tripId, trip.id)))
      .limit(1);
    if (!linked) return NextResponse.json({ error: "That budget line no longer exists." }, { status: 404 });
  }

  let rates = FALLBACK_RATES;
  if (data.currency !== "USD") {
    try {
      rates = (await fetchExchangeRates()).rates;
    } catch {
      rates = FALLBACK_RATES;
    }
  }
  const amountUsd = data.currency === "USD" ? data.amount : convertToUsd(data.amount, data.currency, rates);

  const [row] = await db
    .insert(expenses)
    .values({
      tripId: trip.id,
      budgetItemId: linked?.id ?? null,
      day: data.day === undefined ? todayInZone(trip.timezone) : data.day,
      category: linked?.category ?? data.category ?? "other",
      label: data.label ?? linked?.label ?? "Something",
      amount: data.amount.toFixed(2),
      currency: data.currency,
      amountUsd: amountUsd.toFixed(2),
      fund: data.fund ?? (linked?.isReserve ? "reserve" : "pot"),
    })
    .returning();

  let item = null;
  if (linked) {
    const nextStatus = statusAfterLogging(linked);
    if (nextStatus !== linked.status) {
      [linked] = await db.update(budgetItems).set({ status: nextStatus, updatedAt: new Date() }).where(eq(budgetItems.id, linked.id)).returning();
    }
    item = serializeBudgetItem(linked);
  }

  return NextResponse.json({ expense: serializeExpense(row), item }, { status: 201 });
}
