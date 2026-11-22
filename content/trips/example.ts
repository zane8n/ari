import type { TripSeed } from "../trip-seed";

/**
 * Copy to content/trips/<slug>.local.ts (gitignored), fill in the real plan,
 * then run `pnpm seed:trip <slug>`. Intentionally fictional.
 */
export const TRIP: TripSeed = {
  trip: {
    slug: "example",
    name: "Example",
    destination: "Example Coast",
    homeBase: "Example Stay",
    startDate: "2026-01-01",
    endDate: "2026-01-02",
    potUsd: 100,
    reserveUsd: 50,
    spendCurrency: "KES",
    checkinHour: 21,
    rules: ["Prices are caps until confirmed."],
  },
  days: [
    { date: "2026-01-01", label: "Arrive", pace: "Very light", info: { sunrise: "06:00", sunset: "18:20", lowTides: ["10:00"], rainRisk: "Low" } },
    { date: "2026-01-02", label: "Head home", pace: "Very light" },
  ],
  budget: [
    { key: "rides", day: null, category: "transport", kind: "running", label: "Tuk-tuks", estimatedUsd: 20 },
    { key: "dinner", day: "2026-01-01", category: "food", label: "Dinner out", estimatedUsd: 40, cutRank: 1, cutNote: "Cook at home instead", cutSavingUsd: 30 },
  ],
  events: [{ day: "2026-01-01", timeOfDay: "19:00", title: "Dinner out", location: "Somewhere nice", phone: "+254700000000", budgetKey: "dinner" }],
  tasks: [{ phase: "before", title: "Book dinner", dueDay: "2025-12-28" }],
};
