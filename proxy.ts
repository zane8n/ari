import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * 'strict-dynamic' is required, not optional — without it, Next's own
 * framework/chunk scripts (loaded dynamically by the one nonce'd bootstrap
 * script) aren't trusted, which breaks hydration itself. Confirmed against
 * node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
 * style-src stays 'unsafe-inline' (not nonce'd) because the theme engine and
 * Motion set extensive style="" attributes at runtime, which nonces don't
 * cover — the guideline's own CSP line anticipates exactly this ("style-src
 * self plus required inline token strategy").
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${IS_DEV ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const PRIVATE_PATH_PREFIXES = ["/for/", "/host", "/api/"];

export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", buildCsp(nonce));

  const { pathname } = request.nextUrl;
  if (PRIVATE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
