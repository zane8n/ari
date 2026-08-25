"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { type MotionValue, useMotionValue, useSpring } from "@/lib/motion/m";

type PointerContextValue = { x: MotionValue<number>; y: MotionValue<number> };

const PointerContext = createContext<PointerContextValue | null>(null);

/** Normalised (-1..1) spring-smoothed pointer offset from viewport centre. Zero on touch devices. */
export function usePointerMotion(): PointerContextValue {
  const ctx = useContext(PointerContext);
  if (!ctx) throw new Error("usePointerMotion must be used within PointerMotionProvider");
  return ctx;
}

export function PointerMotionProvider({ children }: { children: ReactNode }) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 60, damping: 20, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 60, damping: 20, mass: 0.6 });

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!query.matches) return;

    function handlePointerMove(event: PointerEvent): void {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      rawX.set((event.clientX - centerX) / centerX);
      rawY.set((event.clientY - centerY) / centerY);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [rawX, rawY]);

  return <PointerContext.Provider value={{ x, y }}>{children}</PointerContext.Provider>;
}
