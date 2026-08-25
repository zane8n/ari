"use client";

import dynamic from "next/dynamic";
import type { Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import type { ExperienceAction, ExperienceState, SignatureDraft } from "@/lib/experience/types";

const SignatureSurface = dynamic(
  () => import("@/components/signature/SignatureSurface").then((mod) => mod.SignatureSurface),
  { ssr: false },
);

export function SignatureScene({
  state,
  dispatch,
  onSubmitSeal,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
  onSubmitSeal: (signature: SignatureDraft) => Promise<void>;
}) {
  function handleCapture(signature: SignatureDraft): void {
    dispatch({ type: "sealSubmitted", signature });
    void onSubmitSeal(signature);
  }

  if (state.stage === "sealing") {
    return (
      <div className="glass-surface flex flex-col items-center gap-5 px-7 py-14 text-center">
        <p className="font-display text-xl text-ink">Sealing it…</p>
        {state.sealingError && (
          <>
            <p className="text-sm text-ink-muted">{experienceCopy.edgeStates.offlineDuringSigning}</p>
            <GlassAction
              variant="primary"
              onClick={() => {
                if (state.signature) void onSubmitSeal(state.signature);
              }}
            >
              {experienceCopy.edgeStates.retry}
            </GlassAction>
          </>
        )}
      </div>
    );
  }

  return (
    <SignatureSurface
      preferredName={state.preferredName}
      onCancel={() => dispatch({ type: "wentBack", stage: "agreement" })}
      onCapture={handleCapture}
    />
  );
}
