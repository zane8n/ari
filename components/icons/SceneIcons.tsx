import type { SVGProps } from "react";

/** Tier 1 icon set (section 5.4): 24x24 viewBox, 1.5px rounded strokes, one optical weight, no filled emoji style. */
const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function SealIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.5c1.2 1.6 2.4 1.6 3.5 0.4 1.1 1.2 2.3 1.2 3.5-0.4" />
    </svg>
  );
}

export function ColorDropIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c3 3.6 6 7.2 6 10.6a6 6 0 1 1-12 0c0-3.4 3-7 6-10.6Z" />
    </svg>
  );
}

export function LetterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4.5 7 12 13l7.5-6" />
    </svg>
  );
}

export function CoinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="8.5" rx="7" ry="3.2" />
      <path d="M5 8.5v7c0 1.77 3.13 3.2 7 3.2s7-1.43 7-3.2v-7" />
      <path d="M5 12.2c0 1.77 3.13 3.2 7 3.2s7-1.43 7-3.2" />
    </svg>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5Z" />
    </svg>
  );
}

export function DinnerSettingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M5 4v5a1.5 1.5 0 0 0 3 0V4" />
      <path d="M6.5 9v11" />
      <path d="M18.5 4c-1.4 0-2.2 1.2-2.2 3s.8 3 2.2 3v9" />
    </svg>
  );
}

export function RouteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="6" r="2" />
      <path d="M6.7 16.6C11 12 9 8 12 6s6-1 6.6.4" strokeDasharray="1 4.2" />
    </svg>
  );
}

export function SuitcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="8" width="17" height="12" rx="2.2" />
      <path d="M9 8V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2" />
      <path d="M3.5 13h17" />
    </svg>
  );
}

export function EnvelopeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="6" width="17" height="12.5" rx="2" />
      <path d="M4.5 7.5 12 13l7.5-5.5" />
    </svg>
  );
}

export function InvitationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.8" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
    </svg>
  );
}
