import type { BudgetCategory, BudgetStatus } from "@/db/schema";
import { daysBetween, tripPhase } from "./dates";
import type { SerializedBudgetItem, SerializedExpense } from "./types";

/**
 * The trip's money model, in one pure function so the header, the Money
 * view, the check-in and the coach can never disagree.
 *
 * - **Pot** — the shared budget agreed before the trip.
 * - **Spent** — every logged expense paid from the pot (reserve spends are tracked apart).
 * - **Still expected** — what the open plan will still cost: an unpaid fixed
 *   line counts at its full estimate; a running line (tuk-tuks, snacks)
 *   counts whatever is left of its estimate. Paid and dropped lines count 0.
 * - **Forecast** — spent + still expected: where the pot lands if the rest goes to plan.
 * - **Headroom** — pot − forecast. Positive is genuinely free money;
 *   negative means the plan no longer fits, and the cut list kicks in.
 *   Overruns are never silently absorbed by the reserve — it stays for emergencies.
 */
export type ItemMoney = {
  item: SerializedBudgetItem;
  paidUsd: number;
  /** What this line still expects to cost (never negative). */
  stillExpectedUsd: number;
  /** paid − estimate, once the line is settled or (for running lines) once anything is logged. Null while nothing is known. */
  varianceUsd: number | null;
};

export type CategoryMoney = { category: BudgetCategory; plannedUsd: number; spentUsd: number; stillExpectedUsd: number };

export type CutStep = { item: SerializedBudgetItem; savingUsd: number; note: string | null; cumulativeUsd: number };

export type MoneySummary = {
  potUsd: number;
  reserveUsd: number;
  plannedUsd: number;
  spentUsd: number;
  leftUsd: number;
  stillExpectedUsd: number;
  forecastUsd: number;
  headroomUsd: number;
  freedUsd: number;
  reserveSpentUsd: number;
  reserveLeftUsd: number;
  todaySpentUsd: number;
  unplannedSpentUsd: number;
  daysLeft: number;
  /** Headroom spread over the days left — what can go on unplanned extras each day without breaking the pot. */
  extrasPerDayUsd: number;
  items: ItemMoney[];
  byCategory: CategoryMoney[];
  cutPlan: CutStep[];
};

const CATEGORY_ORDER: BudgetCategory[] = ["food", "transport", "activities", "shopping", "accommodation", "other"];

export function itemMoney(item: SerializedBudgetItem, linkedExpenses: SerializedExpense[]): ItemMoney {
  const paidUsd = linkedExpenses.reduce((sum, e) => sum + e.amountUsd, 0);
  // Fixed lines flip to "paid" when logged, so for both kinds an open line still expects whatever its estimate hasn't absorbed yet.
  const stillExpectedUsd = !item.isReserve && item.status === "open" ? Math.max(0, item.estimatedUsd - paidUsd) : 0;
  const known = item.status === "paid" || linkedExpenses.length > 0;
  const varianceUsd = known ? paidUsd - item.estimatedUsd : null;
  return { item, paidUsd, stillExpectedUsd, varianceUsd };
}

