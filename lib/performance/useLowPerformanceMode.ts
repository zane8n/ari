"use client";

import { useEffect, useState } from "react";

type NavigatorWithMemory = Navigator & { deviceMemory?: number };

/**
 * Compound heuristic per section 25.1 — never trusts navigator.deviceMemory
 * alone. Combines device hints, motion preference, an observed long task and
 * measured early frame stability; flips low-performance mode once at least
 * two signals agree.
 */
export function useLowPerformanceMode(): boolean {
  const [lowPerformance, setLowPerformance] = useState(false);

  useEffect(() => {
    let signals = 0;
    const nav = navigator as NavigatorWithMemory;
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) signals += 1;
    if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4) signals += 1;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) signals += 1;

    let longTaskSignal = false;
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        if (list.getEntries().length > 0) longTaskSignal = true;
      });
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      // "longtask" entries aren't supported everywhere (e.g. Safari) — skip this signal there.
    }

    let rafSignal = false;
    let frameCount = 0;
    let last = performance.now();
    let rafId = 0;
    let finished = false;

    function finish(): void {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      const total = signals + (longTaskSignal ? 1 : 0) + (rafSignal ? 1 : 0);
      setLowPerformance(total >= 2);
    }

    function tick(now: number): void {
      const delta = now - last;
      last = now;
      frameCount += 1;
      if (delta > 26) rafSignal = true;
      if (frameCount < 24) {
        rafId = requestAnimationFrame(tick);
      } else {
        finish();
      }
    }
    rafId = requestAnimationFrame(tick);

    const timeoutId = setTimeout(finish, 900);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, []);

  return lowPerformance;
}
