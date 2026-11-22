import { CANVAS, INK, isThemeId, THEMES, type ThemeId } from "@/lib/theme/themes";
import { mix } from "@/lib/theme/color";

/**
 * The trip tracker reuses the invitation's twelve palettes. Each person
 * picks their own on their own device; the choice lives in a plain cookie
 * so the server can render the right colours on the first paint.
 */
export const TRIP_THEME_COOKIE = "trip_theme";
export const HOST_DEFAULT_THEME: ThemeId = "lagoon-kiss";
export const GUEST_DEFAULT_THEME: ThemeId = "not-pink";

export function resolveTripTheme(value: string | null | undefined, fallback: ThemeId): ThemeId {
  return value && isThemeId(value) ? value : fallback;
}

/** CSS custom properties for one palette, laid over the shared moonlit-petal canvas. */
export function tripThemeVars(id: ThemeId): Record<string, string> {
  const theme = THEMES[id];
  return {
    "--t-canvas": CANVAS,
    "--t-ink": INK,
    "--t-accent": theme.tokens.accent,
    "--t-sea": theme.tokens.accentStrong,
    "--t-sea-strong": mix(theme.tokens.accentStrong, INK, 78),
    "--t-sea-soft": theme.tokens.accentMist,
    "--t-wash": theme.tokens.accentSoft,
    "--t-glow": theme.tokens.accentGlow,
    "--t-on-accent": theme.actionForeground,
  };
}

/** Remembers this device's choice for a year (a preference, not a secret). */
export function saveTripTheme(id: ThemeId): void {
  document.cookie = `${TRIP_THEME_COOKIE}=${id}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}
