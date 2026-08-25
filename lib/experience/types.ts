import type { ThemeId } from "@/lib/theme/themes";
import type { SpoilModeId, TravelPersonaId } from "./ids";

export const STAGES = [
  "arrival",
  "name",
  "theme",
  "prologue",
  "wish",
  "wishConfirm",
  "spoilModes",
  "travelPersona",
  "mustNotMiss",
  "review",
  "agreement",
  "signature",
  "sealing",
  "reveal",
] as const;

export type Stage = (typeof STAGES)[number];

/** Stages reachable from Review's per-row edit action. */
export type EditableStage = "name" | "theme" | "wish" | "spoilModes" | "travelPersona" | "mustNotMiss";

export type MustNotMiss = { kind: "text"; value: string } | { kind: "surprise" };

export type SignaturePoint = { x: number; y: number; time: number; pressure?: number };
export type SignaturePointGroup = SignaturePoint[];

export type SignatureDraft =
  | { kind: "drawn"; points: SignaturePointGroup[] }
  | { kind: "typed"; value: string };

export const AGREEMENT_VERSION = "lover-agreement-v1" as const;

export type ExperienceState = {
  schemaVersion: 1;
  inviteId: string;
  stage: Stage;
  preferredName: string;
  themeId: ThemeId | null;
  birthdayWish: "vacation" | null;
  spoilModes: SpoilModeId[];
  travelPersona: TravelPersonaId | null;
  mustNotMiss: MustNotMiss | null;
  agreementVersion: typeof AGREEMENT_VERSION;
  agreementAcknowledgedAt: string | null;
  signature: SignatureDraft | null;
  sealedAt: string | null;
  sealingError: boolean;
  revisionReturnStage: "review" | null;
  openedAt: string | null;
  prologueViewedAt: string | null;
  vacationConfirmedAt: string | null;
  reviewedAt: string | null;
};

export function createInitialState(inviteId: string): ExperienceState {
  return {
    schemaVersion: 1,
    inviteId,
    stage: "arrival",
    preferredName: "",
    themeId: null,
    birthdayWish: null,
    spoilModes: [],
    travelPersona: null,
    mustNotMiss: null,
    agreementVersion: AGREEMENT_VERSION,
    agreementAcknowledgedAt: null,
    signature: null,
    sealedAt: null,
    sealingError: false,
    revisionReturnStage: null,
    openedAt: null,
    prologueViewedAt: null,
    vacationConfirmedAt: null,
    reviewedAt: null,
  };
}

export type ExperienceAction =
  | { type: "arrived"; at: string }
  | { type: "nameSubmitted"; name: string }
  | { type: "themeSelected"; themeId: ThemeId }
  | { type: "prologueViewed"; at: string }
  | { type: "wishConfirmRequested" }
  | { type: "wishConfirmDismissed" }
  | { type: "wishConfirmed"; at: string }
  | { type: "spoilModeToggled"; mode: SpoilModeId }
  | { type: "spoilModesConfirmed" }
  | { type: "travelPersonaSelected"; persona: TravelPersonaId }
  | { type: "travelPersonaConfirmed" }
  | { type: "mustNotMissSubmitted"; value: MustNotMiss }
  | { type: "editRequested"; fromStage: EditableStage }
  | { type: "agreementAcknowledgedChanged"; acknowledged: boolean; at: string }
  | { type: "agreementConfirmed"; at: string }
  | { type: "signatureStageEntered" }
  | { type: "sealSubmitted"; signature: SignatureDraft }
  | { type: "sealingFailed" }
  | { type: "sealed"; at: string }
  | { type: "wentBack"; stage: Stage }
  | { type: "restored"; state: ExperienceState };
