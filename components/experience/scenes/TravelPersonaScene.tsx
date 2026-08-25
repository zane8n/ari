"use client";

import type { Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { travelPersonaAcknowledgements } from "@/content/response-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { TRAVEL_PERSONA_IDS, type TravelPersonaId } from "@/lib/experience/ids";
import type { ExperienceAction, ExperienceState } from "@/lib/experience/types";

const ILLUSTRATIONS: Record<TravelPersonaId, () => React.JSX.Element> = {
  "soft-private-luxurious": () => (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="12" fill="var(--accent-soft)" />
      <circle cx="20" cy="20" r="12" stroke="var(--accent)" strokeOpacity="0.4" />
    </svg>
  ),
  "explore-by-day-disappear-by-night": () => (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 6a14 14 0 0 1 0 28V6Z" fill="var(--accent)" fillOpacity="0.3" />
      <circle cx="20" cy="20" r="14" stroke="var(--accent)" strokeOpacity="0.4" />
    </svg>
  ),
  "eating-through-the-destination": () => (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="22" r="11" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity="0.35" />
      <path d="M14 8c0 3 2 3 2 6M20 8c0 3 2 3 2 6" stroke="var(--accent)" strokeOpacity="0.4" strokeLinecap="round" />
    </svg>
  ),
  "no-plan-beautiful-chaos": () => (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M7 26c4-10 9 8 13-2s8-9 13-4"
        stroke="var(--accent)"
        strokeOpacity="0.5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export function TravelPersonaScene({
  state,
  dispatch,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
}) {
  const acknowledgement = state.travelPersona ? travelPersonaAcknowledgements[state.travelPersona] : "";

  return (
    <fieldset className="glass-surface flex flex-col gap-6 border-0 px-6 py-9">
      <legend className="w-full p-0">
        <h1 className="font-display text-[clamp(1.9rem,7vw,2.3rem)] leading-[1.05] text-ink">
          {experienceCopy.travelPersona.question}
        </h1>
      </legend>

      <div className="flex flex-col gap-3">
        {TRAVEL_PERSONA_IDS.map((id) => {
          const Illustration = ILLUSTRATIONS[id];
          const checked = state.travelPersona === id;
          return (
            <label key={id} className="choice-tile flex cursor-pointer items-center gap-4 px-4 py-3" data-selected={checked}>
              <input
                type="radio"
                name="travelPersona"
                value={id}
                checked={checked}
                onChange={() => dispatch({ type: "travelPersonaSelected", persona: id })}
                className="sr-only"
              />
              <span className="h-10 w-10 shrink-0">
                <Illustration />
              </span>
              <span className="text-[15.5px] leading-snug font-semibold text-ink">
                {experienceCopy.travelPersona.options[id]}
              </span>
            </label>
          );
        })}
      </div>

      <p aria-live="polite" className="min-h-[1.25rem] text-sm text-ink-muted italic">
        {acknowledgement}
      </p>

      <GlassAction
        variant="primary"
        trailingArrow
        disabled={!state.travelPersona}
        onClick={() => dispatch({ type: "travelPersonaConfirmed" })}
        className="self-end"
      >
        Continue
      </GlassAction>
    </fieldset>
  );
}
