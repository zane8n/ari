"use client";

import type { BudgetCategory, Currency, EventStatus, ItineraryEvent } from "@/db/schema";
import type { SerializedBudgetItem } from "@/lib/server/trip";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
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
  notes?: string;
  isReserve?: boolean;
};

export type UpdateBudgetItemInput = Partial<{
  label: string;
  category: BudgetCategory;
  day: string | null;
  estimatedUsd: number;
  actualAmount: number | null;
  actualCurrency: Currency | null;
  notes: string | null;
  isReserve: boolean;
}>;

export const budgetApi = {
  create: (input: CreateBudgetItemInput) =>
    request<{ item: SerializedBudgetItem }>("/api/host/trip/budget", { method: "POST", body: JSON.stringify(input) }).then((r) => r.item),
  update: (id: string, input: UpdateBudgetItemInput) =>
    request<{ item: SerializedBudgetItem }>(`/api/host/trip/budget/${id}`, { method: "PATCH", body: JSON.stringify(input) }).then((r) => r.item),
  remove: (id: string) => request<{ ok: true }>(`/api/host/trip/budget/${id}`, { method: "DELETE" }),
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

export const eventsApi = {
  create: (input: CreateEventInput) =>
    request<{ event: ItineraryEvent }>("/api/host/trip/events", { method: "POST", body: JSON.stringify(input) }).then((r) => r.event),
  update: (id: string, input: UpdateEventInput) =>
    request<{ event: ItineraryEvent }>(`/api/host/trip/events/${id}`, { method: "PATCH", body: JSON.stringify(input) }).then((r) => r.event),
  remove: (id: string) => request<{ ok: true }>(`/api/host/trip/events/${id}`, { method: "DELETE" }),
};

export const ratesApi = {
  get: () => request<{ rates: Record<Currency, number>; fetchedAt: string }>("/api/host/trip/rates"),
};
