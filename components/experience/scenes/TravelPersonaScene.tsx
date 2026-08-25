"use client";

import type { Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { travelPersonaAcknowledgements } from "@/content/response-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { CompassIcon, HeartSparkIcon, MapTrailIcon, SprigIcon } from "@/components/icons/Decorative";
import { TRAVEL_PERSONA_IDS, type TravelPersonaId } from "@/lib/experience/ids";
import { m } from "@/lib/motion/m";
import { motionTokens } from "@/lib/motion/tokens";
import type { ExperienceAction, ExperienceState } from "@/lib/experience/types";

const ILLUSTRATIONS: Record<TravelPersonaId, (props: { className?: string }) => React.JSX.Element> = {
  "soft-private-luxurious": HeartSparkIcon,
  "explore-by-day-disappear-by-night": CompassIcon,
  "eating-through-the-destination": SprigIcon,
  "no-plan-beautiful-chaos": MapTrailIcon,
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
    <fieldset className="flex flex-col gap-6 border-0 px-4">
      <legend className="w-full p-0">
        <h1 className="font-display text-[clamp(1.9rem,7vw,2.4rem)] leading-[1.05] text-ink">
          {experienceCopy.travelPersona.question}
        </h1>
      </legend>

      <div className="flex flex-col gap-3">
        {TRAVEL_PERSONA_IDS.map((id, index) => {
          const Illustration = ILLUSTRATIONS[id];
          const checked = state.travelPersona === id;
          return (
            <m.label
              key={id}
              className="choice-tile flex cursor-pointer items-center gap-4 px-4 py-3"
              data-selected={checked}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: index * 0.07, ease: motionTokens.component.ease }}
            >
              <input
                type="radio"
                name="travelPersona"
                value={id}
                checked={checked}
                onChange={() => dispatch({ type: "travelPersonaSelected", persona: id })}
                className="sr-only"
              />
              <span className="h-9 w-9 shrink-0 text-accent-strong">
                <Illustration className="h-full w-full" />
              </span>
              <span className="text-[15.5px] leading-snug font-semibold text-ink">
                {experienceCopy.travelPersona.options[id]}
              </span>
            </m.label>
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
        {experienceCopy.travelPersona.continueAction}
      </GlassAction>
    </fieldset>
  );
}
