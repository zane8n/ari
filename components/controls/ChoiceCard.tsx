"use client";

import type { ReactNode } from "react";

type ChoiceCardProps = {
  /** Explicit — never inferred from the label text (section 17: ChoiceCard "must not do"). */
  as: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
};

function CheckGlyph({ checked, shape }: { checked: boolean; shape: "circle" | "square" }) {
  return (
    <span
      aria-hidden="true"
      className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center border transition-colors"
      style={{
        borderRadius: shape === "circle" ? "999px" : "6px",
        borderColor: checked ? "var(--accent)" : "var(--hairline)",
        background: checked ? "var(--accent)" : "transparent",
      }}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7"
            stroke="var(--canvas)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

export function ChoiceCard({ as, name, value, checked, onChange, label, icon, disabled }: ChoiceCardProps) {
  return (
    <label
      className="choice-tile flex cursor-pointer items-center gap-3 px-4 py-3"
      data-selected={checked}
    >
      <input
        type={as}
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="text-[15.5px] leading-snug font-semibold text-ink">{label}</span>
      <CheckGlyph checked={checked} shape={as === "radio" ? "circle" : "square"} />
    </label>
  );
}
