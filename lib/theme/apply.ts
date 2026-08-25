"use client";

import type { ThemeRecord } from "./themes";

let metaThemeColor: HTMLMetaElement | null = null;

function getMetaThemeColor(): HTMLMetaElement {
  if (metaThemeColor) return metaThemeColor;
  const existing = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  metaThemeColor = existing ?? document.createElement("meta");
  if (!existing) {
    metaThemeColor.setAttribute("name", "theme-color");
    document.head.appendChild(metaThemeColor);
  }
  return metaThemeColor;
}

/**
 * Writes the selected theme's tokens onto the document root. accent-strong/
 * soft/mist/glow derive automatically from --accent via color-mix() in
 * globals.css; only the two values that aren't a pure mix (the raw accent
 * and the contrast-picked action foreground) are set here.
 */
export function applyThemeTokens(theme: ThemeRecord): void {
  const root = document.documentElement;
  root.style.setProperty("--accent", theme.tokens.accent);
  root.style.setProperty("--accent-foreground", theme.actionForeground);
  root.dataset.theme = theme.id;
  getMetaThemeColor().setAttribute("content", theme.tokens.accentMist);
}
