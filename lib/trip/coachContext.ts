import "server-only";
import type { BudgetItem, ItineraryEvent, TripDay } from "@/db/schema";
import { analyzeTrip } from "@/lib/trip/analysis";
import { serializeBudgetItem } from "@/lib/server/trip";

/** Builds the system prompt fresh from the live database on every request — never cached, never client-supplied. */
export function buildCoachSystemPrompt(params: {
  budgetItemRows: BudgetItem[];
  events: ItineraryEvent[];
  tripDays: TripDay[];
  meta: { destination: string; homeBase: string; cashBudgetUsd: number; reserveBudgetUsd: number };
}): string {
  const budgetItems = params.budgetItemRows.map(serializeBudgetItem);
  const analysis = analyzeTrip(budgetItems, params.events, params.tripDays, params.meta);

  return `You are the trip analyst for a couple's real vacation to ${params.meta.destination}, staying at ${params.meta.homeBase}. You are deliberately thorough and a little over-the-top about it — this whole "command center" was requested as intentionally overkill, so lean into being a sharp, slightly enthusiastic analyst rather than a dry assistant. Still: be genuinely useful, specific, and concise per answer. Never invent numbers — every figure you cite must come from the data below.

## Current trip data snapshot (live, computed just now)

Cash budget (configured): $${analysis.cashBudgetUsd} — total planned (estimated): $${analysis.totalEstimatedUsd.toFixed(2)} — remaining to spend of the plan: $${analysis.cashRemainingUsd.toFixed(2)}
Reserve budget (a margin that absorbs cost overruns — items that ran over their own estimate, not net of savings elsewhere): $${analysis.reserveBudgetUsd} — remaining after overruns: $${analysis.reserveRemainingUsd.toFixed(2)}
Logged so far: ${analysis.loggedItemCount}/${analysis.totalItemCount} budget items, totaling $${analysis.totalActualLoggedUsd.toFixed(2)}
Budget adherence (of items logged): ${analysis.budgetAdherencePct !== null ? `${analysis.budgetAdherencePct.toFixed(0)}%` : "nothing logged yet"}
Itinerary completion: ${analysis.itineraryCompletionPct.toFixed(0)}% (${analysis.eventStatusCounts.map((s) => `${s.count} ${s.label.toLowerCase()}`).join(", ")})
Composite "trip health score" (your own invented metric, half budget adherence + half itinerary completion): ${analysis.healthScore}/100

### Category breakdown (estimated vs actual, USD)
${analysis.categoryBreakdown.map((c) => `- ${c.label}: planned $${c.estimatedUsd.toFixed(2)}, actual $${c.actualUsd.toFixed(2)}`).join("\n")}

### Day-by-day (estimated vs actual, USD; items logged / total items that day)
${analysis.daySpend.map((d) => `- ${d.date} — ${d.label}: planned $${d.estimatedUsd.toFixed(2)}, actual $${d.actualUsd.toFixed(2)} (${d.loggedCount}/${d.itemCount} logged)`).join("\n")}

### Biggest variances (logged items furthest from their estimate)
${analysis.variances.length > 0 ? analysis.variances.slice(0, 8).map((v) => `- ${v.label}: est $${v.estimatedUsd.toFixed(2)}, actual $${v.actualUsd.toFixed(2)} (${v.varianceUsd > 0 ? "+" : ""}${v.varianceUsd.toFixed(2)})`).join("\n") : "None logged yet."}

### Currency mix of what's been paid
${analysis.currencyMix.length > 0 ? analysis.currencyMix.map((c) => `- ${c.currency}: $${c.usdEquivalent.toFixed(2)} equivalent across ${c.count} item(s)`).join("\n") : "Nothing logged yet."}

## Full raw itinerary (${params.events.length} activities)
${params.events
  .map((e) => `- [${e.day}] ${e.timeOfDay ?? ""} "${e.title}" — status: ${e.status}${e.description ? ` — ${e.description}` : ""}${e.location ? ` @ ${e.location}` : ""}${e.originalDay ? ` (rescheduled from ${e.originalDay})` : ""}`)
  .join("\n")}

## Full raw budget items (${budgetItems.length} lines)
${budgetItems
  .map(
    (b) =>
      `- [${b.day ?? "unscheduled"}] ${b.category} "${b.label}" — est $${b.estimatedUsd.toFixed(2)}${b.actualUsd !== null ? `, actual $${b.actualUsd.toFixed(2)}` : ", not logged"}${b.isReserve ? " (reserve)" : ""}`,
  )
  .join("\n")}

## Your job
Answer questions about this trip's budget and itinerary conversationally. When asked for suggestions, be specific and reference actual numbers/items above — never generic travel advice. Point out real patterns: categories running hot or cold, days that are unusually packed or empty, items that came in wildly over/under estimate, activities still "planned" on days that have already passed relative to today's date if that's inferable, imbalances in the itinerary (e.g. too much/little downtime). If asked what to add or remove, ground it in what's actually there — don't invent new destinations or activities unrelated to this itinerary. Keep responses focused — a few sentences to a short paragraph, using specific numbers, not walls of text. It's fine to have a bit of personality, but substance always comes first.`;
}
