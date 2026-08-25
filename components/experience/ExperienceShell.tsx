"use client";

import { useLayoutEffect, useReducer, useRef, useState } from "react";
import { AmbientWorld } from "@/components/ambient/AmbientWorld";
import { ColorWash, type WashRequest } from "@/components/ambient/ColorWash";
import { PointerMotionProvider } from "@/components/ambient/PointerMotionProvider";
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, useReducedMotion } from "@/lib/motion/m";
import { motionTokens } from "@/lib/motion/tokens";
import { experienceReducer } from "@/lib/experience/reducer";
import { DraftPersister, loadDraft } from "@/lib/experience/persistence";
import type { ExperienceState, SignatureDraft } from "@/lib/experience/types";
import { applyThemeTokens } from "@/lib/theme/apply";
import { getTheme, type ThemeRecord } from "@/lib/theme/themes";
import type { RevealData } from "@/lib/reveal/types";
import { sealedPayloadV1Schema } from "@/lib/validation/schemas";
import { SceneFrame } from "./SceneFrame";
import { ArrivalScene } from "./scenes/ArrivalScene";
import { NameScene } from "./scenes/NameScene";
import { ThemeScene } from "./scenes/ThemeScene";
import { PrologueScene } from "./scenes/PrologueScene";
import { WishScene } from "./scenes/WishScene";
import { SpoilModesScene } from "./scenes/SpoilModesScene";
import { TravelPersonaScene } from "./scenes/TravelPersonaScene";
import { MustNotMissScene } from "./scenes/MustNotMissScene";
import { ReviewScene } from "./scenes/ReviewScene";
import { AgreementScene } from "./scenes/AgreementScene";
import { SignatureScene } from "./scenes/SignatureScene";
import { RevealScene } from "./scenes/RevealScene";

export function ExperienceShell({
  token,
  initialState,
  initialReveal,
}: {
  token: string;
  initialState: ExperienceState;
  initialReveal: RevealData | null;
}) {
  const [state, dispatch] = useReducer(experienceReducer, initialState);
  const [reveal, setReveal] = useState<RevealData | null>(initialReveal);
  const [washRequest, setWashRequest] = useState<WashRequest | null>(null);
  const reducedMotion = useReducedMotion();

  const persisterRef = useRef<DraftPersister | null>(null);
  const hasRestoredRef = useRef(false);
  const hasOpenedRef = useRef(initialState.openedAt !== null);
  const suppressNextPushRef = useRef(false);
  const washIdRef = useRef(0);

  useLayoutEffect(() => {
    persisterRef.current = new DraftPersister();
    const draft = loadDraft(initialState.inviteId);
    const usableDraft = draft && draft.sealedAt === null ? draft : null;

    if (usableDraft) {
      dispatch({ type: "restored", state: usableDraft });
      if (usableDraft.themeId) applyThemeTokens(getTheme(usableDraft.themeId));
    } else if (initialState.themeId) {
      applyThemeTokens(getTheme(initialState.themeId));
    }

    hasRestoredRef.current = true;
    history.replaceState({ stage: usableDraft?.stage ?? initialState.stage }, "");
    return () => persisterRef.current?.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!hasRestoredRef.current) return;
    persisterRef.current?.schedule(state);
  }, [state]);

  useLayoutEffect(() => {
    if (!hasRestoredRef.current) return;
    if (suppressNextPushRef.current) {
      suppressNextPushRef.current = false;
      return;
    }
    if (state.sealedAt !== null) {
      history.replaceState({ stage: "reveal" }, "");
      return;
    }
    history.pushState({ stage: state.stage }, "");
  }, [state.stage, state.sealedAt]);

  useLayoutEffect(() => {
    function handlePopState(event: PopStateEvent): void {
      const targetStage = (event.state?.stage as ExperienceState["stage"] | undefined) ?? "arrival";
      suppressNextPushRef.current = true;
      dispatch({ type: "wentBack", stage: targetStage });
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useLayoutEffect(() => {
    if (state.openedAt === null || hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    fetch(`/api/invite/${token}/opened`, { method: "POST" }).catch(() => {
      // Best-effort telemetry only — never blocks the experience (section 20).
    });
  }, [state.openedAt, token]);

  function requestWash(theme: ThemeRecord, origin: { x: number; y: number }): void {
    washIdRef.current += 1;
    setWashRequest({ id: washIdRef.current, theme, originX: origin.x, originY: origin.y });
  }

  async function submitSeal(signature: SignatureDraft): Promise<void> {
    const parsed = sealedPayloadV1Schema.safeParse({
      preferredName: state.preferredName,
      themeId: state.themeId,
      birthdayWish: state.birthdayWish,
      spoilModes: state.spoilModes,
      travelPersona: state.travelPersona,
      mustNotMiss: state.mustNotMiss,
      agreementVersion: state.agreementVersion,
      agreementAcknowledgedAt: state.agreementAcknowledgedAt,
      signature,
    });
    if (!parsed.success) {
      dispatch({ type: "sealingFailed" });
      return;
    }

    try {
      const response = await fetch(`/api/invite/${token}/seal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: getIdempotencyKey(), payload: parsed.data }),
      });
      if (!response.ok) throw new Error(`Seal failed: ${response.status}`);
      const data = (await response.json()) as { sealedAt: string; reveal: RevealData };
      navigator.vibrate?.(12);
      setReveal(data.reveal);
      dispatch({ type: "sealed", at: data.sealedAt });
    } catch {
      dispatch({ type: "sealingFailed" });
    }
  }

  const idempotencyKeyRef = useRef<string | null>(null);
  function getIdempotencyKey(): string {
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
    return idempotencyKeyRef.current;
  }

  const sceneKey = state.stage === "wishConfirm" ? "wish" : state.stage === "sealing" ? "signature" : state.stage;

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={motionTokens.component}>
        <PointerMotionProvider>
          <AmbientWorld state={state} />
          <ColorWash request={washRequest} reducedMotion={!!reducedMotion} />
          <AnimatePresence mode="wait" initial={false}>
            <SceneFrame key={sceneKey} stage={sceneKey} wide={state.stage === "agreement"}>
              {sceneKey === "arrival" && <ArrivalScene dispatch={dispatch} />}
              {sceneKey === "name" && <NameScene state={state} dispatch={dispatch} />}
              {sceneKey === "theme" && <ThemeScene state={state} dispatch={dispatch} onPreviewTheme={requestWash} />}
              {sceneKey === "prologue" && <PrologueScene state={state} dispatch={dispatch} />}
              {sceneKey === "wish" && <WishScene state={state} dispatch={dispatch} />}
              {sceneKey === "spoilModes" && <SpoilModesScene state={state} dispatch={dispatch} />}
              {sceneKey === "travelPersona" && <TravelPersonaScene state={state} dispatch={dispatch} />}
              {sceneKey === "mustNotMiss" && <MustNotMissScene state={state} dispatch={dispatch} />}
              {sceneKey === "review" && <ReviewScene state={state} dispatch={dispatch} />}
              {sceneKey === "agreement" && <AgreementScene state={state} dispatch={dispatch} />}
              {sceneKey === "signature" && (
                <SignatureScene state={state} dispatch={dispatch} onSubmitSeal={submitSeal} />
              )}
              {sceneKey === "reveal" && <RevealScene state={state} reveal={reveal} token={token} />}
            </SceneFrame>
          </AnimatePresence>
        </PointerMotionProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
