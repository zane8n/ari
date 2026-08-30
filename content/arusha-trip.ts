import type { BudgetCategory } from "@/db/schema";

/**
 * Type contract for the trip tracker's seed content — deliberately just
 * types. This repo is public; the real destination, dates, accommodation,
 * budget figures and day-by-day itinerary must never land in committed
 * source. The actual data lives in content/arusha-trip.local.ts (gitignored)
 * and is only ever read by scripts/seed-trip.ts, which writes it once into
 * the database — the private, real source of truth from then on. See
 * content/arusha-trip.example.ts for a sanitized example of the shape.
 */

export type TripMeta = {
  destination: string;
  homeBase: string;
  cashBudgetUsd: number;
  reserveBudgetUsd: number;
};

export type TripBudgetSeed = {
  day: string | null;
  category: BudgetCategory;
  label: string;
  estimatedUsd: number;
  notes?: string;
};

export type TripEventSeed = {
  day: string;
  sortOrder: number;
  timeOfDay?: string;
  title: string;
  description?: string;
  location?: string;
};

export type TripDaySeed = {
  date: string;
  label: string;
  mood?: string;
  sortOrder: number;
};
