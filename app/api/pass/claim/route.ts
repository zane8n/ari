import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { trips } from "@/db/schema";
import { isTrustedPost } from "@/lib/server/requestGuards";
import { claimPass, createPassCookieValue, TRIP_PASS_COOKIE_NAME, TRIP_PASS_MAX_AGE_SECONDS } from "@/lib/server/tripAccess";

export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().min(16).max(64) });

/** Burns a one-time pass and binds this device to its trip. */
export async function POST(request: Request) {
  if (!isTrustedPost(request)) return NextResponse.json({ error: "Rejected." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That pass isn't valid." }, { status: 400 });

  const pass = await claimPass(parsed.data.token);
  if (!pass) return NextResponse.json({ error: "This pass has already been used or was withdrawn." }, { status: 410 });
  const [trip] = await getDb().select({ slug: trips.slug }).from(trips).where(eq(trips.id, pass.tripId)).limit(1);

  const response = NextResponse.json({ slug: trip.slug });
  response.cookies.set(TRIP_PASS_COOKIE_NAME, createPassCookieValue(pass.id), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: TRIP_PASS_MAX_AGE_SECONDS,
  });
  return response;
}
