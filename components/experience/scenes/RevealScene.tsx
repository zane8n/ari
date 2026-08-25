"use client";

import { useState } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { InvitationCard } from "@/components/invitation/InvitationCard";
import { LoverAgreement } from "@/components/agreement/LoverAgreement";
import { getTheme } from "@/lib/theme/themes";
import type { ExperienceState } from "@/lib/experience/types";
import type { RevealData } from "@/lib/reveal/types";

export function RevealScene({
  state,
  reveal,
  token,
}: {
  state: ExperienceState;
  reveal: RevealData | null;
  token: string;
}) {
  const [showAgreement, setShowAgreement] = useState(false);
  const theme = state.themeId ? getTheme(state.themeId) : null;

  if (!reveal) {
    return (
      <div className="aura-panel flex flex-col items-center gap-4 px-7 py-14 text-center">
        <p className="font-display text-xl text-ink">{experienceCopy.reveal.eyebrow}</p>
        <p className="text-sm text-ink-muted">Loading your invitation…</p>
      </div>
    );
  }

  if (showAgreement) {
    return (
      <div className="flex flex-col gap-5">
        <LoverAgreement preferredName={state.preferredName} acknowledged readOnly />
        <button
          type="button"
          onClick={() => setShowAgreement(false)}
          className="focus-ring self-center text-sm text-ink-muted underline"
        >
          Back to the invitation
        </button>
      </div>
    );
  }

  return (
    <InvitationCard
      preferredName={state.preferredName}
      theme={theme}
      reveal={reveal}
      token={token}
      onReadAgreement={() => setShowAgreement(true)}
    />
  );
}
