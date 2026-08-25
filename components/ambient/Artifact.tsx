"use client";

import { forwardRef } from "react";
import type { ArtifactKind, ArtifactPlacement } from "@/lib/ambient/layout";
import {
  CompassIcon,
  HeartSparkIcon,
  MapTrailIcon,
  RibbonBadgeIcon,
  RoseIcon,
  SprigIcon,
  VineCornerIcon,
} from "@/components/icons/Decorative";
import { type MotionValue, m, useTransform } from "@/lib/motion/m";

const SHAPES: Record<ArtifactKind, (props: { className?: string }) => React.JSX.Element> = {
  pebble: SprigIcon,
  ribbon: RibbonBadgeIcon,
  halo: HeartSparkIcon,
  route: CompassIcon,
  seal: RoseIcon,
  vine: VineCornerIcon,
  trail: MapTrailIcon,
};

/** Foliage sways rather than drifting flat — it reads more alive. */
const SWAY_KINDS = new Set<ArtifactKind>(["pebble", "seal", "vine"]);

type ArtifactProps = {
  placement: ArtifactPlacement;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  illuminated: boolean;
};

export const Artifact = forwardRef<HTMLDivElement, ArtifactProps>(function Artifact(
  { placement, pointerX, pointerY, illuminated },
  ref,
) {
  const Shape = SHAPES[placement.kind];
  const x = useTransform(pointerX, (value) => value * placement.pointerMultiplier);
  const y = useTransform(pointerY, (value) => value * placement.pointerMultiplier);

  return (
    <m.div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        top: `${placement.topPercent}%`,
        left: `${placement.leftPercent}%`,
        width: placement.sizePx,
        height: placement.sizePx,
        color: "var(--accent)",
        x,
        y,
        opacity: illuminated ? 0.8 : 0.4,
        filter: illuminated ? "drop-shadow(0 0 10px var(--accent-glow))" : "drop-shadow(0 0 4px var(--accent-glow))",
        transition: "opacity 420ms ease-out, filter 420ms ease-out",
      }}
    >
      <div
        className={`ambient-drift h-full w-full ${SWAY_KINDS.has(placement.kind) ? "ambient-sway" : ""}`}
        style={
          {
            "--drift-duration": `${placement.driftSeconds}s`,
            "--drift-delay": `${placement.driftDelaySeconds}s`,
            "--drift-x": `${placement.driftXPx}px`,
            "--drift-y": `${placement.driftYPx}px`,
          } as React.CSSProperties
        }
      >
        <Shape className="h-full w-full" />
      </div>
    </m.div>
  );
});
