import type { TripBudgetSeed, TripDaySeed, TripEventSeed, TripMeta } from "./arusha-trip";

/**
 * Copy this file to arusha-trip.local.ts (gitignored) and fill in the real
 * plan. This example file is intentionally fictional — see arusha-trip.ts
 * for the full contract this shape has to satisfy.
 */

export const TRIP_META: TripMeta = {
  destination: "Example City, Country",
  homeBase: "Example Stay",
  cashBudgetUsd: 0,
  reserveBudgetUsd: 0,
};

export const TRIP_BUDGET_SEED: TripBudgetSeed[] = [
  { day: "2026-01-01", category: "food", label: "Example budget line", estimatedUsd: 0, notes: "Optional note." },
];

export const TRIP_EVENTS_SEED: TripEventSeed[] = [
  { day: "2026-01-01", sortOrder: 0, timeOfDay: "Morning", title: "Example activity", description: "Optional details.", location: "Optional location" },
];

export const TRIP_DAYS_SEED: TripDaySeed[] = [
  { date: "2026-01-01", label: "Example day", mood: "Optional mood", sortOrder: 0 },
];
