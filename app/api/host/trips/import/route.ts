import { NextResponse } from "next/server";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { isTrustedPost } from "@/lib/server/requestGuards";
import { seedTrip } from "@/lib/server/seedTrip";
import { tripSeedSchema } from "@/lib/validation/tripSeedSchema";

export const dynamic = "force-dynamic";

/** Host-only: creates a trip from an uploaded plan file. Never overwrites an existing trip. */
export async function POST(request: Request) {
  if (!(await hasValidHostSession())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isTrustedPost(request)) return NextResponse.json({ error: "Rejected." }, { status: 403 });

  const parsed = tripSeedSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: `That file doesn't look like a trip plan (${issue?.path.join(".") || "root"}: ${issue?.message}).` }, { status: 400 });
  }
  const result = await seedTrip(parsed.data);
  if (result.status === "exists") return NextResponse.json({ error: `A trip called "${result.slug}" already exists — nothing was changed.`, slug: result.slug }, { status: 409 });
  return NextResponse.json(result, { status: 201 });
}
