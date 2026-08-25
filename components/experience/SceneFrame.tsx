"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { m } from "@/lib/motion/m";
import { motionTokens } from "@/lib/motion/tokens";

const sceneVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: motionTokens.sceneEnter.duration, ease: motionTokens.sceneEnter.ease },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: motionTokens.sceneExit.duration, ease: motionTokens.sceneExit.ease },
  },
};

type SceneFrameProps = {
  stage: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
};

/** Focus moves to the new scene's heading after the transition, but never waits past ~500ms (section 6.1). */
export function SceneFrame({ stage, children, className = "", wide = false }: SceneFrameProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const heading = containerRef.current?.querySelector<HTMLElement>("h1, h2");
    if (!heading) return;
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    const id = setTimeout(() => heading.focus({ preventScroll: false }), 420);
    return () => clearTimeout(id);
  }, [stage]);

  return (
    <m.main
      ref={containerRef}
      className={`relative mx-auto flex min-h-[100svh] w-full flex-col justify-center ${wide ? "max-w-3xl" : "max-w-[31rem]"} ${className}`}
      style={{
        paddingTop: "calc(2.5rem + var(--safe-t))",
        paddingBottom: "calc(2.5rem + var(--safe-b))",
        paddingLeft: "calc(1.25rem + var(--safe-l))",
        paddingRight: "calc(1.25rem + var(--safe-r))",
      }}
      variants={sceneVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </m.main>
  );
}
