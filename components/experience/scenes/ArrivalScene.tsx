"use client";

import type { Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { SprigIcon } from "@/components/icons/Decorative";
import { m } from "@/lib/motion/m";
import { motionTokens } from "@/lib/motion/tokens";
import type { ExperienceAction } from "@/lib/experience/types";

export function ArrivalScene({ dispatch }: { dispatch: Dispatch<ExperienceAction> }) {
  return (
    <div
      role="group"
      aria-label={experienceCopy.arrival.ariaLabel}
      className="flex flex-col items-center gap-7 px-4 text-center"
    >
      <m.div
        initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
        animate={{ opacity: 0.85, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: motionTokens.component.ease }}
      >
        <SprigIcon className="h-10 w-10 text-accent-strong" />
      </m.div>
      <m.h1
        className="font-display text-[clamp(2.4rem,9vw,3.1rem)] leading-[1.05] text-ink"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: motionTokens.component.ease }}
      >
        {experienceCopy.arrival.title}
      </m.h1>
      <m.p
        className="max-w-[30ch] text-base leading-relaxed text-ink-muted"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.32, ease: motionTokens.component.ease }}
      >
        {experienceCopy.arrival.body}
      </m.p>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: motionTokens.component.ease }}
      >
        <GlassAction
          variant="primary"
          trailingArrow
          onClick={() => dispatch({ type: "arrived", at: new Date().toISOString() })}
        >
          {experienceCopy.arrival.action}
        </GlassAction>
      </m.div>
    </div>
  );
}
