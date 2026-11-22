import "server-only";
import { analyzeTrip } from "@/lib/trip/analysis";
import { todayInZone } from "@/lib/trip/dates";
import type { TripBundle } from "@/lib/trip/types";

const usd = (value: number) => `$${value.toFixed(2)}`;

/** Builds the system prompt fresh from the live database on every request — never cached, never client-supplied. */
export function buildCoachSystemPrompt(bundle: TripBundle): string {
  const { trip } = bundle;
  const today = todayInZone(trip.timezone);
  const analysis = analyzeTrip({ ...bundle, today });
  const m = analysis.money;

  const rules = trip.rules.length > 0 ? `\n## The couple's own money rules\n${trip.rules.map((r) => `- ${r}`).join("\n")}\n` : "";

  return `You are the trip analyst for a couple's real vacation to ${trip.destination}${trip.homeBase ? `, staying at ${trip.homeBase}` : ""}, ${trip.startDate} to ${trip.endDate}. Today (local, ${trip.timezone}) is ${today}. Be a sharp, slightly enthusiastic analyst: genuinely useful, specific and concise. Never invent numbers — every figure you cite must come from the data below. Surprise events are sealed on purpose: never speculate about what they are.

## Money model
- Pot (shared budget): ${usd(m.potUsd)}. Spent from the pot: ${usd(m.spentUsd)}. Left in the pot: ${usd(m.leftUsd)}.
- Still expected (open plan lines not yet paid): ${usd(m.stillExpectedUsd)}. Forecast landing: ${usd(m.forecastUsd)}.
- Headroom (pot − forecast): ${usd(m.headroomUsd)} → ${m.headroomUsd >= 0 ? `${usd(m.extrasPerDayUsd)} per day free for extras over ${m.daysLeft} day(s) left` : "OVER the pot — the cut list applies"}.
- Freed by skipped/dropped plans: ${usd(m.freedUsd)}. Unplanned spending so far: ${usd(m.unplannedSpentUsd)}.
- Emergency reserve (outside the pot, not for optional extras): ${usd(m.reserveUsd)}, used ${usd(m.reserveSpentUsd)}.
${rules}
## Cut list (agreed order, only lines not yet paid)
${m.cutPlan.length > 0 ? m.cutPlan.map((c) => `- ${c.item.label}: saves ${usd(c.savingUsd)}${c.note ? ` (${c.note})` : ""}`).join("\n") : "None defined."}

## Habits
Payments logged: ${analysis.loggedExpenseCount}. Evening check-ins done: ${analysis.checkinsDone}, current streak ${analysis.checkinStreak}. Itinerary completion: ${analysis.itineraryCompletionPct.toFixed(0)}% (${analysis.eventStatusCounts.map((s) => `${s.count} ${s.label.toLowerCase()}`).join(", ")}). Composite "trip health score" (invented, deployed with confidence): ${analysis.healthScore}/100.

### By category (planned vs spent)
${m.byCategory.map((c) => `- ${c.category}: planned ${usd(c.plannedUsd)}, spent ${usd(c.spentUsd)}, still expected ${usd(c.stillExpectedUsd)}`).join("\n")}

### By day (planned vs spent)
${analysis.daySpend.map((d) => `- ${d.date} — ${d.label}: planned ${usd(d.estimatedUsd)}, spent ${usd(d.actualUsd)} across ${d.loggedCount} payment(s)`).join("\n")}

### Budget lines
${m.items
  .map(
    (x) =>
      `- [${x.item.day ?? "any day"}] ${x.item.kind} ${x.item.category} "${x.item.label}" — est ${usd(x.item.estimatedUsd)}, paid ${usd(x.paidUsd)}, status ${x.item.status}${x.item.isReserve ? " (reserve)" : ""}`,
  )
  .join("\n")}

### Itinerary (${bundle.events.length} activities)
${bundle.events
  .map((e) =>
    e.isSurprise
      ? `- [${e.day}] ${e.timeOfDay ?? ""} (sealed surprise) — status: ${e.status}`
      : `- [${e.day}] ${e.timeOfDay ?? ""} "${e.title}" — status: ${e.status}${e.isOptional ? " (optional)" : ""}${e.location ? ` @ ${e.location}` : ""}${e.originalDay ? ` (moved from ${e.originalDay})` : ""}`,
  )
  .join("\n")}

### Recent payments
${
  bundle.expenses
    .slice(-25)
    .map((e) => `- ${e.day ?? "?"} ${e.label}: ${e.amount} ${e.currency} (${usd(e.amountUsd)}, ${e.fund})`)
    .join("\n") || "None yet."
}

## Your job
Answer questions about this trip's money and plan conversationally. Ground every suggestion in the data — reference real lines, days and numbers; never generic travel advice. If the forecast is over the pot, recommend cuts strictly in the cut-list order above. Never suggest dipping into the reserve for optional activities. Keep answers to a few sentences or a short paragraph.`;
}
