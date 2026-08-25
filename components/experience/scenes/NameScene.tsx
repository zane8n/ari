"use client";

import { useState, type Dispatch, type FormEvent } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { HeartSparkIcon } from "@/components/icons/Decorative";
import { canSubmitName } from "@/lib/experience/guards";
import { m } from "@/lib/motion/m";
import { motionTokens } from "@/lib/motion/tokens";
import type { ExperienceAction, ExperienceState } from "@/lib/experience/types";

export function NameScene({
  state,
  dispatch,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
}) {
  const [name, setName] = useState(state.preferredName);
  const canSubmit = canSubmitName(name);

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!canSubmit) return;
    dispatch({ type: "nameSubmitted", name });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10 px-4">
      <m.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: motionTokens.component.ease }}
      >
        <HeartSparkIcon className="h-7 w-7 shrink-0 text-accent-strong" />
        <h1 className="font-display text-[clamp(2rem,7.5vw,2.7rem)] leading-[1.06] text-ink">
          {experienceCopy.setTheMood.namePrompt}
        </h1>
      </m.div>
      <m.input
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={40}
        aria-label={experienceCopy.setTheMood.namePrompt}
        className="name-input focus-ring w-full border-b-2 bg-transparent pb-3 font-script text-ink outline-none"
        style={{ fontSize: "clamp(2rem, 9vw, 3rem)", borderColor: "var(--hairline)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: motionTokens.component.ease }}
      />
      <m.div
        className="self-end"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.32, ease: motionTokens.component.ease }}
      >
        <GlassAction type="submit" variant="primary" trailingArrow disabled={!canSubmit}>
          {experienceCopy.setTheMood.nameContinueAction}
        </GlassAction>
      </m.div>
    </form>
  );
}
