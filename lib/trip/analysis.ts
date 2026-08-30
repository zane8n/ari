import type { BudgetCategory, EventStatus, ItineraryEvent } from "@/db/schema";
import type { SerializedBudgetItem } from "@/lib/server/trip";

export const CATEGORY_ORDER: BudgetCategory[] = ["food", "transport", "activities", "shopping", "accommodation", "other"];

/** The dataviz skill's validated 6-slot categorical palette, in fixed order — never reassigned per-render. */
export const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  food: "#2a78d6",
  transport: "#eb6834",
  activities: "#1baf7a",
  shopping: "#eda100",
  accommodation: "#e87ba4",
  other: "#008300",
};

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  food: "Food",
  transport: "Transport",
  activities: "Activities",
  shopping: "Shopping",
  accommodation: "Accommodation",
  other: "Other",
};

/** The dataviz skill's fixed status palette — reserved for state, never reused for a series. */
export const STATUS_COLORS: Record<EventStatus, string> = {
  done: "#0ca30c",
  planned: "#898781",
  skipped: "#d03b3b",
};

export type CategoryBreakdown = { category: BudgetCategory; label: string; estimatedUsd: number; actualUsd: number; color: string };

export type DaySpend = { date: string; label: string; estimatedUsd: number; actualUsd: number; loggedCount: number; itemCount: number };

export type CumulativePoint = { date: string; label: string; cumulativeEstimatedUsd: number; cumulativeActualUsd: number | null };

export type VarianceItem = { id: string; label: string; category: BudgetCategory; estimatedUsd: number; actualUsd: number; varianceUsd: number };

export type CurrencyMix = { currency: string; usdEquivalent: number; count: number };

export type StatusBreakdown = { status: EventStatus; label: string; count: number; color: string };

export type TripAnalysis = {
  totalEstimatedUsd: number;
  totalActualLoggedUsd: number;
  loggedItemCount: number;
  totalItemCount: number;
  cashBudgetUsd: number;
  cashRemainingUsd: number;
  reserveBudgetUsd: number;
  reserveRemainingUsd: number;
  budgetAdherencePct: number | null;
  itineraryCompletionPct: number;
  eventStatusCounts: StatusBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  daySpend: DaySpend[];
  cumulative: CumulativePoint[];
  variances: VarianceItem[];
  currencyMix: CurrencyMix[];
  healthScore: number;
};

const STATUS_LABELS: Record<EventStatus, string> = { planned: "Planned", done: "Done", skipped: "Skipped" };

