import type { TravelPersonaId, WishOptionId } from "@/lib/experience/ids";

/**
 * Reviewed static copy map (section 8: "Do not generate runtime copy with an
 * LLM"). Every acknowledgement and joke response the recipient can trigger
 * lives here, hand-authored once, never generated on the fly.
 */
export const wishJokeResponses: Record<Exclude<WishOptionId, "vacation">, string> = {
  money: "Excellent choice. Unfortunately, the finance department is also your boyfriend.",
  "love-letter": "Already issued. Non-refundable.",
  "peace-and-sleep": "Approved during transit. The rest of the birthday remains occupied.",
};

export const travelPersonaAcknowledgements: Record<TravelPersonaId, string> = {
  "soft-private-luxurious": "Noted. Do-not-disturb signs have been mentally pre-ordered.",
  "explore-by-day-disappear-by-night": "Noted. Daylight for wandering, evenings for us.",
  "eating-through-the-destination": "Noted. We’re packing appetite first, plans second.",
  "no-plan-beautiful-chaos": "Noted. No itinerary survives contact with you anyway.",
};
