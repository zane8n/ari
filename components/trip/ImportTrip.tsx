"use client";

import { useState } from "react";

/** Pick the trip-plan file, done. Validation happens on the server; nothing existing is ever overwritten. */
export function ImportTrip() {
  const [state, setState] = useState<{ kind: "idle" | "busy" } | { kind: "ok"; slug: string } | { kind: "error"; message: string; slug?: string }>({ kind: "idle" });

  async function handleFile(file: File) {
    setState({ kind: "busy" });
    try {
      const plan = JSON.parse(await file.text());
      const response = await fetch("/api/host/trips/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(plan) });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setState({ kind: "error", message: body?.error ?? "Import failed.", slug: body?.slug });
        return;
      }
      setState({ kind: "ok", slug: body.slug });
    } catch {
      setState({ kind: "error", message: "That file isn't a readable trip plan (.json)." });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="trip-pass-card flex cursor-pointer flex-col items-center gap-2 px-6 py-10 text-center">
        <span className="font-display text-2xl font-medium">{state.kind === "busy" ? "Importing…" : "Choose the trip file"}</span>
        <span className="text-sm text-[var(--t-muted)]">The .json plan Claude sent you.</span>
        <input type="file" accept="application/json,.json" className="sr-only" disabled={state.kind === "busy"} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </label>
      {state.kind === "ok" && (
        <a href={`/host/trip/${state.slug}`} className="trip-btn trip-btn-primary w-full">
          Imported — open the trip
        </a>
      )}
      {state.kind === "error" && (
        <p className="text-sm text-[var(--t-coral)]">
          {state.message}{" "}
          {state.slug && (
            <a href={`/host/trip/${state.slug}`} className="underline">
              Open it
            </a>
          )}
        </p>
      )}
    </div>
  );
}
