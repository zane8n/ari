import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { inviteSessions } from "@/db/schema";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { isTrustedPost } from "@/lib/server/requestGuards";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  if (!(await hasValidHostSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isTrustedPost(request, null)) {
    return NextResponse.json({ error: "Rejected." }, { status: 403 });
  }

  const { publicId } = await params;
  const db = getDb();
  const deleted = await db.delete(inviteSessions).where(eq(inviteSessions.publicId, publicId)).returning({ id: inviteSessions.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
