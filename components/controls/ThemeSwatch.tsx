"use client";

import { useRef } from "react";
import type { ThemeRecord } from "@/lib/theme/themes";

type ThemeSwatchProps = {
  theme: ThemeRecord;
  checked: boolean;
  /** Reports selection + tap origin; the parent scene decides when/whether to actually apply + wash. */
  onSelect: (theme: ThemeRecord, origin: { x: number; y: number }) => void;
};

export function ThemeSwatch({ theme, checked, onSelect }: ThemeSwatchProps) {
  const ref = useRef<HTMLLabelElement>(null);

  function handleChange(): void {
    const rect = ref.current?.getBoundingClientRect();
    const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: 0, y: 0 };
    onSelect(theme, origin);
  }

  return (
    <label
      ref={ref}
      className="choice-tile flex min-h-[68px] cursor-pointer flex-col items-start gap-2 px-4 py-3"
      data-selected={checked}
    >
      <input type="radio" name="theme" value={theme.id} checked={checked} onChange={handleChange} className="sr-only" />
      <span
        aria-hidden="true"
        className="h-9 w-9 rounded-full border"
        style={{
          background: theme.accent,
          borderColor: "var(--hairline)",
          boxShadow: "inset 0 2px 3px rgb(255 255 255 / 0.35), inset 0 -2px 4px rgb(0 0 0 / 0.14)",
        }}
      />
      <span className="text-[14.5px] font-semibold text-ink">{theme.displayName}</span>
    </label>
  );
}
