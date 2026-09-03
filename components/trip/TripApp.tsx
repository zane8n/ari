"use client";

import { useEffect, useMemo, useState } from "react";
import type { Currency, ItineraryEvent, TripDay } from "@/db/schema";
import type { SerializedBudgetItem } from "@/lib/server/trip";
import { convertFromUsd, formatMoney, type ExchangeRates } from "@/lib/currency/convert";
import { ratesApi } from "./tripApi";
import { BudgetTab } from "./BudgetTab";
import { InsightsTab } from "./InsightsTab";
import { ItineraryTab } from "./ItineraryTab";

const CURRENCIES: Currency[] = ["USD", "KES", "TZS"];
const FALLBACK_RATES: ExchangeRates = { USD: 1, KES: 129, TZS: 2645 };

function formatTripDates(days: TripDay[]): string {
  if (days.length === 0) return "";
  const dates = days.map((d) => d.date).sort();
  const start = new Date(`${dates[0]}T00:00:00Z`);
  const end = new Date(`${dates[dates.length - 1]}T00:00:00Z`);
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt.format(start)} – ${fmt.format(end)}, ${end.getUTCFullYear()}`;
}

export function TripApp({
  initialBudgetItems,
  initialEvents,
  tripDays,
  meta,
}: {
  initialBudgetItems: SerializedBudgetItem[];
  initialEvents: ItineraryEvent[];
  tripDays: TripDay[];
  meta: { destination: string; homeBase: string; cashBudgetUsd: number; reserveBudgetUsd: number };
}) {
  const [tab, setTab] = useState<"itinerary" | "budget" | "insights">("itinerary");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES);
  const [ratesFetchedAt, setRatesFetchedAt] = useState<string | null>(null);
  const [budgetItems, setBudgetItems] = useState(initialBudgetItems);
  const [events, setEvents] = useState(initialEvents);
  const [globalError, setGlobalError] = useState<string | null>(null);

  function reportError(err: unknown): void {
    setGlobalError(err instanceof Error ? err.message : "Something went wrong — try again.");
  }

  useEffect(() => {
    ratesApi
      .get()
      .then((data) => {
        setRates(data.rates);
        setRatesFetchedAt(data.fetchedAt);
      })
      .catch(() => {
        // Fallback rates (roughly matching the trip doc's own planning numbers) stay in place.
      });
  }, []);

  const summary = useMemo(() => {
    const planned = budgetItems.filter((item) => !item.isReserve);
    const reserve = budgetItems.filter((item) => item.isReserve);
    const spent = planned.reduce((total, item) => total + (item.actualUsd ?? 0), 0);
    const estimated = planned.reduce((total, item) => total + item.estimatedUsd, 0);
    const reserveSpent = reserve.reduce((total, item) => total + (item.actualUsd ?? 0), 0);
    return {
      estimated,
      spent,
      remaining: estimated - spent,
      reserveRemaining: meta.reserveBudgetUsd - reserveSpent,
    };
  }, [budgetItems, meta]);

  function money(usd: number): string {
    return formatMoney(convertFromUsd(usd, currency, rates), currency);
  }

  return (
    <main className="mx-auto flex min-h-[100svh] max-w-3xl flex-col gap-6 px-5 py-8 text-ink" style={{ background: "var(--canvas)" }}>
      <header className="flex flex-col gap-2">
        <a href="/host" className="text-xs text-ink-muted underline">
          ← Host view
        </a>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl text-ink">Trip tracker</h1>
            <p className="text-sm text-ink-muted">
              {meta.destination} · {formatTripDates(tripDays)} · {meta.homeBase}
            </p>
          </div>
          <div className="flex shrink-0 gap-0.5 rounded-lg bg-black/5 p-1">
            {CURRENCIES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCurrency(value)}
                className={`min-w-11 rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                  currency === value ? "bg-white text-ink shadow-sm" : "text-ink-muted"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        {ratesFetchedAt && <p className="text-right text-[11px] text-ink-muted">Rates updated {new Date(ratesFetchedAt).toLocaleDateString()}</p>}
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Estimated" value={money(summary.estimated)} />
        <SummaryTile label="Spent so far" value={money(summary.spent)} />
        <SummaryTile label="Cash remaining" value={money(summary.remaining)} emphasis={summary.remaining < 0} />
        <SummaryTile label="Reserve remaining" value={money(summary.reserveRemaining)} emphasis={summary.reserveRemaining < 0} />
      </section>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/5 p-1">
        {(["itinerary", "budget", "insights"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-md py-2.5 text-sm font-medium capitalize transition-colors ${
              tab === value ? "bg-white text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {globalError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>{globalError}</span>
          <button type="button" onClick={() => setGlobalError(null)} className="shrink-0 text-red-700 hover:text-red-900">
            ✕
          </button>
        </div>
      )}

      {tab === "itinerary" && (
        <ItineraryTab events={events} setEvents={setEvents} budgetItems={budgetItems} money={money} onError={reportError} tripDays={tripDays} />
      )}
      {tab === "budget" && (
        <BudgetTab
          budgetItems={budgetItems}
          setBudgetItems={setBudgetItems}
          currency={currency}
          rates={rates}
          money={money}
          onError={reportError}
          tripDays={tripDays}
        />
      )}
      {tab === "insights" && <InsightsTab budgetItems={budgetItems} events={events} tripDays={tripDays} meta={meta} money={money} />}
    </main>
  );
}

function SummaryTile({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white px-3 py-3">
      <p className="text-[11px] tracking-wide text-ink-muted uppercase">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${emphasis ? "text-red-600" : "text-ink"}`}>{value}</p>
    </div>
  );
}
