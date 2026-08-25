"use client";

import { useEffect, useState, type Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { interpolate } from "@/lib/content/interpolate";
import { motionTokens } from "@/lib/motion/tokens";
import { AnimatePresence, m } from "@/lib/motion/m";
import type { ExperienceAction, ExperienceState } from "@/lib/experience/types";

type Phase = "beat" | "aside" | "letter";

const BEAT_HOLD_MS = 1300;
const ASIDE_HOLD_MS = 1100;
const STAGGER_SECONDS = 0.11;

export function PrologueScene({
  state,
  dispatch,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
}) {
  const [beatLine, asideLine] = experienceCopy.prologue.bridge.map((line) =>
    interpolate(line, { name: state.preferredName }),
  );
  const [phase, setPhase] = useState<Phase>("beat");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const toAside = setTimeout(() => setPhase("aside"), BEAT_HOLD_MS);
    const toLetter = setTimeout(() => setPhase("letter"), BEAT_HOLD_MS + ASIDE_HOLD_MS);
    return () => {
      clearTimeout(toAside);
      clearTimeout(toLetter);
    };
  }, []);

  useEffect(() => {
    if (phase !== "letter") return;
    const totalMs = (experienceCopy.prologue.letter.length - 1) * STAGGER_SECONDS * 1000 + 600;
    const id = setTimeout(() => setRevealed(true), totalMs);
    return () => clearTimeout(id);
  }, [phase]);

  return (
    <div className="flex min-h-[60vh] flex-col justify-center gap-7 px-4">
      <h1 className="sr-only">A letter for you</h1>

      <AnimatePresence mode="wait">
        {phase === "beat" && (
          <m.p
            key="beat"
            className="font-display text-[clamp(2.1rem,9vw,3rem)] leading-tight text-ink"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.55, ease: motionTokens.component.ease }}
          >
            {beatLine}
          </m.p>
        )}

        {phase === "aside" && (
          <m.div
            key="aside"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: motionTokens.component.ease }}
            className="flex flex-col gap-2"
          >
            <p className="font-display text-lg text-ink-muted">{beatLine}</p>
            <p className="font-display text-2xl text-ink italic">{asideLine}</p>
          </m.div>
        )}

        {phase === "letter" && (
          <m.div
            key="letter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex max-w-[34ch] flex-col gap-4"
          >
            {experienceCopy.prologue.letter.map((paragraph, index) => (
              <m.p
                key={index}
                className="text-[17px] leading-relaxed text-ink"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: index * STAGGER_SECONDS, ease: motionTokens.component.ease }}
              >
                {paragraph}
              </m.p>
            ))}
          </m.div>
        )}
      </AnimatePresence>

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
