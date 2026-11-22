import type { BudgetItem, Currency, Expense, Trip } from "@/db/schema";

/** Postgres NUMERIC columns come back as strings from the driver — every trip type is converted once, centrally, to these. */
export type SerializedBudgetItem = Omit<BudgetItem, "estimatedUsd" | "cutSavingUsd"> & {
  estimatedUsd: number;
  cutSavingUsd: number | null;
};

export type SerializedExpense = Omit<Expense, "amount" | "amountUsd" | "createdAt"> & {
  amount: number;
  amountUsd: number;
  createdAt: string;
};

/** Trip display data with the pot/reserve already resolved (legacy rows fall back to env values server-side). */
export type TripView = {
  id: string;
  slug: string;
  name: string;
  destination: string;
  homeBase: string;
  startDate: string;
  endDate: string;
  potUsd: number;
  reserveUsd: number;
  spendCurrency: Currency;
  timezone: string;
  checkinHour: number;
  rules: string[];
};

export type { Trip };

export type CheckinView = { day: string; highlight: string | null; mood: number | null; completedAt: string };

export type TaskView = Omit<import("@/db/schema").TripTask, "doneAt"> & { doneAt: string | null };

export type TripBundle = {
  trip: TripView;
  budgetItems: SerializedBudgetItem[];
  expenses: SerializedExpense[];
  events: import("@/db/schema").ItineraryEvent[];
  days: import("@/db/schema").TripDay[];
  checkins: CheckinView[];
  tasks: TaskView[];
};
