"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Currency, EventStatus, ItineraryEvent } from "@/db/schema";
import { convertFromUsd, FALLBACK_RATES, formatMoney, type ExchangeRates } from "@/lib/currency/convert";
import { minutesInZone, todayInZone } from "@/lib/trip/dates";
import { saveTripTheme } from "@/lib/trip/theme";
import type { ThemeId } from "@/lib/theme/themes";
import { summarizeMoney, type MoneySummary } from "@/lib/trip/money";
import type { CheckinView, SerializedBudgetItem, SerializedExpense, TaskView, TripBundle } from "@/lib/trip/types";
import { createTripApi, ratesApi, type CreateEventInput, type CreateExpenseInput, type TripApi, type UpdateBudgetItemInput, type UpdateEventInput } from "./tripApi";

export type Toast = { id: number; message: string; tone?: "default" | "warn"; undo?: () => Promise<void> };

export type LogRequest = { budgetItemId?: string | null; day?: string | null; amountUsd?: number };

type TripStore = {
  bundle: TripBundle;
  /** Host (full control) vs a guest on a one-time pass (everything except managing access). */
  isHost: boolean;
  /** This device's palette — each person picks their own. */
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  api: TripApi;
  today: string;
  minutesNow: number;
  rates: ExchangeRates;
  ratesFetchedAt: string | null;
  currency: Currency;
  currencies: Currency[];
  setCurrency: (c: Currency) => void;
  money: MoneySummary;
  /** USD → the selected display currency, formatted. */
  fmt: (usd: number) => string;
  /** USD → a given currency, formatted. */
  fmtIn: (usd: number, currency: Currency) => string;
  toast: Toast | null;
  showToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: () => void;
  reportError: (err: unknown) => void;
  openLog: (request?: LogRequest) => void;
  logRequest: LogRequest | null;
  closeLog: () => void;
  openCheckin: (day: string) => void;
  checkinDay: string | null;
  closeCheckin: () => void;
  logExpense: (input: CreateExpenseInput, options?: { quiet?: boolean }) => Promise<SerializedExpense | null>;
  removeExpense: (id: string) => Promise<void>;
  updateItem: (id: string, patch: UpdateBudgetItemInput) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  addItem: (input: Parameters<TripApi["budget"]["create"]>[0]) => Promise<void>;
  setEventStatus: (event: ItineraryEvent, status: EventStatus, options?: { promptCost?: boolean }) => Promise<void>;
  updateEvent: (id: string, patch: UpdateEventInput) => Promise<void>;
  addEvent: (input: CreateEventInput) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  saveCheckin: (input: { day: string; highlight?: string | null; mood?: number | null }) => Promise<CheckinView | null>;
  setTaskDone: (task: TaskView, done: boolean) => Promise<void>;
};

const TripContext = createContext<TripStore | null>(null);

function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function useTrip(): TripStore {
  const store = useContext(TripContext);
  if (!store) throw new Error("useTrip must be used inside <TripProvider>.");
  return store;
}

function upsert<T extends { id: string }>(list: T[], row: T): T[] {
  return list.some((x) => x.id === row.id) ? list.map((x) => (x.id === row.id ? row : x)) : [...list, row];
}

