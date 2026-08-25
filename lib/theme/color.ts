export type RgbColor = { r: number; g: number; b: number };

export function hexToRgb(hex: string): RgbColor {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((c) => c + c).join("")
    : normalized;
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const channel = (c: number) => Math.round(clamp(c, 0, 255)).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function rgbToRgba(color: RgbColor, alpha: number): string {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Approximates CSS color-mix(in srgb, a p%, b) as a precomputed fallback.
 * The runtime token contract mixes in oklch; this sRGB approximation is only
 * used for the static fallback value rendered before color-mix support.
 */
export function mix(a: string, b: string, aPercent: number): string {
  const colorA = hexToRgb(a);
  const colorB = hexToRgb(b);
  const t = clamp(aPercent, 0, 100) / 100;
  return rgbToHex({
    r: colorA.r * t + colorB.r * (1 - t),
    g: colorA.g * t + colorB.g * (1 - t),
    b: colorA.b * t + colorB.b * (1 - t),
  });
}

function srgbChannelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: RgbColor): number {
  const r = srgbChannelToLinear(color.r);
  const g = srgbChannelToLinear(color.g);
  const b = srgbChannelToLinear(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a));
  const lb = relativeLuminance(hexToRgb(b));
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Picks whichever of two foreground candidates reads with higher contrast on `background`. */
export function pickContrastSafeForeground(
  background: string,
  candidates: readonly [string, string],
): string {
  const [first, second] = candidates;
  return contrastRatio(background, first) >= contrastRatio(background, second) ? first : second;
}
