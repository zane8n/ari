import { describe, expect, it } from "vitest";
import { actionForegroundContrast, MIN_ACTION_CONTRAST, THEME_IDS, THEME_LIST } from "@/lib/theme/themes";

describe("theme registry", () => {
  it("has exactly 12 themes with unique ids", () => {
    expect(THEME_IDS.length).toBe(12);
    expect(new Set(THEME_IDS).size).toBe(12);
  });

  it("includes the cheeky Not Pink option", () => {
    expect(THEME_LIST.some((theme) => theme.id === "not-pink")).toBe(true);
  });

  it("every theme's action foreground meets WCAG AA contrast against accent-strong", () => {
    for (const theme of THEME_LIST) {
      const contrast = actionForegroundContrast(theme);
      expect(contrast, `${theme.displayName} contrast was ${contrast.toFixed(2)}`).toBeGreaterThanOrEqual(
        MIN_ACTION_CONTRAST,
      );
    }
  });

  it("every theme carries a full token set", () => {
    for (const theme of THEME_LIST) {
      expect(theme.tokens.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.tokens.accentStrong).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.tokens.accentSoft).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.tokens.accentMist).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.tokens.accentGlow).toMatch(/^rgba\(/);
    }
  });
});
