import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  budgetItems,
  expenses,
  itineraryEvents,
  tripCheckins,
  tripDays,
  trips,
  tripTasks,
  type BudgetItem,
  type Expense,
  type Trip,
} from "@/db/schema";
import { getEnv } from "@/lib/config/env";
import type { SerializedBudgetItem, SerializedExpense, TripBundle, TripView } from "@/lib/trip/types";

export type { SerializedBudgetItem, SerializedExpense, TripBundle, TripView } from "@/lib/trip/types";

export function serializeBudgetItem(item: BudgetItem): SerializedBudgetItem {
  return {
    ...item,
    estimatedUsd: Number(item.estimatedUsd),
    cutSavingUsd: item.cutSavingUsd === null ? null : Number(item.cutSavingUsd),
  };
}

export function serializeExpense(expense: Expense): SerializedExpense {
  return {
    ...expense,
    amount: Number(expense.amount),
    amountUsd: Number(expense.amountUsd),
    createdAt: expense.createdAt.toISOString(),
  };
}

export function toTripView(trip: Trip): TripView {
  const env = getEnv();
  return {
    id: trip.id,
    slug: trip.slug,
    name: trip.name,
    destination: trip.destination,
    homeBase: trip.homeBase ?? (trip.potUsd === null ? env.TRIP_HOME_BASE : ""),
    startDate: trip.startDate,
    endDate: trip.endDate,
    potUsd: trip.potUsd === null ? env.TRIP_CASH_BUDGET_USD : Number(trip.potUsd),
    reserveUsd: trip.reserveUsd === null ? env.TRIP_RESERVE_BUDGET_USD : Number(trip.reserveUsd),
    spendCurrency: trip.spendCurrency,
    timezone: trip.timezone,
    checkinHour: trip.checkinHour,
    rules: trip.rules,
  };
}

const SLUG_PATTERN = /^[a-z0-9-]{1,40}$/;

export async function findTripBySlug(slug: string): Promise<Trip | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  const [row] = await getDb().select().from(trips).where(eq(trips.slug, slug)).limit(1);
  return row ?? null;
}

export async function listTrips(): Promise<Trip[]> {
  return getDb().select().from(trips).orderBy(asc(trips.startDate));
}

/** Everything the tracker UI and the coach need for one trip, in one round of parallel queries. */
export async function loadTripBundle(trip: Trip): Promise<TripBundle> {
  const db = getDb();
  const [budgetRows, expenseRows, eventRows, dayRows, checkinRows, taskRows] = await Promise.all([
    db.select().from(budgetItems).where(eq(budgetItems.tripId, trip.id)).orderBy(budgetItems.day, budgetItems.createdAt),
    db.select().from(expenses).where(eq(expenses.tripId, trip.id)).orderBy(expenses.createdAt),
    db.select().from(itineraryEvents).where(eq(itineraryEvents.tripId, trip.id)).orderBy(itineraryEvents.day, itineraryEvents.sortOrder),
    db.select().from(tripDays).where(eq(tripDays.tripId, trip.id)).orderBy(tripDays.sortOrder, tripDays.date),
    db.select().from(tripCheckins).where(eq(tripCheckins.tripId, trip.id)),
    db.select().from(tripTasks).where(eq(tripTasks.tripId, trip.id)).orderBy(tripTasks.sortOrder),
  ]);
  return {
    trip: toTripView(trip),
    budgetItems: budgetRows.map(serializeBudgetItem),
    expenses: expenseRows.map(serializeExpense),
    events: eventRows,
    days: dayRows,
    checkins: checkinRows.map((row) => ({ day: row.day, highlight: row.highlight, mood: row.mood, completedAt: row.completedAt.toISOString() })),
    tasks: taskRows.map((row) => ({ ...row, doneAt: row.doneAt ? row.doneAt.toISOString() : null })),
  };
}
