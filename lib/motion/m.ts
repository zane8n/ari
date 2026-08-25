/**
 * Single import surface for the motion package so every component uses the
 * same LazyMotion-compatible `m` primitive instead of the full `motion`
 * bundle (section 16: "Use LazyMotion with domAnimation features initially").
 */
export {
  m,
  AnimatePresence,
  MotionConfig,
  LazyMotion,
  domAnimation,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
  useAnimate,
  animate,
} from "motion/react";
export type { MotionValue, HTMLMotionProps } from "motion/react";
