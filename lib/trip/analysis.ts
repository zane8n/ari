import type { BudgetCategory, EventStatus, ItineraryEvent } from "@/db/schema";
import { summarizeMoney, type MoneySummary } from "./money";
import type { CheckinView, SerializedBudgetItem, SerializedExpense } from "./types";

export const CATEGORY_ORDER: BudgetCategory[] = ["food", "transport", "activities", "shopping", "accommodation", "other"];

/** The dataviz skill's validated 6-slot categorical palette, in fixed order — never reassigned per-render. */
/** Fixed categorical palette tuned for the dark trip theme — never reassigned per render. */
export const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  food: "#d6b876",
  transport: "#7fa7c9",
  activities: "#8fc4a6",
  shopping: "#d98c75",
  accommodation: "#b59ad6",
  other: "#c9c2b2",
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
/** Fixed status palette — reserved for state, never reused for a series. */
export const STATUS_COLORS: Record<EventStatus, string> = {
  done: "#9ccdab",
  planned: "#6f685b",
  skipped: "#e38c76",
};

export type CategoryBreakdown = { category: BudgetCategory; label: string; estimatedUsd: number; actualUsd: number; color: string };

export type DaySpend = { date: string; label: string; estimatedUsd: number; actualUsd: number; loggedCount: number; itemCount: number };

export type CumulativePoint = { date: string; label: string; cumulativeEstimatedUsd: number; cumulativeActualUsd: number | null };

export type VarianceItem = { id: string; label: string; category: BudgetCategory; estimatedUsd: number; actualUsd: number; varianceUsd: number };

export type CurrencyMix = { currency: string; usdEquivalent: number; count: number };

export type StatusBreakdown = { status: EventStatus; label: string; count: number; color: string };

export type TripAnalysis = {
  money: MoneySummary;
  loggedExpenseCount: number;
  budgetAdherencePct: number | null;
  itineraryCompletionPct: number;
  checkinStreak: number;
  checkinsDone: number;
  eventStatusCounts: StatusBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  daySpend: DaySpend[];
  cumulative: CumulativePoint[];
  variances: VarianceItem[];
  currencyMix: CurrencyMix[];
  healthScore: number;
};

const STATUS_LABELS: Record<EventStatus, string> = { planned: "Planned", done: "Done", skipped: "Skipped" };

/** Chart-ready view of a trip, layered on the money model in ./money so the numbers always agree with the Money view. */
export function analyzeTrip(params: {
  budgetItems: SerializedBudgetItem[];
  expenses: SerializedExpense[];
  events: ItineraryEvent[];
  days: { date: string; label: string }[];
  checkins: CheckinView[];
  trip: { potUsd: number; reserveUsd: number; startDate: string; endDate: string };
  today: string;
}): TripAnalysis {
  const { budgetItems, expenses, events, days, checkins, trip, today } = params;
  const money = summarizeMoney({ ...trip, today, budgetItems, expenses });
  const potExpenses = expenses.filter((e) => e.fund === "pot");
  const planLines = money.items.filter((m) => !m.item.isReserve);

  // Adherence compares estimate vs actual only for one-off lines whose cost is known so far.
  const known = planLines.filter((m) => m.varianceUsd !== null && m.item.kind === "fixed");
  const knownEstimate = known.reduce((sum, m) => sum + m.item.estimatedUsd, 0);
  const knownActual = known.reduce((sum, m) => sum + m.paidUsd, 0);
  const budgetAdherencePct = knownEstimate > 0 ? (knownEstimate / Math.max(knownActual, 0.01)) * 100 : null;

  const categoryBreakdown: CategoryBreakdown[] = money.byCategory.map((row) => ({
    category: row.category,
    label: CATEGORY_LABELS[row.category],
    estimatedUsd: row.plannedUsd,
    actualUsd: row.spentUsd,
    color: CATEGORY_COLORS[row.category],
  }));

  const daySpend: DaySpend[] = days.map((day) => {
    const lines = planLines.filter((m) => m.item.day === day.date);
    const dayExpenses = potExpenses.filter((e) => e.day === day.date);
    return {
      date: day.date,
      label: day.label,
      estimatedUsd: lines.reduce((sum, m) => sum + m.item.estimatedUsd, 0),
      actualUsd: dayExpenses.reduce((sum, e) => sum + e.amountUsd, 0),
      loggedCount: dayExpenses.length,
      itemCount: lines.length,
    };
  });

  let runningEstimate = 0;
  let runningActual = 0;
  const cumulative: CumulativePoint[] = daySpend.map((day) => {
    runningEstimate += day.estimatedUsd;
    runningActual += day.actualUsd;
    return {
      date: day.date,
      label: day.label,
      cumulativeEstimatedUsd: runningEstimate,
      cumulativeActualUsd: day.date <= today ? runningActual : null,
    };
  });

  const variances: VarianceItem[] = planLines
    .filter((m) => m.varianceUsd !== null)
    .map((m) => ({
      id: m.item.id,
      label: m.item.label,
      category: m.item.category,
      estimatedUsd: m.item.estimatedUsd,
      actualUsd: m.paidUsd,
      varianceUsd: m.varianceUsd ?? 0,
    }))
    .sort((a, b) => Math.abs(b.varianceUsd) - Math.abs(a.varianceUsd));

  const currencyTotals = new Map<string, { usd: number; count: number }>();
  for (const e of expenses) {
    const entry = currencyTotals.get(e.currency) ?? { usd: 0, count: 0 };
    entry.usd += e.amountUsd;
    entry.count += 1;
    currencyTotals.set(e.currency, entry);
  }
  const currencyMix: CurrencyMix[] = [...currencyTotals.entries()].map(([currency, v]) => ({ currency, usdEquivalent: v.usd, count: v.count }));

  const statusCounts: Record<EventStatus, number> = { planned: 0, done: 0, skipped: 0 };
  for (const event of events) statusCounts[event.status] += 1;
  const eventStatusCounts: StatusBreakdown[] = (["done", "planned", "skipped"] as EventStatus[]).map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: statusCounts[status],
    color: STATUS_COLORS[status],
  }));
  const itineraryCompletionPct = events.length > 0 ? (statusCounts.done / events.length) * 100 : 0;

  // Consecutive checked-in days, counting back from the most recent elapsed trip day (today may still be pending).
  const checked = new Set(checkins.map((c) => c.day));
  const elapsed = days
    .map((d) => d.date)
    .filter((d) => d <= today)
    .sort()
    .reverse();
  let checkinStreak = 0;
  for (const date of elapsed) {
    if (checked.has(date)) checkinStreak += 1;
    else if (date !== today) break;
  }

  // A deliberately tongue-in-cheek composite: budget discipline, follow-through and the check-in habit.
  const budgetComponent = money.headroomUsd >= 0 ? 100 : Math.max(0, 100 + (money.headroomUsd / Math.max(1, money.potUsd)) * 400);
  const pastDays = elapsed.filter((d) => d < today);
  const checkinComponent = pastDays.length > 0 ? (pastDays.filter((d) => checked.has(d)).length / pastDays.length) * 100 : 100;
  const healthScore = Math.round(budgetComponent * 0.4 + itineraryCompletionPct * 0.3 + checkinComponent * 0.3);

  return {
    money,
    loggedExpenseCount: expenses.length,
    budgetAdherencePct,
    itineraryCompletionPct,
    checkinStreak,
    checkinsDone: checkins.length,
    eventStatusCounts,
    categoryBreakdown,
    daySpend,
    cumulative,
    variances,
    currencyMix,
    healthScore,
  };
}
