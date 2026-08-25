import { NextResponse } from "next/server";
import { getEnv } from "@/lib/config/env";
import { sealInvite } from "@/lib/server/invites";
import { isTrustedPost } from "@/lib/server/requestGuards";
import type { RevealData } from "@/lib/reveal/types";
import { MAX_SEAL_BODY_BYTES, sealSubmissionSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!isTrustedPost(request)) {
    return NextResponse.json({ error: "Rejected." }, { status: 403 });
  }

  const { token } = await params;

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_SEAL_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = sealSubmissionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const outcome = await sealInvite({
    token,
    idempotencyKey: parsed.data.idempotencyKey,
    payload: parsed.data.payload,
  });

  if (outcome.kind === "notFound") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (outcome.kind === "revoked") {
    return NextResponse.json({ error: "Unavailable." }, { status: 410 });
  }
  if (outcome.kind === "conflict") {
    return NextResponse.json({ error: "This invite has already been sealed." }, { status: 409 });
  }

  const env = getEnv();
  const reveal: RevealData = {
    destination: env.VACATION_DESTINATION,
    startIso: env.VACATION_START,
    endIso: env.VACATION_END,
    note: env.FINAL_PRIVATE_NOTE,
  };

  return NextResponse.json({ sealedAt: outcome.sealedAt, reveal });
}
