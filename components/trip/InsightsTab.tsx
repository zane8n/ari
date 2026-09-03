"use client";

import { useMemo } from "react";
import type { ItineraryEvent, TripDay } from "@/db/schema";
import type { SerializedBudgetItem } from "@/lib/server/trip";
import { analyzeTrip } from "@/lib/trip/analysis";
import { CoachChat } from "./CoachChat";
import { CategoryDonut, CumulativeSpendChart, CurrencyMixBars, DaySpendBars, StatusDonut, VarianceList } from "./TripCharts";

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "good" | "warning" | "critical" }) {
  const toneColor = tone === "good" ? "#0ca30c" : tone === "critical" ? "#d03b3b" : tone === "warning" ? "#c98500" : undefined;
  return (
    <div className="rounded-lg border border-black/10 bg-white px-3 py-3">
      <p className="text-[11px] tracking-wide text-ink-muted uppercase">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums" style={toneColor ? { color: toneColor } : { color: "#0b0b0b" }}>
        {value}
      </p>
    </div>
  );
}

export function InsightsTab({
  budgetItems,
  events,
  tripDays,
  meta,
  money,
}: {
  budgetItems: SerializedBudgetItem[];
  events: ItineraryEvent[];
  tripDays: TripDay[];
  meta: { cashBudgetUsd: number; reserveBudgetUsd: number };
  money: (usd: number) => string;
}) {
  const analysis = useMemo(() => analyzeTrip(budgetItems, events, tripDays, meta), [budgetItems, events, tripDays, meta]);

  const healthTone = analysis.healthScore >= 75 ? "good" : analysis.healthScore >= 50 ? "warning" : "critical";

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-black/10 bg-white px-5 py-5 text-center">
        <p className="text-[11px] tracking-wide text-ink-muted uppercase">Trip health score</p>
        <p
          className="mt-1 text-5xl font-bold tabular-nums"
          style={{ color: healthTone === "good" ? "#0ca30c" : healthTone === "critical" ? "#d03b3b" : "#c98500" }}
        >
          {analysis.healthScore}
          <span className="text-xl text-ink-muted">/100</span>
        </p>
        <p className="mt-1 text-xs text-ink-muted">Half budget adherence, half itinerary follow-through — an entirely made-up metric, deployed with total confidence.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Logged" value={`${analysis.loggedItemCount}/${analysis.totalItemCount}`} />
        <StatTile
          label="Adherence"
          value={analysis.budgetAdherencePct !== null ? `${analysis.budgetAdherencePct.toFixed(0)}%` : "—"}
          tone={analysis.budgetAdherencePct === null ? undefined : analysis.budgetAdherencePct >= 90 ? "good" : analysis.budgetAdherencePct >= 70 ? "warning" : "critical"}
        />
        <StatTile label="Itinerary done" value={`${analysis.itineraryCompletionPct.toFixed(0)}%`} />
        <StatTile
          label="Cash remaining"
          value={money(analysis.cashRemainingUsd)}
          tone={analysis.cashRemainingUsd < 0 ? "critical" : analysis.cashRemainingUsd < analysis.totalEstimatedUsd * 0.15 ? "warning" : "good"}
        />
      </div>

      <CumulativeSpendChart data={analysis.cumulative} money={money} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategoryDonut data={analysis.categoryBreakdown} money={money} />
        <StatusDonut data={analysis.eventStatusCounts} />
      </div>

      <DaySpendBars data={analysis.daySpend} money={money} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VarianceList variances={analysis.variances} money={money} />
        <CurrencyMixBars data={analysis.currencyMix} />
      </div>

      <CoachChat />
    </div>
  );
}
