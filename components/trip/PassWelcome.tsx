"use client";

import { useState } from "react";

/** Quiet, single-screen welcome — no reveal. One tap claims the pass on this device. */
export function PassWelcome({ token, tripName, destination, dates, label }: { token: string; tripName: string; destination: string; dates: string; label: string }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [error, setError] = useState("");

  async function enter() {
    setState("busy");
    try {
      const response = await fetch("/api/pass/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "That didn't work. Try again.");
      window.location.replace(`/host/trip/${body.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again.");
      setState("error");
    }
  }

  return (
    <main className="trip trip-luxe flex min-h-[100svh] items-center justify-center px-6">
      <div className="trip-pass-card w-full max-w-sm px-8 py-12 text-center">
        <p className="trip-eyebrow">Private pass · {label}</p>
        <div className="trip-rule mx-auto my-6 w-16" aria-hidden />
        <h1 className="font-display text-5xl leading-none font-medium">{tripName}</h1>
        <p className="mt-3 text-sm tracking-wide text-[var(--t-muted)]">
          {destination} · {dates}
        </p>
        <div className="trip-rule mx-auto my-8 w-16" aria-hidden />
        <button type="button" onClick={enter} disabled={state === "busy"} className="trip-btn trip-btn-primary w-full">
          {state === "busy" ? "Opening…" : "Enter"}
        </button>
        <p className="mt-4 text-[11px] leading-relaxed text-[var(--t-muted)]">This pass opens on this device only, once. Keep using this browser afterwards.</p>
        {state === "error" && <p className="mt-3 text-sm text-[var(--t-coral)]">{error}</p>}
      </div>
    </main>
  );
}
