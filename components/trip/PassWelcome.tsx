"use client";

import { useState } from "react";
import { domMax, LazyMotion, m, MotionConfig } from "@/lib/motion/m";
import type { ThemeId } from "@/lib/theme/themes";
import { saveTripTheme, tripThemeVars } from "@/lib/trip/theme";
import { calm, ThemePicker } from "./ui";

/**
 * Quiet, single-screen welcome — no reveal. She picks her own colour (it
 * starts on the one she chose in the invitation), then one tap claims the
 * pass on this device.
 */
export function PassWelcome({
  token,
  tripName,
  destination,
  dates,
  label,
  defaultTheme,
}: {
  token: string;
  tripName: string;
  destination: string;
  dates: string;
  label: string;
  defaultTheme: ThemeId;
}) {
  const [theme, setTheme] = useState<ThemeId>(defaultTheme);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [error, setError] = useState("");

  async function enter() {
    setState("busy");
    try {
      const response = await fetch("/api/pass/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "That didn't work. Try again.");
      saveTripTheme(theme);
      window.location.replace(`/host/trip/${body.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again.");
      setState("error");
    }
  }

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <main className="trip trip-luxe flex min-h-[100svh] items-center justify-center px-5 py-10" style={tripThemeVars(theme) as React.CSSProperties}>
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, ease: calm }}
            className="trip-pass-card w-full max-w-sm px-7 py-10 text-center"
          >
            <p className="trip-eyebrow">A pass for {label}</p>
            <div className="trip-fleuron mt-6" aria-hidden>
              <i />
            </div>
            <h1 className="font-display mt-6 text-[52px] leading-none font-medium">{tripName}</h1>
            <p className="mt-3 text-sm text-[var(--t-muted)]">
              {destination} · {dates}
            </p>

            <div className="mt-9">
              <p className="trip-eyebrow mb-4">Pick your colour</p>
              <ThemePicker value={theme} onChange={setTheme} />
            </div>

            <button type="button" onClick={enter} disabled={state === "busy"} className="trip-btn trip-btn-primary mt-9 w-full">
              {state === "busy" ? "Opening…" : "Come in"}
            </button>
            <p className="mt-4 text-xs leading-relaxed text-[var(--t-muted)]">This pass opens on this phone, once. Keep using this browser afterwards.</p>
            {state === "error" && <p className="mt-3 text-sm text-[var(--t-coral)]">{error}</p>}
          </m.div>
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