export function TripProvider({ initial, isHost, themeId: initialTheme, children }: { initial: TripBundle; isHost: boolean; themeId: ThemeId; children: React.ReactNode }) {
  const [themeId, setThemeState] = useState<ThemeId>(initialTheme);
  const setThemeId = useCallback((id: ThemeId) => {
    setThemeState(id);
    saveTripTheme(id);
  }, []);
  const [bundle, setBundle] = useState(initial);
  const { trip } = bundle;
  const api = useMemo(() => createTripApi(trip.slug), [trip.slug]);

  const [clock, setClock] = useState(() => ({ today: todayInZone(trip.timezone), minutesNow: minutesInZone(trip.timezone) }));
  useEffect(() => {
    const tick = () => setClock({ today: todayInZone(trip.timezone), minutesNow: minutesInZone(trip.timezone) });
    const id = window.setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [trip.timezone]);

  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES);
  const [ratesFetchedAt, setRatesFetchedAt] = useState<string | null>(null);
  useEffect(() => {
    ratesApi
      .get()
      .then((data) => {
        setRates(data.rates);
        setRatesFetchedAt(data.fetchedAt);
      })
      .catch(() => {
        // Planning rates stay in place — the server freezes its own rate at log time anyway.
      });
  }, []);

  const currencies = useMemo<Currency[]>(() => (trip.spendCurrency === "USD" ? ["USD"] : [trip.spendCurrency, "USD"]), [trip.spendCurrency]);
  const storageKey = `trip:${trip.slug}:currency`;
  // The chosen display currency is a per-device preference; read through useSyncExternalStore so SSR renders the trip default.
  const saved = useSyncExternalStore(subscribeToStorage, () => readStorage(storageKey), () => null);
  const currency: Currency = saved && currencies.includes(saved as Currency) ? (saved as Currency) : trip.spendCurrency;
  const setCurrency = useCallback(
    (value: Currency) => {
      try {
        window.localStorage.setItem(storageKey, value);
        window.dispatchEvent(new StorageEvent("storage", { key: storageKey }));
      } catch {
        // Non-essential preference (storage can be unavailable in private mode).
      }
    },
    [storageKey],
  );

  const fmtIn = useCallback((usd: number, c: Currency) => formatMoney(convertFromUsd(usd, c, rates), c), [rates]);
  const fmt = useCallback((usd: number) => fmtIn(usd, currency), [fmtIn, currency]);

  const money = useMemo(
    () =>
      summarizeMoney({
        potUsd: trip.potUsd,
        reserveUsd: trip.reserveUsd,
        startDate: trip.startDate,
        endDate: trip.endDate,
        today: clock.today,
        budgetItems: bundle.budgetItems,
        expenses: bundle.expenses,
      }),
    [trip, clock.today, bundle.budgetItems, bundle.expenses],
  );

  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | null>(null);
  const showToast = useCallback((next: Omit<Toast, "id">) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ ...next, id: Date.now() });
    toastTimer.current = window.setTimeout(() => setToast(null), next.undo ? 6000 : 3500);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);
  const reportError = useCallback(
    (err: unknown) => showToast({ message: err instanceof Error ? err.message : "Something went wrong — try again.", tone: "warn" }),
    [showToast],
  );

  const [logRequest, setLogRequest] = useState<LogRequest | null>(null);
  const [checkinDay, setCheckinDay] = useState<string | null>(null);

  const mergeItem = useCallback((item: SerializedBudgetItem | null) => {
    if (!item) return;
    setBundle((b) => ({ ...b, budgetItems: upsert(b.budgetItems, item) }));
  }, []);

  const removeExpense = useCallback(
    async (id: string) => {
      try {
        const { item } = await api.expenses.remove(id);
        setBundle((b) => ({ ...b, expenses: b.expenses.filter((e) => e.id !== id) }));
        mergeItem(item);
      } catch (err) {
        reportError(err);
      }
    },
    [api, mergeItem, reportError],
  );

  const logExpense = useCallback(
    async (input: CreateExpenseInput, options?: { quiet?: boolean }) => {
      try {
        const { expense, item } = await api.expenses.create(input);
        setBundle((b) => ({ ...b, expenses: [...b.expenses, expense] }));
        mergeItem(item);
        if (!options?.quiet) {
          showToast({
            message: `Logged ${formatMoney(expense.amount, expense.currency)} · ${expense.label}`,
            undo: () => removeExpense(expense.id),
          });
        }
        return expense;
      } catch (err) {
        reportError(err);
        return null;
      }
    },
    [api, mergeItem, removeExpense, reportError, showToast],
  );

  const updateItem = useCallback(
    async (id: string, patch: UpdateBudgetItemInput) => {
      try {
        mergeItem(await api.budget.update(id, patch));
      } catch (err) {
        reportError(err);
      }
    },
    [api, mergeItem, reportError],
  );

  const removeItem = useCallback(
    async (id: string) => {
      try {
        await api.budget.remove(id);
        setBundle((b) => ({
          ...b,
          budgetItems: b.budgetItems.filter((i) => i.id !== id),
          expenses: b.expenses.map((e) => (e.budgetItemId === id ? { ...e, budgetItemId: null } : e)),
        }));
      } catch (err) {
        reportError(err);
      }
    },
    [api, reportError],
  );

  const addItem = useCallback(
    async (input: Parameters<TripApi["budget"]["create"]>[0]) => {
      try {
        mergeItem(await api.budget.create(input));
      } catch (err) {
        reportError(err);
      }
    },
    [api, mergeItem, reportError],
  );

  const updateEvent = useCallback(
    async (id: string, patch: UpdateEventInput) => {
      try {
        const { event, item } = await api.events.update(id, patch);
        setBundle((b) => ({ ...b, events: upsert(b.events, event) }));
        mergeItem(item);
      } catch (err) {
        reportError(err);
      }
    },
    [api, mergeItem, reportError],
  );

  const setEventStatus = useCallback(
    async (event: ItineraryEvent, status: EventStatus, options?: { promptCost?: boolean }) => {
      try {
        const res = await api.events.update(event.id, { status });
        setBundle((b) => ({ ...b, events: upsert(b.events, res.event) }));
        mergeItem(res.item);
        const line = res.item;
        if (status === "skipped" && line?.status === "dropped") {
          showToast({ message: `Skipped — ${fmt(line.estimatedUsd)} freed up`, undo: () => updateEvent(event.id, { status: "planned" }) });
        } else if (status === "done" && options?.promptCost !== false && line && line.status === "open" && line.kind === "fixed") {
          // Done with a cost still unlogged: go straight to "what did it cost?"
          setLogRequest({ budgetItemId: line.id, day: event.day });
        }
      } catch (err) {
        reportError(err);
      }
    },
    [api, fmt, mergeItem, reportError, showToast, updateEvent],
  );

  const addEvent = useCallback(
    async (input: CreateEventInput) => {
      try {
        const event = await api.events.create(input);
        setBundle((b) => ({ ...b, events: [...b.events, event] }));
      } catch (err) {
        reportError(err);
      }
    },
    [api, reportError],
  );

  const removeEvent = useCallback(
    async (id: string) => {
      try {
        await api.events.remove(id);
        setBundle((b) => ({ ...b, events: b.events.filter((e) => e.id !== id) }));
      } catch (err) {
        reportError(err);
      }
    },
    [api, reportError],
  );

  const saveCheckin = useCallback(
    async (input: { day: string; highlight?: string | null; mood?: number | null }) => {
      try {
        const checkin = await api.checkins.save(input);
        setBundle((b) => ({ ...b, checkins: [...b.checkins.filter((c) => c.day !== checkin.day), checkin] }));
        return checkin;
      } catch (err) {
        reportError(err);
        return null;
      }
    },
    [api, reportError],
  );

  const setTaskDone = useCallback(
    async (task: TaskView, done: boolean) => {
      // Optimistic: a checklist tick should feel instant.
      setBundle((b) => ({ ...b, tasks: b.tasks.map((t) => (t.id === task.id ? { ...t, doneAt: done ? new Date().toISOString() : null } : t)) }));
      try {
        const saved = await api.tasks.setDone(task.id, done);
        setBundle((b) => ({ ...b, tasks: upsert(b.tasks, saved) }));
      } catch (err) {
        setBundle((b) => ({ ...b, tasks: upsert(b.tasks, task) }));
        reportError(err);
      }
    },
    [api, reportError],
  );

  const value: TripStore = {
    bundle,
    isHost,
    themeId,
    setThemeId,
    api,
    today: clock.today,
    minutesNow: clock.minutesNow,
    rates,
    ratesFetchedAt,
    currency,
    currencies,
    setCurrency,
    money,
    fmt,
    fmtIn,
    toast,
    showToast,
    dismissToast,
    reportError,
    openLog: (request) => setLogRequest(request ?? {}),
    logRequest,
    closeLog: () => setLogRequest(null),
    openCheckin: setCheckinDay,
    checkinDay,
    closeCheckin: () => setCheckinDay(null),
    logExpense,
    removeExpense,
    updateItem,
    removeItem,
    addItem,
    setEventStatus,
    updateEvent,
    addEvent,
    removeEvent,
    saveCheckin,
    setTaskDone,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
