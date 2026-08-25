import { contrastRatio, mix, pickContrastSafeForeground, rgbToRgba, hexToRgb } from "./color";

export const THEME_IDS = [
  "not-pink",
  "poppy-kiss",
  "peach-bellini",
  "golden-hour",
  "champagne-fizz",
  "mint-crush",
  "lagoon-kiss",
  "sky-flirt",
  "lilac-dream",
  "violet-hour",
  "plum-fizz",
  "rose-gold",
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

/** Moonlit-petal white and deep romantic plum — the mystical base every theme sits on. */
export const CANVAS = "#FBF2F8";
export const INK = "#2B1830";
const IVORY_FOREGROUND = "#FBF2F8";
const INK_FOREGROUND = "#2B1830";

/** Minimum WCAG AA contrast for normal-weight action label text. */
export const MIN_ACTION_CONTRAST = 4.5;

type ThemeSeed = { id: ThemeId; displayName: string; accent: string; character: string };

const THEME_SEEDS: readonly ThemeSeed[] = [
  { id: "not-pink", displayName: "Not Pink", accent: "#FF6FA0", character: "The pink that swears it isn't" },
  { id: "poppy-kiss", displayName: "Poppy Kiss", accent: "#FF5C5C", character: "Bright, bold, a little dangerous" },
  { id: "peach-bellini", displayName: "Peach Bellini", accent: "#FFA368", character: "Warm, giggly, golden-hour peach" },
  { id: "golden-hour", displayName: "Golden Hour", accent: "#FFC94D", character: "Sun-warmed and glowing" },
  { id: "champagne-fizz", displayName: "Champagne Fizz", accent: "#F0DD6E", character: "Bubbly and celebratory" },
  { id: "mint-crush", displayName: "Mint Crush", accent: "#4FE0B0", character: "Fresh, sparkling, a little cheeky" },
  { id: "lagoon-kiss", displayName: "Lagoon Kiss", accent: "#3DD1E0", character: "Clear water, secret cove" },
  { id: "sky-flirt", displayName: "Sky Flirt", accent: "#5CB4FF", character: "Daydreamy periwinkle blue" },
  { id: "lilac-dream", displayName: "Lilac Dream", accent: "#B48CFF", character: "Soft, floaty, a little magical" },
  { id: "violet-hour", displayName: "Violet Hour", accent: "#9C5CFF", character: "Twilight, deeper and dreamier" },
  { id: "plum-fizz", displayName: "Plum Fizz", accent: "#E056D9", character: "Bold fuchsia, no apologies" },
  { id: "rose-gold", displayName: "Rosé Gold", accent: "#FFB4A0", character: "Warm, luminous, endlessly flattering" },
];

/**
 * Starts at 82% accent / 18% ink (a gentle darken) and, only for the
 * lightest accents where that isn't enough, mixes in progressively more ink
 * until accent-strong actually clears WCAG AA against light text — these
 * are bright, LIGHT colors by design, so this floor stays high to keep them
 * reading vivid rather than muddy.
 */
function darkenUntilAccessible(accent: string): string {
  let accentMixPercent = 82;
  let accentStrong = mix(accent, INK, accentMixPercent);

  while (contrastRatio(accentStrong, IVORY_FOREGROUND) < MIN_ACTION_CONTRAST && accentMixPercent > 35) {
    accentMixPercent -= 4;
    accentStrong = mix(accent, INK, accentMixPercent);
  }

  return accentStrong;
}

function buildTheme(seed: ThemeSeed): ThemeRecord {
  const accentStrong = darkenUntilAccessible(seed.accent);
  const accentSoft = mix(seed.accent, CANVAS, 22);
  const accentMist = mix(seed.accent, CANVAS, 10);
  const accentGlow = rgbToRgba(hexToRgb(seed.accent), 0.32);
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
