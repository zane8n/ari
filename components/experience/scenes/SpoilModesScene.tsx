"use client";

import type { Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { ChoiceCard } from "@/components/controls/ChoiceCard";
import { canContinueSpoilModes } from "@/lib/experience/guards";
import { SPOIL_MODE_IDS } from "@/lib/experience/ids";
import { m } from "@/lib/motion/m";
import { motionTokens } from "@/lib/motion/tokens";
import type { ExperienceAction, ExperienceState } from "@/lib/experience/types";

export function SpoilModesScene({
  state,
  dispatch,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
}) {
  const canContinue = canContinueSpoilModes(state.spoilModes);
  const allSelected = state.spoilModes.length === SPOIL_MODE_IDS.length;

  return (
    <div className="flex flex-col gap-6 px-4">
      <div>
        <h1 className="font-display text-[clamp(1.9rem,7vw,2.4rem)] leading-[1.05] text-ink">
          {experienceCopy.spoilModes.question}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">{experienceCopy.spoilModes.helper}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SPOIL_MODE_IDS.map((id, index) => (
          <m.div
            key={id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06, ease: motionTokens.component.ease }}
          >
            <ChoiceCard
              as="checkbox"
              name="spoilModes"
              value={id}
              checked={state.spoilModes.includes(id)}
              onChange={() => dispatch({ type: "spoilModeToggled", mode: id })}
              label={experienceCopy.spoilModes.options[id]}
            />
          </m.div>
        ))}
      </div>

      <p aria-live="polite" className="min-h-[1.25rem] text-sm text-ink-muted italic">
        {allSelected ? experienceCopy.spoilModes.allSelectedAside : ""}
      </p>

      {!canContinue && <p className="-mt-4 text-sm text-ink-muted">Choose at least one to continue.</p>}

      <GlassAction
        variant="primary"
        trailingArrow
        disabled={!canContinue}
        onClick={() => dispatch({ type: "spoilModesConfirmed" })}
        className="self-end"
      >
        {experienceCopy.spoilModes.continueAction}
      </GlassAction>
    </div>
  );
}
