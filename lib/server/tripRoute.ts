import "server-only";
import { NextResponse } from "next/server";
import type { Trip } from "@/db/schema";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { isTrustedPost } from "@/lib/server/requestGuards";
import { findTripBySlug } from "@/lib/server/trip";

/**
 * The shared guard for every /api/host/trips/[slug]/* route: host session,
 * then (for writes) the origin/content-type check, then the trip itself.
 * Returns the trip, or the error response to send as-is.
 */
export async function resolveTripRequest(
  request: Request,
  slug: string,
  mode: "read" | "write" | "delete",
): Promise<{ trip: Trip } | { response: NextResponse }> {
  if (!(await hasValidHostSession())) {
    return { response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  if (mode !== "read" && !isTrustedPost(request, mode === "delete" ? null : "application/json")) {
    return { response: NextResponse.json({ error: "Rejected." }, { status: 403 }) };
  }
  const trip = await findTripBySlug(slug);
  if (!trip) return { response: NextResponse.json({ error: "Trip not found." }, { status: 404 }) };
  return { trip };
}
