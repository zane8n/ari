import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { budgetItems, expenses } from "@/db/schema";
import { serializeBudgetItem } from "@/lib/server/trip";
import { resolveTripRequest } from "@/lib/server/tripRoute";

export const dynamic = "force-dynamic";

/** Undo / remove a logged payment. A fixed line left with no payments goes back to open. */
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const resolved = await resolveTripRequest(request, slug, "delete");
  if ("response" in resolved) return resolved.response;
  const db = getDb();

  const [deleted] = await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.tripId, resolved.trip.id)))
    .returning({ id: expenses.id, budgetItemId: expenses.budgetItemId });
  if (!deleted) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let item = null;
  if (deleted.budgetItemId) {
    const [remaining] = await db.select({ id: expenses.id }).from(expenses).where(eq(expenses.budgetItemId, deleted.budgetItemId)).limit(1);
    const [line] = await db.select().from(budgetItems).where(eq(budgetItems.id, deleted.budgetItemId)).limit(1);
    if (line) {
      if (!remaining && line.kind === "fixed" && line.status === "paid") {
        const [reopened] = await db.update(budgetItems).set({ status: "open", updatedAt: new Date() }).where(eq(budgetItems.id, line.id)).returning();
        item = serializeBudgetItem(reopened);
      } else {
        item = serializeBudgetItem(line);
      }
    }
  }

  return NextResponse.json({ ok: true, item });
}
