"use client";

import { forwardRef } from "react";
import type { ArtifactKind, ArtifactPlacement } from "@/lib/ambient/layout";
import { type MotionValue, m, useTransform } from "@/lib/motion/m";

function PebbleShape() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 3c7 0 15 4 16.5 12 1.4 7.4-4.4 13-11 16.6-6.8 3.7-15.3 3-19-3.4C2.6 21.8 4 13.7 10 8.2 13.4 5 16.2 3 20 3Z"
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        strokeOpacity="0.35"
      />
    </svg>
  );
}

function RibbonShape() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M6 12 L34 8 L30 20 L36 32 L10 28 L14 20 Z" fill="var(--accent-soft)" opacity="0.9" />
      <path d="M6 12 L20 16 L14 20 L10 28 Z" fill="var(--accent)" opacity="0.35" />
    </svg>
  );
}

function HaloShape() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <ellipse cx="20" cy="20" rx="16" ry="11" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1.5" />
    </svg>
  );
}

function RouteShape() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M6 30 C 14 10, 26 30, 34 10" stroke="var(--accent)" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 6" />
      <circle cx="6" cy="30" r="2.5" fill="var(--accent)" fillOpacity="0.5" />
      <circle cx="34" cy="10" r="2.5" fill="var(--accent)" fillOpacity="0.5" />
    </svg>
  );
}

function SealShape() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="13" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M14 21 Q20 26 26 19" stroke="var(--accent)" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const SHAPES: Record<ArtifactKind, () => React.JSX.Element> = {
  pebble: PebbleShape,
  ribbon: RibbonShape,
  halo: HaloShape,
  route: RouteShape,
  seal: SealShape,
};

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
        x,
        y,
        opacity: illuminated ? 1 : 0.55,
        filter: illuminated ? "drop-shadow(0 0 10px var(--accent-glow))" : "none",
        transition: "opacity 420ms ease-out, filter 420ms ease-out",
      }}
    >
      <div
        className={`ambient-drift h-full w-full ${placement.kind === "halo" ? "ambient-rotate" : ""}`}
        style={
          {
            "--drift-duration": `${placement.driftSeconds}s`,
            "--drift-delay": `${placement.driftDelaySeconds}s`,
            "--drift-x": `${placement.driftXPx}px`,
            "--drift-y": `${placement.driftYPx}px`,
          } as React.CSSProperties
        }
      >
        <Shape />
      </div>
    </m.div>
  );
});
