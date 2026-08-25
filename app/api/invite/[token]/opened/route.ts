import { NextResponse } from "next/server";
import { findInviteByToken, markOpened } from "@/lib/server/invites";
import { isTrustedPost } from "@/lib/server/requestGuards";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!isTrustedPost(request, null)) {
    return NextResponse.json({ error: "Rejected." }, { status: 403 });
  }

  const { token } = await params;
  const invite = await findInviteByToken(token);
  if (invite) {
    await markOpened(invite.publicId);
  }

  // Same response whether or not the invite exists — never confirms token validity.
  return NextResponse.json({ ok: true });
}
