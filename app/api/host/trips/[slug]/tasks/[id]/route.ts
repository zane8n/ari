import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tripTasks } from "@/db/schema";
import { resolveTripRequest } from "@/lib/server/tripRoute";
import { updateTaskSchema } from "@/lib/validation/tripSchemas";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const resolved = await resolveTripRequest(request, slug, "write");
  if ("response" in resolved) return resolved.response;

  const parsed = updateTaskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const [row] = await getDb()
    .update(tripTasks)
    .set({ doneAt: parsed.data.done ? new Date() : null })
    .where(and(eq(tripTasks.id, id), eq(tripTasks.tripId, resolved.trip.id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ task: { ...row, doneAt: row.doneAt ? row.doneAt.toISOString() : null } });
}
