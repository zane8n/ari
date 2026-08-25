export const SPOIL_MODE_IDS = [
  "dinner-and-dressing-up",
  "slow-mornings",
  "little-surprises",
  "comfort-and-disappearing",
] as const;

export type SpoilModeId = (typeof SPOIL_MODE_IDS)[number];

export const TRAVEL_PERSONA_IDS = [
  "soft-private-luxurious",
  "explore-by-day-disappear-by-night",
  "eating-through-the-destination",
  "no-plan-beautiful-chaos",
] as const;

export type TravelPersonaId = (typeof TRAVEL_PERSONA_IDS)[number];

/** Only "vacation" is ever committed to ExperienceState; the rest are joke dead-ends. */
export const WISH_OPTION_IDS = ["money", "vacation", "love-letter", "peace-and-sleep"] as const;

export type WishOptionId = (typeof WISH_OPTION_IDS)[number];

export function isSpoilModeId(value: string): value is SpoilModeId {
  return (SPOIL_MODE_IDS as readonly string[]).includes(value);
}

export function isTravelPersonaId(value: string): value is TravelPersonaId {
  return (TRAVEL_PERSONA_IDS as readonly string[]).includes(value);
}