export function summarizeMoney(params: {
  potUsd: number;
  reserveUsd: number;
  startDate: string;
  endDate: string;
  today: string;
  budgetItems: SerializedBudgetItem[];
  expenses: SerializedExpense[];
}): MoneySummary {
  const { potUsd, reserveUsd, budgetItems, expenses, today } = params;

  const potExpenses = expenses.filter((e) => e.fund === "pot");
  const reserveExpenses = expenses.filter((e) => e.fund === "reserve");

  const byItem = new Map<string, SerializedExpense[]>();
  for (const e of potExpenses) {
    if (!e.budgetItemId) continue;
    const list = byItem.get(e.budgetItemId) ?? [];
    list.push(e);
    byItem.set(e.budgetItemId, list);
  }

  const items = budgetItems.map((item) => itemMoney(item, byItem.get(item.id) ?? []));
  const planLines = items.filter((m) => !m.item.isReserve);
  const knownItemIds = new Set(budgetItems.map((i) => i.id));

  const plannedUsd = planLines.reduce((sum, m) => sum + m.item.estimatedUsd, 0);
  const spentUsd = potExpenses.reduce((sum, e) => sum + e.amountUsd, 0);
  const stillExpectedUsd = planLines.reduce((sum, m) => sum + m.stillExpectedUsd, 0);
  const forecastUsd = spentUsd + stillExpectedUsd;
  const headroomUsd = potUsd - forecastUsd;
  const freedUsd = planLines.filter((m) => m.item.status === "dropped").reduce((sum, m) => sum + Math.max(0, m.item.estimatedUsd - m.paidUsd), 0);
  const reserveSpentUsd = reserveExpenses.reduce((sum, e) => sum + e.amountUsd, 0);
  const todaySpentUsd = potExpenses.filter((e) => e.day === today).reduce((sum, e) => sum + e.amountUsd, 0);
  const unplannedSpentUsd = potExpenses.filter((e) => !e.budgetItemId || !knownItemIds.has(e.budgetItemId)).reduce((sum, e) => sum + e.amountUsd, 0);

  const phase = tripPhase(params.startDate, params.endDate, today);
  const tripLength = daysBetween(params.startDate, params.endDate) + 1;
  const daysLeft = phase === "before" ? tripLength : phase === "during" ? daysBetween(today, params.endDate) + 1 : 0;
  const extrasPerDayUsd = Math.max(0, headroomUsd) / Math.max(1, daysLeft);

  const byCategory: CategoryMoney[] = CATEGORY_ORDER.map((category) => {
    const lines = planLines.filter((m) => m.item.category === category);
    return {
      category,
      plannedUsd: lines.reduce((sum, m) => sum + m.item.estimatedUsd, 0),
      spentUsd: potExpenses.filter((e) => e.category === category).reduce((sum, e) => sum + e.amountUsd, 0),
      stillExpectedUsd: lines.reduce((sum, m) => sum + m.stillExpectedUsd, 0),
    };
  }).filter((row) => row.plannedUsd > 0 || row.spentUsd > 0);

  let cumulative = 0;
  const cutPlan: CutStep[] = planLines
    .filter((m) => m.item.cutRank !== null && m.item.status === "open" && m.paidUsd === 0)
    .sort((a, b) => (a.item.cutRank ?? 0) - (b.item.cutRank ?? 0))
    .map((m) => {
      const savingUsd = m.item.cutSavingUsd ?? m.item.estimatedUsd;
      cumulative += savingUsd;
      return { item: m.item, savingUsd, note: m.item.cutNote, cumulativeUsd: cumulative };
    });

  return {
    potUsd,
    reserveUsd,
    plannedUsd,
    spentUsd,
    leftUsd: potUsd - spentUsd,
    stillExpectedUsd,
    forecastUsd,
    headroomUsd,
    freedUsd,
    reserveSpentUsd,
    reserveLeftUsd: reserveUsd - reserveSpentUsd,
    todaySpentUsd,
    unplannedSpentUsd,
    daysLeft,
    extrasPerDayUsd,
    items,
    byCategory,
    cutPlan,
  };
}

/** Status a budget line should move to after an expense is logged against it. */
export function statusAfterLogging(item: Pick<SerializedBudgetItem, "kind" | "status">): BudgetStatus {
  if (item.kind === "running") return "open";
  return "paid";
}

/**
 * Days whose evening check-in is outstanding: every trip day before today
 * that wasn't checked in, plus today once the check-in hour has passed.
 */
export function pendingCheckins(params: {
  dayDates: string[];
  checkedIn: Set<string>;
  today: string;
  minutesNow: number;
  checkinHour: number;
}): { overdue: string[]; dueToday: boolean } {
  const overdue = params.dayDates.filter((d) => d < params.today && !params.checkedIn.has(d)).sort();
  const isTripDay = params.dayDates.includes(params.today);
  const dueToday = isTripDay && !params.checkedIn.has(params.today) && params.minutesNow >= params.checkinHour * 60;
  return { overdue, dueToday };
}
