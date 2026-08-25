"use client";

import type { Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { SealIcon } from "@/components/icons/SceneIcons";
import type { ExperienceAction } from "@/lib/experience/types";

export function ArrivalScene({ dispatch }: { dispatch: Dispatch<ExperienceAction> }) {
  return (
    <div
      role="group"
      aria-label={experienceCopy.arrival.ariaLabel}
      className="glass-surface flex flex-col items-center gap-6 px-7 py-10 text-center"
    >
      <SealIcon className="h-8 w-8 text-accent-strong" />
      <h1 className="font-display text-[clamp(2.35rem,8.8vw,2.6rem)] leading-[1.02] text-ink">
        {experienceCopy.arrival.title}
      </h1>
      <p className="text-base leading-relaxed text-ink-muted">{experienceCopy.arrival.body}</p>
      <GlassAction
        variant="primary"
        trailingArrow
        onClick={() => dispatch({ type: "arrived", at: new Date().toISOString() })}
      >
        {experienceCopy.arrival.action}
      </GlassAction>
    </div>
  );
}
