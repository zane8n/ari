"use client";

import { useEffect, useState, type Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { interpolate } from "@/lib/content/interpolate";
import { motionTokens } from "@/lib/motion/tokens";
import { m } from "@/lib/motion/m";
import type { ExperienceAction, ExperienceState } from "@/lib/experience/types";

const STAGGER_SECONDS = 0.09;

export function PrologueScene({
  state,
  dispatch,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
}) {
  const paragraphs = [
    ...experienceCopy.prologue.bridge.map((line) => interpolate(line, { name: state.preferredName })),
    ...experienceCopy.prologue.letter,
  ];
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const totalMs = (paragraphs.length - 1) * STAGGER_SECONDS * 1000 + 500;
    const id = setTimeout(() => setRevealed(true), totalMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="glass-surface flex flex-col gap-7 px-7 py-10">
      {/* Visually hidden — the letter's own opening line carries the moment; this just gives the scene its one required h1. */}
      <h1 className="sr-only">A letter for you</h1>
      <div className="flex max-w-[34ch] flex-col gap-4">
        {paragraphs.map((paragraph, index) => (
          <m.p
            key={index}
            className={index < experienceCopy.prologue.bridge.length ? "font-display text-2xl text-ink" : "text-[17px] leading-relaxed text-ink"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: index * STAGGER_SECONDS, ease: motionTokens.component.ease }}
          >
            {paragraph}
          </m.p>
        ))}
      </div>
      <m.div
        className="self-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0, pointerEvents: revealed ? "auto" : "none" }}
        transition={{ duration: 0.3 }}
      >
        <GlassAction
          variant="primary"
          trailingArrow
          disabled={!revealed}
          onClick={() => dispatch({ type: "prologueViewed", at: new Date().toISOString() })}
        >
          {experienceCopy.prologue.continueAction}
        </GlassAction>
      </m.div>
    </div>
  );
}
