import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/config/env";
import {
  HOST_SESSION_COOKIE_NAME,
  HOST_SESSION_MAX_AGE_SECONDS,
  createHostSessionToken,
  verifyHostPassword,
} from "@/lib/server/host-auth";
import { isTrustedPost } from "@/lib/server/requestGuards";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ password: z.string().min(1).max(256) });

export async function POST(request: Request) {
  if (!isTrustedPost(request)) {
    return NextResponse.json({ error: "Rejected." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const valid = verifyHostPassword(parsed.data.password, getEnv().HOST_PASSWORD_HASH);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(HOST_SESSION_COOKIE_NAME, createHostSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: HOST_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
