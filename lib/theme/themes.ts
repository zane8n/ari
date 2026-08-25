import { contrastRatio, mix, pickContrastSafeForeground, rgbToRgba, hexToRgb } from "./color";

export const THEME_IDS = [
  "emerald",
  "sage",
  "forest",
  "teal",
  "petrol",
  "cobalt",
  "midnight",
  "burgundy",
  "aubergine",
  "espresso",
  "onyx",
  "champagne",
  "burnished-gold",
  "slate",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeRecord = {
  id: ThemeId;
  displayName: string;
  character: string;
  accent: string;
  tokens: {
    accent: string;
    accentStrong: string;
    accentSoft: string;
    accentMist: string;
    accentGlow: string;
  };
  actionForeground: string;
};

export const CANVAS = "#F8F4EC";
export const INK = "#27231F";
const IVORY_FOREGROUND = "#F8F4EC";
const INK_FOREGROUND = "#27231F";

/** Minimum WCAG AA contrast for normal-weight action label text. */
export const MIN_ACTION_CONTRAST = 4.5;

type ThemeSeed = { id: ThemeId; displayName: string; accent: string; character: string };

const THEME_SEEDS: readonly ThemeSeed[] = [
  { id: "emerald", displayName: "Emerald", accent: "#2F7D66", character: "Rich green with calm clarity" },
  { id: "sage", displayName: "Sage", accent: "#7E9C76", character: "Soft botanical, quiet and airy" },
  { id: "forest", displayName: "Forest", accent: "#355E4A", character: "Deep grounded green" },
  { id: "teal", displayName: "Teal", accent: "#2E7C78", character: "Balanced blue-green, refined" },
  { id: "petrol", displayName: "Petrol Blue", accent: "#2D6673", character: "Moody, expensive blue-green" },
  { id: "cobalt", displayName: "Cobalt", accent: "#4169A1", character: "Clean vivid blue, deliberately softened" },
  { id: "midnight", displayName: "Midnight Blue", accent: "#2E3B59", character: "Dark, calm and cinematic" },
  { id: "burgundy", displayName: "Burgundy", accent: "#7A3E4D", character: "Warm wine red without drifting pink" },
  { id: "aubergine", displayName: "Aubergine", accent: "#5B405F", character: "Muted purple-black, intimate" },
  { id: "espresso", displayName: "Espresso", accent: "#5A463A", character: "Warm brown with grounded luxury" },
  { id: "onyx", displayName: "Onyx", accent: "#3C4147", character: "Soft black-charcoal, never absolute black" },
  { id: "champagne", displayName: "Champagne", accent: "#B99B6B", character: "Pale warm metallic impression" },
  { id: "burnished-gold", displayName: "Burnished Gold", accent: "#A98447", character: "Muted gold with depth" },
  { id: "slate", displayName: "Slate", accent: "#667381", character: "Cool neutral blue-grey" },
];

/**
 * Starts at 82% accent / 18% ink (the documented token contract) and, only
 * for lighter accents where that isn't dark enough, progressively mixes in
 * more ink until accent-strong actually clears WCAG AA against ivory text —
 * "pick whichever foreground contrasts better" isn't good enough on its own
 * because both candidates can still fail against a mid-luminance accent.
 */
function darkenUntilAccessible(accent: string): string {
  let accentMixPercent = 82;
  let accentStrong = mix(accent, INK, accentMixPercent);

  while (contrastRatio(accentStrong, IVORY_FOREGROUND) < MIN_ACTION_CONTRAST && accentMixPercent > 45) {
    accentMixPercent -= 4;
    accentStrong = mix(accent, INK, accentMixPercent);
  }

  return accentStrong;
}

function buildTheme(seed: ThemeSeed): ThemeRecord {
  const accentStrong = darkenUntilAccessible(seed.accent);
  const accentSoft = mix(seed.accent, CANVAS, 14);
  const accentMist = mix(seed.accent, CANVAS, 7);
  const accentGlow = rgbToRgba(hexToRgb(seed.accent), 0.24);
  const actionForeground = pickContrastSafeForeground(accentStrong, [IVORY_FOREGROUND, INK_FOREGROUND]);

  return {
    id: seed.id,
    displayName: seed.displayName,
    character: seed.character,
    accent: seed.accent,
    tokens: {
      accent: seed.accent,
      accentStrong,
      accentSoft,
      accentMist,
      accentGlow,
    },
    actionForeground,
  };
}

export const THEMES: Record<ThemeId, ThemeRecord> = Object.fromEntries(
  THEME_SEEDS.map((seed) => [seed.id, buildTheme(seed)]),
) as Record<ThemeId, ThemeRecord>;

export const THEME_LIST: readonly ThemeRecord[] = THEME_SEEDS.map((seed) => THEMES[seed.id]);

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}

export function getTheme(id: ThemeId): ThemeRecord {
  return THEMES[id];
}

export function actionForegroundContrast(theme: ThemeRecord): number {
  return contrastRatio(theme.tokens.accentStrong, theme.actionForeground);
}
