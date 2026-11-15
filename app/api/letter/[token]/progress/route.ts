import { NextResponse } from "next/server";
import { z } from "zod";
import { markLetterFinished, markLetterOpened } from "@/lib/server/letters";
import { isTrustedPost } from "@/lib/server/requestGuards";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ event: z.enum(["opened", "finished"]) });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!isTrustedPost(request)) {
    return NextResponse.json({ error: "Rejected." }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid." }, { status: 400 });
  }

  const { token } = await params;
  if (parsed.data.event === "opened") await markLetterOpened(token);
  else await markLetterFinished(token);

  // Same response whether or not the letter exists — never confirms token validity.
  return NextResponse.json({ ok: true });
}
