import {
  canConfirmTheme,
  canConfirmTravelPersona,
  canContinueSpoilModes,
  canEnterSignature,
  canReachAgreement,
  canSeal,
  canSubmitMustNotMiss,
  canSubmitName,
} from "./guards";
import type { ExperienceAction, ExperienceState, Stage } from "./types";

/** Where an edit-return should land, or the given normal-flow default if none is pending. */
function resolveNext(state: ExperienceState, normalNext: Stage): Stage {
  return state.revisionReturnStage ?? normalNext;
}

function sanitizeAfterSeal(state: ExperienceState, sealedAt: string): ExperienceState {
  return {
    ...state,
    stage: "reveal",
    sealedAt,
    sealingError: false,
    signature: null,
    mustNotMiss: null,
    spoilModes: [],
    travelPersona: null,
    birthdayWish: null,
    agreementAcknowledgedAt: null,
    revisionReturnStage: null,
  };
}

export function experienceReducer(state: ExperienceState, action: ExperienceAction): ExperienceState {
  switch (action.type) {
    case "arrived":
      if (state.stage !== "arrival") return state;
      return { ...state, stage: "name", openedAt: action.at };

    case "nameSubmitted": {
      if (!canSubmitName(action.name)) return state;
      return {
        ...state,
        preferredName: action.name.trim(),
        stage: resolveNext(state, "theme"),
        revisionReturnStage: null,
      };
    }

    case "themeSelected": {
      if (!canConfirmTheme(action.themeId)) return state;
      return {
        ...state,
        themeId: action.themeId,
        stage: resolveNext(state, "prologue"),
        revisionReturnStage: null,
      };
    }

    case "prologueViewed":
      if (state.stage !== "prologue") return state;
      return {
        ...state,
        prologueViewedAt: action.at,
        stage: resolveNext(state, "wish"),
        revisionReturnStage: null,
      };

    case "wishConfirmRequested":
      if (state.stage !== "wish") return state;
      return { ...state, stage: "wishConfirm" };

    case "wishConfirmDismissed":
      if (state.stage !== "wishConfirm") return state;
      return { ...state, stage: "wish" };

    case "wishConfirmed": {
      if (state.stage !== "wishConfirm") return state;
      return {
        ...state,
        birthdayWish: "vacation",
        vacationConfirmedAt: action.at,
        stage: resolveNext(state, "spoilModes"),
        revisionReturnStage: null,
      };
    }

    case "spoilModeToggled": {
      const exists = state.spoilModes.includes(action.mode);
      const spoilModes = exists
        ? state.spoilModes.filter((mode) => mode !== action.mode)
        : [...state.spoilModes, action.mode];
      return { ...state, spoilModes };
    }

    case "spoilModesConfirmed": {
      if (!canContinueSpoilModes(state.spoilModes)) return state;
      return { ...state, stage: resolveNext(state, "travelPersona"), revisionReturnStage: null };
    }

    case "travelPersonaSelected":
      return { ...state, travelPersona: action.persona };

    case "travelPersonaConfirmed": {
      if (!canConfirmTravelPersona(state.travelPersona)) return state;
      return { ...state, stage: resolveNext(state, "mustNotMiss"), revisionReturnStage: null };
    }

    case "mustNotMissSubmitted": {
      if (!canSubmitMustNotMiss(action.value)) return state;
      return {
        ...state,
        mustNotMiss: action.value,
        stage: resolveNext(state, "review"),
        revisionReturnStage: null,
      };
    }

    case "editRequested":
      if (state.sealedAt !== null) return state;
      return { ...state, stage: action.fromStage, revisionReturnStage: "review" };

    case "agreementAcknowledgedChanged":
      return {
        ...state,
        agreementAcknowledgedAt: action.acknowledged ? action.at : null,
      };

    case "agreementConfirmed": {
      if (state.stage !== "review") return state;
      if (!canReachAgreement(state)) return state;
      return { ...state, stage: "agreement", reviewedAt: action.at };
    }

    case "signatureStageEntered": {
      if (state.stage !== "agreement") return state;
      if (!canEnterSignature(state)) return state;
      return { ...state, stage: "signature" };
    }

    case "sealSubmitted": {
      if (!canSeal(state, action.signature)) return state;
      return { ...state, signature: action.signature, stage: "sealing", sealingError: false };
    }

    case "sealingFailed":
      if (state.stage !== "sealing") return state;
      return { ...state, sealingError: true };

    case "sealed":
      if (state.stage !== "sealing") return state;
      return sanitizeAfterSeal(state, action.at);

    case "wentBack":
      if (state.sealedAt !== null) return state;
      return { ...state, stage: action.stage };

    case "restored":
      return action.state;

    default:
      return state;
  }
}
