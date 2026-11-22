import "server-only";
import type { TripSeed } from "@/content/trip-seed";
import { getDb } from "@/db/client";
import { writeTripSeed, type SeedResult } from "@/lib/trip/seedWriter";

export type { SeedResult };

export function seedTrip(seed: TripSeed): Promise<SeedResult> {
  return writeTripSeed(getDb(), seed);
}
