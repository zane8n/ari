import type { Stage } from "@/lib/experience/types";

/** The project's fluid easing curve — used everywhere except micro-response taps. */
export const FLUID_EASE = [0.22, 1, 0.36, 1] as const;

export const motionTokens = {
  micro: { duration: 0.13, ease: "easeOut" as const },
  component: { duration: 0.26, ease: FLUID_EASE },
  sceneExit: { duration: 0.18, ease: FLUID_EASE },
  sceneEnter: { duration: 0.4, ease: FLUID_EASE },
  sceneStagger: 0.06,
  colorWash: { duration: 0.8, ease: FLUID_EASE },
  colorWashSettle: { duration: 0.22, ease: FLUID_EASE },
  ceremony: { duration: 1.4, ease: FLUID_EASE },
  reducedMotion: { duration: 0.16, ease: "easeOut" as const },
  reducedMotionColorWash: { duration: 0.16, ease: "easeOut" as const },
  ambientDriftSeconds: { min: 12, max: 28 },
} as const;

/**
 * Ambient background energy per stage (section 16): quieter during the
 * sincere note and the agreement, fullest during the playful questions.
 */
export const stageAmbientIntensity: Record<Stage, number> = {
  arrival: 0.5,
  name: 0.7,
  theme: 0.8,
  prologue: 0.6,
  wish: 1,
  wishConfirm: 1,
  spoilModes: 1,
  travelPersona: 1,
  mustNotMiss: 0.25,
  review: 0.35,
  agreement: 0.15,
  signature: 0.1,
  sealing: 0.05,
  reveal: 0.8,
};

export const MAX_AMBIENT_NODES_MOBILE = 8;
export const MAX_AMBIENT_NODES_DESKTOP = 12;
export const LOW_PERFORMANCE_AMBIENT_NODES = 4;
export const MAX_SIMULTANEOUS_BLUR_LAYERS = 3;
