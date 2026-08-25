"use client";

import { useState, type Dispatch, type FormEvent } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { canSubmitName } from "@/lib/experience/guards";
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
    <form onSubmit={handleSubmit} className="glass-surface flex flex-col gap-10 px-7 py-10">
      <h1 className="font-display text-[clamp(2rem,7vw,2.6rem)] leading-[1.04] text-ink">
        {experienceCopy.setTheMood.namePrompt}
      </h1>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={40}
        aria-label={experienceCopy.setTheMood.namePrompt}
        className="name-input focus-ring w-full border-b-2 bg-transparent pb-3 font-display text-ink outline-none"
        style={{ fontSize: "clamp(1.5rem, 6vw, 2rem)", borderColor: "var(--hairline)" }}
      />
      <GlassAction type="submit" variant="primary" trailingArrow disabled={!canSubmit} className="self-end">
        Continue
      </GlassAction>
    </form>
  );
}
