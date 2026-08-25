import type { TravelPersonaId, WishOptionId } from "@/lib/experience/ids";

/**
 * Reviewed static copy map (section 8: "Do not generate runtime copy with an
 * LLM"). Every acknowledgement and joke response the recipient can trigger
 * lives here, hand-authored once, never generated on the fly.
 */
export const wishJokeResponses: Record<Exclude<WishOptionId, "vacation">, string> = {
  money: "DENIED. 💅 The finance department is also your boyfriend, and he already knows exactly what you're up to.",
  "love-letter": "Already issued. 💌 47 pages, front and back, in my worst handwriting. No refunds. No notes. No takebacks.",
  "peace-and-sleep": "Sleep: approved, but only until landing. 😴✈️ The second wheels touch down, I have plans and zero chill.",
};

export const travelPersonaAcknowledgements: Record<TravelPersonaId, string> = {
  "soft-private-luxurious": "Noted. Do-not-disturb signs have been mentally pre-ordered.",
  "explore-by-day-disappear-by-night": "Noted. Daylight for wandering, evenings for us.",
  "eating-through-the-destination": "Noted. We’re packing appetite first, plans second.",
  "no-plan-beautiful-chaos": "Noted. No itinerary survives contact with you anyway.",
};
