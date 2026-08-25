import "server-only";
import { getEnv } from "@/lib/config/env";

function isTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Some browsers omit Origin on same-origin requests.

  try {
    return new URL(origin).origin === new URL(getEnv().PUBLIC_SITE_ORIGIN).origin;
  } catch {
    return false;
  }
}

/**
 * Section 20.1/21: origin + content-type checks for POST routes. Pass
 * `expectedContentType: null` for a body-less POST (e.g. the opened beacon)
 * where there is no Content-Type to check.
 */
export function isTrustedPost(request: Request, expectedContentType: string | null = "application/json"): boolean {
  if (expectedContentType !== null) {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes(expectedContentType)) return false;
  }
  return isTrustedOrigin(request);
}
