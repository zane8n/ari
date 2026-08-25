import type { SVGProps } from "react";

/**
 * Botanical / romance / adventure decorative marks — thin, hand-drawn-style
 * linework, always aria-hidden. These carry the "vines, flowers, roses,
 * love and adventure icons, maps" texture the ambient/decorative system
 * needs; distinct from the functional Tier-1 icon set in SceneIcons.tsx.
 */
const base: SVGProps<SVGSVGElement> = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function SprigIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" {...base} {...props}>
      <path d="M20 36V10" />
      <path d="M20 22c-4-1-7-4-7-9 4 0 7 3 7 7" />
      <path d="M20 16c4-1 7-4 7-9-4 0-7 3-7 7" />
      <path d="M20 30c-3-1-5-3-5-7 3 0 5 2 5 5" />
      <path d="M20 26c3-1 5-3 5-7-3 0-5 2-5 5" />
    </svg>
  );
}

export function RoseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" {...base} {...props}>
      <path d="M20 22a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
      <path d="M20 22a4 4 0 1 1 0-8" />
      <path d="M20 22c0 6-1 9-5 12" />
      <path d="M20 22c0 6 1 9 5 12" />
      <path d="M13 30c-2 1-3 1-5 0" />
      <path d="M27 30c2 1 3 1 5 0" />
    </svg>
  );
}

export function VineCornerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <path d="M4 4c14 0 24 8 28 22" />
      <path d="M10 6c2 4 2 7-1 10" />
      <path d="M17 10c1 4 0 7-3 9" />
      <path d="M24 16c1 4 0 7-3 9" />
      <path d="M30 24c1 4 0 7-3 9" />
    </svg>
  );
}

export function HeartSparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" {...base} {...props}>
      <path d="M20 30c-8-5-13-10-13-16a7 7 0 0 1 13-4 7 7 0 0 1 13 4c0 6-5 11-13 16Z" />
    </svg>
  );
}

export function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" {...base} {...props}>
      <circle cx="20" cy="20" r="14" />
      <path d="M25 15l-3 8-8 3 3-8 8-3Z" />
      <circle cx="20" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MapTrailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" {...base} {...props}>
      <path d="M6 30c6-3 6-9 12-9s6 6 12 6 6-8 4-14" strokeDasharray="1 5" />
      <circle cx="6" cy="30" r="2" fill="currentColor" stroke="none" />
      <circle cx="34" cy="13" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} strokeWidth={1} {...props}>
      <path d="M12 2c0 4 1 8 5 10-4 2-5 6-5 10-0-4-1-8-5-10 4-2 5-6 5-10Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RibbonBadgeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" {...base} {...props}>
      <circle cx="20" cy="14" r="9" />
      <path d="M14 21l-3 15 9-5 9 5-3-15" />
    </svg>
  );
}
