"use client";

import { useMemo } from "react";
import { analyzeTrip } from "@/lib/trip/analysis";
import { CoachChat } from "./CoachChat";
import { CategoryDonut, CumulativeSpendChart, CurrencyMixBars, DaySpendBars, StatusDonut, VarianceList } from "./TripCharts";
import { useTrip } from "./TripContext";
import { CountUp, Reveal, Rise, Stat } from "./ui";

export function InsightsView() {
  const { bundle, today, fmt, api } = useTrip();
  const analysis = useMemo(() => analyzeTrip({ ...bundle, today }), [bundle, today]);
  const score = analysis.healthScore;
  const tone = score >= 75 ? "good" : score >= 50 ? undefined : "warn";

  return (
    <div className="flex flex-col gap-6 pt-4">
      <Rise className="flex flex-col items-center gap-3 text-center">
        <p className="trip-eyebrow">Trip health</p>
        <p className={`trip-num text-[88px] leading-none ${tone === "good" ? "text-[var(--t-good)]" : tone === "warn" ? "text-[var(--t-coral)]" : "text-[var(--t-sea)]"}`}>
          <CountUp value={score} format={(v) => String(Math.round(v))} />
        </p>
        <p className="max-w-xs text-sm leading-relaxed text-[var(--t-muted)]">Budget, follow-through and our evening check-ins, blended into one entirely made-up number.</p>
      </Rise>

      <Rise delay={0.08} className="trip-card grid grid-cols-3 gap-2 px-4 py-6">
        <Stat label="Check-in streak" value={String(analysis.checkinStreak)} tone={analysis.checkinStreak >= 2 ? "good" : undefined} />
        <Stat label="Payments" value={String(analysis.loggedExpenseCount)} />
        <Stat label="Plan done" value={`${analysis.itineraryCompletionPct.toFixed(0)}%`} />
      </Rise>

      <Rise delay={0.14}>
        <CoachChat api={api.coachUrl} />
      </Rise>

      <Reveal label="Charts" className="trip-soft px-5">
        <div className="flex flex-col gap-4 pb-4">
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
        </div>
      </Reveal>
    </div>
  );
}
