export function hashStringToSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — tiny, deterministic, good enough for decorative layout (not cryptographic). */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ArtifactKind = "pebble" | "ribbon" | "halo" | "route" | "seal";

export type ArtifactPlacement = {
  id: string;
  kind: ArtifactKind;
  topPercent: number;
  leftPercent: number;
  sizePx: number;
  driftSeconds: number;
  driftDelaySeconds: number;
  driftXPx: number;
  driftYPx: number;
  pointerMultiplier: number;
};

const IDENTITY_KINDS: ArtifactKind[] = ["pebble", "halo", "ribbon", "route", "seal"];
const DECORATIVE_ZONES: Array<{ top: [number, number]; left: [number, number] }> = [
  { top: [8, 22], left: [65, 92] },
  { top: [62, 82], left: [6, 28] },
];

/** One deterministic layout per invite (section 5.4: refresh must not feel randomly regenerated). */
export function buildAmbientLayout(inviteId: string, includeDecorative: boolean): ArtifactPlacement[] {
  const random = mulberry32(hashStringToSeed(inviteId || "birthday"));
  const zones: Array<{ top: [number, number]; left: [number, number] }> = [
    { top: [10, 24], left: [8, 26] },
    { top: [14, 30], left: [70, 90] },
    { top: [42, 58], left: [4, 18] },
    { top: [66, 84], left: [76, 94] },
    { top: [76, 90], left: [36, 58] },
  ];

  const placements: ArtifactPlacement[] = IDENTITY_KINDS.map((kind, index) => {
    const zone = zones[index];
    return {
      id: kind,
      kind,
      topPercent: zone.top[0] + random() * (zone.top[1] - zone.top[0]),
      leftPercent: zone.left[0] + random() * (zone.left[1] - zone.left[0]),
      sizePx: 34 + random() * 22,
      driftSeconds: 12 + random() * 16,
      driftDelaySeconds: random() * 6,
      driftXPx: 6 + random() * 10 * (random() > 0.5 ? 1 : -1),
      driftYPx: 6 + random() * 10 * (random() > 0.5 ? 1 : -1),
      pointerMultiplier: 4 + random() * 12,
    };
  });

  if (includeDecorative) {
    DECORATIVE_ZONES.forEach((zone, index) => {
      placements.push({
        id: `pebble-extra-${index}`,
        kind: "pebble",
        topPercent: zone.top[0] + random() * (zone.top[1] - zone.top[0]),
        leftPercent: zone.left[0] + random() * (zone.left[1] - zone.left[0]),
        sizePx: 18 + random() * 14,
        driftSeconds: 14 + random() * 14,
        driftDelaySeconds: random() * 6,
        driftXPx: 5 + random() * 8 * (random() > 0.5 ? 1 : -1),
        driftYPx: 5 + random() * 8 * (random() > 0.5 ? 1 : -1),
        pointerMultiplier: 3 + random() * 8,
      });
    });
  }

  return placements;
}
