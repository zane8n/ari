"use client";

import type { BudgetCategory, BudgetKind, BudgetStatus, Currency, EventStatus, ExpenseFund, ItineraryEvent } from "@/db/schema";
import type { CheckinView, SerializedBudgetItem, SerializedExpense, TaskView } from "@/lib/trip/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export type CreateBudgetItemInput = {
  category: BudgetCategory;
  label: string;
  day?: string | null;
  estimatedUsd: number;
  kind?: BudgetKind;
  notes?: string;
  isReserve?: boolean;
};

export type UpdateBudgetItemInput = Partial<{
  label: string;
  category: BudgetCategory;
  day: string | null;
  estimatedUsd: number;
  kind: BudgetKind;
  status: BudgetStatus;
  cutRank: number | null;
  notes: string | null;
  isReserve: boolean;
}>;

export type CreateExpenseInput = {
  amount: number;
  currency: Currency;
  budgetItemId?: string | null;
  category?: BudgetCategory;
  label?: string;
  day?: string | null;
  fund?: ExpenseFund;
};

export type CreateEventInput = {
  day: string;
  sortOrder?: number;
  timeOfDay?: string;
  title: string;
  description?: string;
  location?: string;
};

export type UpdateEventInput = Partial<{
  day: string;
  sortOrder: number;
  timeOfDay: string | null;
  title: string;
  description: string | null;
  location: string | null;
  status: EventStatus;
  notes: string | null;
}>;

/** Every write is scoped to one trip's slug — /api/host/trips/<slug>/… */
export function createTripApi(slug: string) {
  const base = `/api/host/trips/${encodeURIComponent(slug)}`;
  const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
  return {
    budget: {
      create: (input: CreateBudgetItemInput) => request<{ item: SerializedBudgetItem }>(`${base}/budget`, json("POST", input)).then((r) => r.item),
      update: (id: string, input: UpdateBudgetItemInput) => request<{ item: SerializedBudgetItem }>(`${base}/budget/${id}`, json("PATCH", input)).then((r) => r.item),
      remove: (id: string) => request<{ ok: true }>(`${base}/budget/${id}`, { method: "DELETE" }),
    },
    expenses: {
      create: (input: CreateExpenseInput) => request<{ expense: SerializedExpense; item: SerializedBudgetItem | null }>(`${base}/expenses`, json("POST", input)),
      remove: (id: string) => request<{ ok: true; item: SerializedBudgetItem | null }>(`${base}/expenses/${id}`, { method: "DELETE" }),
    },
    events: {
      create: (input: CreateEventInput) => request<{ event: ItineraryEvent }>(`${base}/events`, json("POST", input)).then((r) => r.event),
      update: (id: string, input: UpdateEventInput) =>
        request<{ event: ItineraryEvent; item: SerializedBudgetItem | null }>(`${base}/events/${id}`, json("PATCH", input)),
      remove: (id: string) => request<{ ok: true }>(`${base}/events/${id}`, { method: "DELETE" }),
    },
    checkins: {
      save: (input: { day: string; highlight?: string | null; mood?: number | null }) =>
        request<{ checkin: CheckinView }>(`${base}/checkins`, json("POST", input)).then((r) => r.checkin),
    },
    tasks: {
      setDone: (id: string, done: boolean) => request<{ task: TaskView }>(`${base}/tasks/${id}`, json("PATCH", { done })).then((r) => r.task),
    },
    coachUrl: `${base}/coach`,
    remindersUrl: `${base}/reminders.ics`,
  };
}

export type TripApi = ReturnType<typeof createTripApi>;

export const ratesApi = {
  get: () => request<{ rates: Record<Currency, number>; fetchedAt: string }>("/api/host/trip/rates"),
};
