"use client";

import { useMemo } from "react";
import { analyzeTrip } from "@/lib/trip/analysis";
import { CoachChat } from "./CoachChat";
import { CategoryDonut, CumulativeSpendChart, CurrencyMixBars, DaySpendBars, StatusDonut, VarianceList } from "./TripCharts";
import { useTrip } from "./TripContext";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className="trip-card px-3 py-3">
      <p className="trip-eyebrow">{label}</p>
      <p className={`trip-num mt-1 text-2xl leading-none ${tone === "good" ? "text-[var(--t-good)]" : tone === "warn" ? "text-[var(--t-coral)]" : ""}`}>{value}</p>
    </div>
  );
}

export function InsightsView() {
  const { bundle, today, fmt, api } = useTrip();
  const analysis = useMemo(() => analyzeTrip({ ...bundle, today }), [bundle, today]);
  const score = analysis.healthScore;
  const tone = score >= 75 ? "good" : score >= 50 ? undefined : "warn";

  return (
    <div className="flex flex-col gap-5">
      <div className="trip-card px-5 py-5 text-center">
        <p className="trip-eyebrow">Trip health score</p>
        <p className={`trip-num mt-1 text-6xl leading-none ${tone === "good" ? "text-[var(--t-good)]" : tone === "warn" ? "text-[var(--t-coral)]" : ""}`}>
          {score}
          <span className="text-2xl text-[var(--t-muted)]">/100</span>
        </p>
        <p className="mt-2 text-xs text-[var(--t-muted)]">Budget fit, follow-through and the check-in habit, blended. An entirely made-up metric, deployed with total confidence.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Check-in streak" value={`${analysis.checkinStreak} ${analysis.checkinStreak === 1 ? "day" : "days"}`} tone={analysis.checkinStreak >= 2 ? "good" : undefined} />
        <Stat label="Payments logged" value={String(analysis.loggedExpenseCount)} />
        <Stat label="Plan done" value={`${analysis.itineraryCompletionPct.toFixed(0)}%`} />
        <Stat label="Forecast vs pot" value={`${analysis.money.headroomUsd >= 0 ? "−" : "+"}${fmt(Math.abs(analysis.money.headroomUsd))}`} tone={analysis.money.headroomUsd >= 0 ? "good" : "warn"} />
      </div>

      <CumulativeSpendChart data={analysis.cumulative} money={fmt} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategoryDonut data={analysis.categoryBreakdown} money={fmt} />
        <StatusDonut data={analysis.eventStatusCounts} />
      </div>
      <DaySpendBars data={analysis.daySpend} money={fmt} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VarianceList variances={analysis.variances} money={fmt} />
        <CurrencyMixBars data={analysis.currencyMix} />
      </div>
      <CoachChat api={api.coachUrl} />
    </div>
  );
}
