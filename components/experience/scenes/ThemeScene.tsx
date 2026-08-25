"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { ThemeSwatch } from "@/components/controls/ThemeSwatch";
import { THEME_LIST, type ThemeRecord } from "@/lib/theme/themes";
import type { ExperienceAction, ExperienceState } from "@/lib/experience/types";

const PREVIEW_DELAY_MS = 700;

export function ThemeScene({
  state,
  dispatch,
  onPreviewTheme,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
  onPreviewTheme: (theme: ThemeRecord, origin: { x: number; y: number }) => void;
}) {
  const [previewedId, setPreviewedId] = useState(state.themeId);
  const [canConfirm, setCanConfirm] = useState(state.themeId !== null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleSelect(theme: ThemeRecord, origin: { x: number; y: number }): void {
    setPreviewedId(theme.id);
    setCanConfirm(false);
    onPreviewTheme(theme, origin);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCanConfirm(true), PREVIEW_DELAY_MS);
  }

  function handleConfirm(): void {
    if (!previewedId || !canConfirm) return;
    dispatch({ type: "themeSelected", themeId: previewedId });
  }

  return (
    <div className="glass-surface flex flex-col gap-7 px-6 py-9">
      <h1 className="font-display text-[clamp(1.9rem,7vw,2.4rem)] leading-[1.04] text-ink">
        {experienceCopy.setTheMood.themePrompt}
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {THEME_LIST.map((theme) => (
          <ThemeSwatch key={theme.id} theme={theme} checked={previewedId === theme.id} onSelect={handleSelect} />
        ))}
      </div>
      <GlassAction
        variant="primary"
        trailingArrow
        disabled={!canConfirm}
        onClick={handleConfirm}
        className="self-end"
      >
        {experienceCopy.setTheMood.keepThisOne}
      </GlassAction>
    </div>
  );
}
