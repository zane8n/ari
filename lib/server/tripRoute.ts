import "server-only";
import { NextResponse } from "next/server";
import type { Trip } from "@/db/schema";
import { hasValidHostSession } from "@/lib/server/host-auth";
import { isTrustedPost } from "@/lib/server/requestGuards";
import { findTripBySlug } from "@/lib/server/trip";
import { getTripAccess, type TripAccess } from "@/lib/server/tripAccess";

/**
 * The shared guard for every /api/host/trips/[slug]/* route: origin check
 * for writes, then access — the host, or a guest holding a valid pass for
 * this exact trip. `hostOnly` routes (managing passes) refuse guests.
 * Unknown trips look the same as forbidden ones to anyone but the host.
 */
export async function resolveTripRequest(
  request: Request,
  slug: string,
  mode: "read" | "write" | "delete",
  options: { hostOnly?: boolean } = {},
): Promise<{ trip: Trip; access: TripAccess } | { response: NextResponse }> {
  if (mode !== "read" && !isTrustedPost(request, mode === "delete" ? null : "application/json")) {
    return { response: NextResponse.json({ error: "Rejected." }, { status: 403 }) };
  }
  const trip = await findTripBySlug(slug);
  const access = trip ? await getTripAccess(trip) : (await hasValidHostSession()) ? "host" : null;
  if (!access) return { response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  if (!trip) return { response: NextResponse.json({ error: "Trip not found." }, { status: 404 }) };
  if (options.hostOnly && access !== "host") return { response: NextResponse.json({ error: "Only the host can do that." }, { status: 403 }) };
  return { trip, access };
}
