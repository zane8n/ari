"use client";

import { useState, type Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { canSubmitMustNotMiss } from "@/lib/experience/guards";
import { m } from "@/lib/motion/m";
import { motionTokens } from "@/lib/motion/tokens";
import type { ExperienceAction, ExperienceState, MustNotMiss } from "@/lib/experience/types";

export function MustNotMissScene({
  state,
  dispatch,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
}) {
  const initial = state.mustNotMiss;
  const [text, setText] = useState(initial?.kind === "text" ? initial.value : "");
  const [surprise, setSurprise] = useState(initial?.kind === "surprise");

  const value: MustNotMiss = surprise ? { kind: "surprise" } : { kind: "text", value: text };
  const canSubmit = canSubmitMustNotMiss(value);

  function handleSurpriseToggle(next: boolean): void {
    if (next && text.trim().length > 0) {
      const confirmed = window.confirm("Clear what you've written and let it be a surprise instead?");
      if (!confirmed) return;
      setText("");
    }
    setSurprise(next);
  }

  return (
    <m.div
      className="flex flex-col gap-5 px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: motionTokens.component.ease }}
    >
      <h1 className="font-display text-[clamp(1.9rem,7vw,2.4rem)] leading-[1.05] text-ink">
        {experienceCopy.mustNotMiss.prompt}
      </h1>
      <p className="text-sm text-ink-muted">{experienceCopy.mustNotMiss.helper}</p>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value.slice(0, 180))}
        disabled={surprise}
        rows={4}
        maxLength={180}
        aria-label={experienceCopy.mustNotMiss.prompt}
        className="aura-panel-solid focus-ring min-h-[120px] w-full resize-none px-4 py-3 text-base text-ink outline-none disabled:opacity-50"
      />
      {text.length > 140 && <p className="text-right text-xs text-ink-muted">{text.length}/180</p>}

      <label className="flex items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={surprise}
          onChange={(event) => handleSurpriseToggle(event.target.checked)}
          className="h-5 w-5 accent-[var(--accent)]"
        />
        {experienceCopy.mustNotMiss.surpriseOption}
      </label>

      <GlassAction
        variant="primary"
        trailingArrow
        disabled={!canSubmit}
        onClick={() => dispatch({ type: "mustNotMissSubmitted", value })}
        className="self-end"
      >
        {experienceCopy.mustNotMiss.continueAction}
      </GlassAction>
    </m.div>
  );
}
