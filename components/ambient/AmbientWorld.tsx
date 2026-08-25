"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { illuminatedCharms } from "@/lib/ambient/milestones";
import { buildAmbientLayout } from "@/lib/ambient/layout";
import { stageAmbientIntensity } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/m";
import { useLowPerformanceMode } from "@/lib/performance/useLowPerformanceMode";
import type { ExperienceState } from "@/lib/experience/types";
import { Artifact } from "./Artifact";
import { usePointerMotion } from "./PointerMotionProvider";

export function AmbientWorld({ state }: { state: ExperienceState }) {
  const { x, y } = usePointerMotion();
  const reducedMotion = useReducedMotion();
  const lowPerformance = useLowPerformanceMode();
  const [hidden, setHidden] = useState(false);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());

  const placements = useMemo(
    () => buildAmbientLayout(state.inviteId, !lowPerformance),
    [state.inviteId, lowPerformance],
  );
  const illuminated = useMemo(() => illuminatedCharms(state), [state]);
  const intensity = stageAmbientIntensity[state.stage];

  useEffect(() => {
    function handleVisibility(): void {
      setHidden(document.visibilityState === "hidden");
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    function handleTouch(event: TouchEvent): void {
      const touch = event.touches[0];
      if (!touch) return;
      const point = { x: touch.clientX, y: touch.clientY };

      const ripple = document.createElement("div");
      ripple.className = "pointer-events-none fixed rounded-full";
      ripple.style.cssText = `left:${point.x}px; top:${point.y}px; width:64px; height:64px; margin-left:-32px; margin-top:-32px; background: var(--accent-mist); z-index: 5; animation: ripple-out 520ms ease-out forwards;`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 560);

      let nearestId: string | null = null;
      let nearestDistance = Infinity;
      nodeRefs.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const distance = Math.hypot(center.x - point.x, center.y - point.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = id;
        }
      });

      const nearestEl = nearestId ? nodeRefs.current.get(nearestId) : null;
      nearestEl?.animate(
        [
          { transform: "translate(0px, 0px)" },
          { transform: "translate(6px, -6px)" },
          { transform: "translate(0px, 0px)" },
        ],
        { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }

    window.addEventListener("touchstart", handleTouch, { passive: true });
    return () => window.removeEventListener("touchstart", handleTouch);
  }, [reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 overflow-hidden ${hidden ? "ambient-paused" : ""}`}
      style={{ opacity: intensity, transition: "opacity 600ms ease-out" }}
    >
      {placements.map((placement) => (
        <Artifact
          key={placement.id}
          ref={(el) => {
            if (el) nodeRefs.current.set(placement.id, el);
            return () => {
              nodeRefs.current.delete(placement.id);
            };
          }}
          placement={placement}
          pointerX={x}
          pointerY={y}
          illuminated={illuminated[placement.kind] ?? false}
        />
      ))}
    </div>
  );
}
