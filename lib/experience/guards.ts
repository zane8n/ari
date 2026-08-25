import type { ThemeId } from "@/lib/theme/themes";
import { isThemeId } from "@/lib/theme/themes";
import {
  preferredNameSchema,
  reviewableAnswersSchema,
  signatureDraftSchema,
  spoilModesSchema,
} from "@/lib/validation/schemas";
import type { SpoilModeId, TravelPersonaId } from "./ids";
import type { ExperienceState, MustNotMiss, SignatureDraft } from "./types";

export function canSubmitName(name: string): boolean {
  return preferredNameSchema.safeParse(name).success;
}

export function canConfirmTheme(themeId: string | null): themeId is ThemeId {
  return themeId !== null && isThemeId(themeId);
}

export function canContinueSpoilModes(modes: SpoilModeId[]): boolean {
  return spoilModesSchema.safeParse(modes).success;
}

export function canConfirmTravelPersona(persona: TravelPersonaId | null): persona is TravelPersonaId {
  return persona !== null;
}

export function canSubmitMustNotMiss(value: MustNotMiss): boolean {
  if (value.kind === "surprise") return true;
  const trimmed = value.value.trim();
  return trimmed.length >= 2 && trimmed.length <= 280;
}

/** "review -> agreement | entire state schema passes" (section 13.1). */
export function canReachAgreement(state: ExperienceState): boolean {
  return reviewableAnswersSchema.safeParse({
    preferredName: state.preferredName,
    themeId: state.themeId,
    birthdayWish: state.birthdayWish,
    spoilModes: state.spoilModes,
    travelPersona: state.travelPersona,
    mustNotMiss: state.mustNotMiss,
    agreementVersion: state.agreementVersion,
  }).success;
}

export function canEnterSignature(state: ExperienceState): boolean {
  return state.agreementAcknowledgedAt !== null;
}

/** "signature -> sealing | acknowledged, valid signature, unsealed" (section 13.1). */
export function canSeal(state: ExperienceState, signature: SignatureDraft): boolean {
  return (
    state.agreementAcknowledgedAt !== null &&
    state.sealedAt === null &&
    signatureDraftSchema.safeParse(signature).success
  );
}
