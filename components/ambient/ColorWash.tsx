"use client";

import { useEffect, useState } from "react";
import { motionTokens } from "@/lib/motion/tokens";
import { applyThemeTokens } from "@/lib/theme/apply";
import type { ThemeRecord } from "@/lib/theme/themes";
import { AnimatePresence, m } from "@/lib/motion/m";

export type WashRequest = { id: number; theme: ThemeRecord; originX: number; originY: number };

function coverageDiameter(x: number, y: number): number {
  if (typeof window === "undefined") return 0;
  const farthestX = Math.max(x, window.innerWidth - x);
  const farthestY = Math.max(y, window.innerHeight - y);
  return 2 * Math.hypot(farthestX, farthestY);
}

/**
 * Tokens switch the instant the wash starts growing (not when it finishes),
 * so the circle itself renders in the new accent and, once it fully covers
 * the viewport, fading it out reveals content that already matches — no
 * flash of the old theme (section 15.4).
 */
export function ColorWash({ request, reducedMotion }: { request: WashRequest | null; reducedMotion: boolean }) {
  const [active, setActive] = useState<WashRequest | null>(null);
  const [prevRequest, setPrevRequest] = useState<WashRequest | null>(null);

  // Adjusting state from a changed prop, done during render per React's documented pattern —
  // not in an effect, so a new request never causes a double render before the wash appears.
  if (request !== prevRequest) {
    setPrevRequest(request);
    if (request && !reducedMotion) setActive(request);
  }

  useEffect(() => {
    if (request) applyThemeTokens(request.theme);
  }, [request]);

  useEffect(() => {
    if (!active) return;
    const totalMs = (motionTokens.colorWash.duration + motionTokens.colorWashSettle.duration) * 1000;
    const timeout = setTimeout(() => setActive(null), totalMs);
    return () => clearTimeout(timeout);
  }, [active]);

  if (reducedMotion) return null;

  return (
    <AnimatePresence>
      {active && (
        <m.div
          key={active.id}
          aria-hidden="true"
          className="pointer-events-none fixed z-40 rounded-full"
          style={{
            left: active.originX,
            top: active.originY,
            translateX: "-50%",
            translateY: "-50%",
            background: "var(--accent-soft)",
          }}
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{
            width: coverageDiameter(active.originX, active.originY),
            height: coverageDiameter(active.originX, active.originY),
            opacity: [1, 1, 0],
          }}
          transition={{
            width: { duration: motionTokens.colorWash.duration, ease: motionTokens.colorWash.ease },
            height: { duration: motionTokens.colorWash.duration, ease: motionTokens.colorWash.ease },
            opacity: {
              duration: motionTokens.colorWash.duration + motionTokens.colorWashSettle.duration,
              times: [0, 0.75, 1],
            },
          }}
        />
      )}
    </AnimatePresence>
  );
}
