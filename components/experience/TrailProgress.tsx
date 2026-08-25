"use client";

import { illuminatedCharms } from "@/lib/ambient/milestones";
import type { ExperienceState } from "@/lib/experience/types";
import { m } from "@/lib/motion/m";

/** Narrative order: arrival -> affection -> play -> the vacation -> commitment. */
const TRAIL_ORDER = ["pebble", "halo", "ribbon", "route", "seal"] as const;

export function TrailProgress({ state }: { state: ExperienceState }) {
  if (state.stage === "arrival" || state.stage === "reveal") return null;

  const illuminated = illuminatedCharms(state);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center"
      style={{ top: "calc(0.9rem + var(--safe-t))" }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5" style={{ opacity: 0.85 }}>
        {TRAIL_ORDER.map((kind, index) => {
          const reached = illuminated[kind];
          return (
            <div key={kind} className="flex items-center gap-2">
              {index > 0 && (
                <div
                  className="h-px w-4"
                  style={{
                    background: reached ? "var(--accent)" : "var(--hairline)",
                    transition: "background 400ms ease-out",
                  }}
                />
              )}
              <m.span
                className="block h-[7px] w-[7px]"
                style={{
                  background: reached ? "var(--accent)" : "transparent",
                  border: `1px solid ${reached ? "var(--accent)" : "var(--hairline)"}`,
                  boxShadow: reached ? "0 0 8px var(--accent-glow)" : "none",
                }}
                animate={{ scale: reached ? [1, 1.35, 1] : 1 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
