import type { BudgetCategory, BudgetKind, Currency, TaskPhase, TripDayInfo } from "@/db/schema";

/**
 * Type contract for one trip's seed content — deliberately just types.
 * This repo is public; real destinations' dates, accommodation, budget
 * figures and itineraries must never land in committed source. Each real
 * trip lives in content/trips/<slug>.local.ts (gitignored) and is only ever
 * read by `pnpm seed:trip <slug>`, which writes it once into the database —
 * the private source of truth from then on. See content/trips/example.ts.
 */
export type TripSeed = {
  trip: {
    slug: string;
    name: string;
    destination: string;
    homeBase?: string;
    startDate: string;
    endDate: string;
    potUsd: number;
    reserveUsd: number;
    spendCurrency: Currency;
    timezone?: string;
    checkinHour?: number;
    rules?: string[];
  };
  days: { date: string; label: string; mood?: string; pace?: string; info?: TripDayInfo }[];
  /** `key` is local to the seed file, so events can point at the line they pay for. */
  budget: {
    key: string;
    day: string | null;
    category: BudgetCategory;
    kind?: BudgetKind;
    label: string;
    estimatedUsd: number;
    notes?: string;
    cutRank?: number;
    cutNote?: string;
    cutSavingUsd?: number;
  }[];
  events: {
    day: string;
    timeOfDay?: string;
    title: string;
    description?: string;
    location?: string;
    phone?: string;
    budgetKey?: string;
    isOptional?: boolean;
    isSurprise?: boolean;
  }[];
  tasks: { phase: TaskPhase; title: string; detail?: string; dueDay?: string }[];
};
