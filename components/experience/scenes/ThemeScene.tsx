"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Dispatch } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import { CANVAS, INK, THEME_LIST, getTheme, type ThemeId, type ThemeRecord } from "@/lib/theme/themes";
import { mix } from "@/lib/theme/color";
import type { ExperienceAction, ExperienceState } from "@/lib/experience/types";

const PREVIEW_DELAY_MS = 700;
/** A dim-but-still-AA (5.0:1) ink/canvas blend — plain opacity on ink text drops below 4.5:1. */
const DIMMED_LABEL_COLOR = mix(INK, CANVAS, 65);

export function ThemeScene({
  state,
  dispatch,
  onPreviewTheme,
}: {
  state: ExperienceState;
  dispatch: Dispatch<ExperienceAction>;
  onPreviewTheme: (theme: ThemeRecord, origin: { x: number; y: number }) => void;
}) {
  const initialThemeId = state.themeId ?? THEME_LIST[0].id;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<ThemeId, HTMLLabelElement>());
  const activeIdRef = useRef<ThemeId>(initialThemeId);
  const [activeId, setActiveId] = useState<ThemeId>(initialThemeId);
  const [canConfirm, setCanConfirm] = useState(state.themeId !== null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function commitPreview(theme: ThemeRecord, origin: { x: number; y: number }): void {
    setCanConfirm(false);
    onPreviewTheme(theme, origin);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCanConfirm(true), PREVIEW_DELAY_MS);
  }

  // Scroll the already-chosen (or first) swatch into view once, without animating.
  useLayoutEffect(() => {
    const el = itemRefs.current.get(activeIdRef.current);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let raf = 0;

    function handleScroll(): void {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!scroller) return;
        const rect = scroller.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        let nearestId: ThemeId | null = null;
        let nearestDistance = Infinity;

        itemRefs.current.forEach((el, id) => {
          const itemRect = el.getBoundingClientRect();
          const distance = Math.abs(itemRect.left + itemRect.width / 2 - centerX);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestId = id;
          }
        });

        if (nearestId && nearestId !== activeIdRef.current) {
          activeIdRef.current = nearestId;
          setActiveId(nearestId);
          const theme = getTheme(nearestId);
          const el = itemRefs.current.get(nearestId);
          if (el) {
            const itemRect = el.getBoundingClientRect();
            commitPreview(theme, { x: itemRect.left + itemRect.width / 2, y: itemRect.top + itemRect.height / 2 });
          }
        }
      });
    }

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTheme(id: ThemeId, smooth: boolean): void {
    activeIdRef.current = id;
    setActiveId(id);
    const el = itemRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: smooth ? "smooth" : "auto" });
      const itemRect = el.getBoundingClientRect();
      commitPreview(getTheme(id), { x: itemRect.left + itemRect.width / 2, y: itemRect.top + itemRect.height / 2 });
    }
  }

  function handleConfirm(): void {
    if (!canConfirm) return;
    dispatch({ type: "themeSelected", themeId: activeId });
  }

  return (
    <div className="flex flex-col gap-8 px-4">
      <h1 className="font-display text-[clamp(1.9rem,7.5vw,2.5rem)] leading-[1.05] text-ink">
        {experienceCopy.setTheMood.themePrompt}
      </h1>

      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[calc(50%-56px)] py-4"
        style={{ scrollbarWidth: "none" }}
      >
        {THEME_LIST.map((theme) => {
          const isActive = theme.id === activeId;
          return (
            <label
              key={theme.id}
              ref={(el) => {
                if (el) itemRefs.current.set(theme.id, el);
                return () => {
                  itemRefs.current.delete(theme.id);
                };
              }}
              className="flex shrink-0 snap-center flex-col items-center gap-3"
              style={{ width: 112 }}
            >
              <input
                type="radio"
                name="theme"
                value={theme.id}
                checked={isActive}
                onChange={() => selectTheme(theme.id, true)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 96 : 68,
                  height: isActive ? 96 : 68,
                  background: theme.accent,
                  boxShadow: isActive
                    ? `0 0 34px -4px ${theme.tokens.accentGlow}, inset 0 3px 6px rgb(255 255 255 / 0.4), inset 0 -3px 8px rgb(0 0 0 / 0.16)`
                    : "inset 0 2px 3px rgb(255 255 255 / 0.35), inset 0 -2px 4px rgb(0 0 0 / 0.14)",
                  opacity: isActive ? 1 : 0.55,
                }}
              />
              <span
                className="text-center text-[13.5px] leading-tight font-semibold transition-colors duration-300"
                style={{ color: isActive ? "var(--ink)" : DIMMED_LABEL_COLOR }}
              >
                {theme.displayName}
              </span>
            </label>
          );
        })}
      </div>

      <p className="text-center text-sm text-ink-muted italic">{getTheme(activeId).character}</p>

      <GlassAction
        variant="primary"
        trailingArrow
        disabled={!canConfirm}
        onClick={handleConfirm}
        className="self-center"
      >
        {experienceCopy.setTheMood.keepThisOne}
      </GlassAction>
    </div>
  );
}