export function analyzeTrip(
  budgetItems: SerializedBudgetItem[],
  events: ItineraryEvent[],
  tripDays: { date: string; label: string }[],
  meta: { cashBudgetUsd: number; reserveBudgetUsd: number },
): TripAnalysis {
  const planned = budgetItems.filter((item) => !item.isReserve);
  const reserve = budgetItems.filter((item) => item.isReserve);

  const totalEstimatedUsd = planned.reduce((sum, item) => sum + item.estimatedUsd, 0);
  const loggedItems = planned.filter((item) => item.actualUsd !== null);
  const totalActualLoggedUsd = loggedItems.reduce((sum, item) => sum + (item.actualUsd ?? 0), 0);
  const reserveSpent = reserve.reduce((sum, item) => sum + (item.actualUsd ?? 0), 0);

  // Adherence compares actual vs estimate only for the items actually logged so far —
  // not yet meaningful before anything has been logged.
  const loggedEstimateTotal = loggedItems.reduce((sum, item) => sum + item.estimatedUsd, 0);
  const budgetAdherencePct = loggedEstimateTotal > 0 ? (loggedEstimateTotal / Math.max(totalActualLoggedUsd, 0.01)) * 100 : null;

  const categoryBreakdown: CategoryBreakdown[] = CATEGORY_ORDER.map((category) => {
    const items = planned.filter((item) => item.category === category);
    return {
      category,
      label: CATEGORY_LABELS[category],
      estimatedUsd: items.reduce((sum, item) => sum + item.estimatedUsd, 0),
      actualUsd: items.reduce((sum, item) => sum + (item.actualUsd ?? 0), 0),
      color: CATEGORY_COLORS[category],
    };
  }).filter((row) => row.estimatedUsd > 0 || row.actualUsd > 0);

  const daySpend: DaySpend[] = tripDays.map((day) => {
    const items = planned.filter((item) => item.day === day.date);
    return {
      date: day.date,
      label: day.label,
      estimatedUsd: items.reduce((sum, item) => sum + item.estimatedUsd, 0),
      actualUsd: items.reduce((sum, item) => sum + (item.actualUsd ?? 0), 0),
      loggedCount: items.filter((item) => item.actualUsd !== null).length,
      itemCount: items.length,
    };
  });

  let runningEstimate = 0;
  let runningActual = 0;
  let anyLoggedYet = false;
  const cumulative: CumulativePoint[] = daySpend.map((day) => {
    runningEstimate += day.estimatedUsd;
    if (day.loggedCount > 0) anyLoggedYet = true;
    runningActual += day.actualUsd;
    return {
      date: day.date,
      label: day.label,
      cumulativeEstimatedUsd: runningEstimate,
      cumulativeActualUsd: anyLoggedYet ? runningActual : null,
    };
  });

  const variances: VarianceItem[] = loggedItems
    .map((item) => ({
      id: item.id,
      label: item.label,
      category: item.category,
      estimatedUsd: item.estimatedUsd,
      actualUsd: item.actualUsd ?? 0,
      varianceUsd: (item.actualUsd ?? 0) - item.estimatedUsd,
    }))
    .sort((a, b) => Math.abs(b.varianceUsd) - Math.abs(a.varianceUsd));

  const currencyTotals = new Map<string, { usd: number; count: number }>();
  for (const item of loggedItems) {
    const currency = item.actualCurrency ?? "USD";
    const entry = currencyTotals.get(currency) ?? { usd: 0, count: 0 };
    entry.usd += item.actualUsd ?? 0;
    entry.count += 1;
    currencyTotals.set(currency, entry);
  }
  const currencyMix: CurrencyMix[] = [...currencyTotals.entries()].map(([currency, v]) => ({
    currency,
    usdEquivalent: v.usd,
    count: v.count,
  }));

  const statusCounts: Record<EventStatus, number> = { planned: 0, done: 0, skipped: 0 };
  for (const event of events) statusCounts[event.status] += 1;
  const eventStatusCounts: StatusBreakdown[] = (["done", "planned", "skipped"] as EventStatus[]).map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: statusCounts[status],
    color: STATUS_COLORS[status],
  }));

  const itineraryCompletionPct = events.length > 0 ? (statusCounts.done / events.length) * 100 : 0;

  // A deliberately extra, slightly tongue-in-cheek composite metric — half budget
  // discipline, half itinerary follow-through, clamped to keep it sane if nothing
  // has been logged yet.
  const budgetComponent = budgetAdherencePct !== null ? Math.max(0, Math.min(100, budgetAdherencePct)) : 100;
  const healthScore = Math.round(budgetComponent * 0.5 + itineraryCompletionPct * 0.5);

  return {
    totalEstimatedUsd,
    totalActualLoggedUsd,
    loggedItemCount: loggedItems.length,
    totalItemCount: planned.length,
    cashBudgetUsd: meta.cashBudgetUsd,
    cashRemainingUsd: meta.cashBudgetUsd - totalActualLoggedUsd,
    reserveBudgetUsd: meta.reserveBudgetUsd,
    reserveRemainingUsd: meta.reserveBudgetUsd - reserveSpent,
    budgetAdherencePct,
    itineraryCompletionPct,
    eventStatusCounts,
    categoryBreakdown,
    daySpend,
    cumulative,
    variances,
    currencyMix,
    healthScore,
  };
}
