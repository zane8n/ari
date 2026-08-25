"use client";

import { useEffect, useRef, useState } from "react";
import type SignaturePadType from "signature_pad";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";
import type { SignatureDraft } from "@/lib/experience/types";

export function SignatureSurface({
  preferredName,
  onCancel,
  onCapture,
}: {
  preferredName: string;
  onCancel: () => void;
  onCapture: (signature: SignatureDraft) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadType | null>(null);
  const [hasStroke, setHasStroke] = useState(false);
  const [typedMode, setTypedMode] = useState(false);
  const [typedValue, setTypedValue] = useState(preferredName);

  useEffect(() => {
    let disposed = false;
    let resize: (() => void) | null = null;

    import("signature_pad").then(({ default: SignaturePad }) => {
      if (disposed || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent-strong").trim();

      const pad = new SignaturePad(canvas, {
        minWidth: 1.4,
        maxWidth: 2.8,
        penColor: accent || "#1f4f4d",
      });

      resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const rect = canvas.getBoundingClientRect();
        const data = pad.toData();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.getContext("2d")?.scale(dpr, dpr);
        if (data.length > 0) pad.fromData(data);
      };

      pad.addEventListener("endStroke", () => setHasStroke(!pad.isEmpty()));
      padRef.current = pad;
      resize();
      window.addEventListener("resize", resize);
    });

    return () => {
      disposed = true;
      if (resize) window.removeEventListener("resize", resize);
      padRef.current?.off();
    };
  }, []);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  function handleClear(): void {
    padRef.current?.clear();
    setHasStroke(false);
  }

  function handleSubmit(): void {
    if (typedMode) {
      const trimmed = typedValue.trim();
      if (!trimmed) return;
      onCapture({ kind: "typed", value: trimmed });
      return;
    }
    if (!padRef.current || padRef.current.isEmpty()) return;
    const groups = padRef.current.toData();
    onCapture({
      kind: "drawn",
      points: groups.map((group) => group.points.map((point) => ({ x: point.x, y: point.y, time: point.time, pressure: point.pressure }))),
    });
  }

  const canSubmit = typedMode ? typedValue.trim().length > 0 : hasStroke;

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col"
      style={{ background: "var(--canvas)", paddingTop: "var(--safe-t)", paddingBottom: "var(--safe-b)" }}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-lg text-ink">{experienceCopy.signature.signAction}</h1>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close signing"
          className="focus-ring rounded-full p-2 text-ink-muted"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <p className="px-5 text-sm text-ink-muted">{experienceCopy.signature.body}</p>

      <div className="relative mx-5 my-4 flex-1 overflow-hidden rounded-[18px] border" style={{ borderColor: "var(--hairline)" }}>
        {!typedMode ? (
          <canvas ref={canvasRef} className="h-full w-full touch-none" aria-label="Signature canvas" />
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <input
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              maxLength={64}
              aria-label="Typed signature"
              className="focus-ring w-full border-b-2 bg-transparent pb-2 text-center font-display text-ink italic outline-none"
              style={{ fontSize: "clamp(1.75rem, 8vw, 2.375rem)", borderColor: "var(--hairline)" }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-5 pb-6">
        <button
          type="button"
          onClick={() => setTypedMode((value) => !value)}
          className="focus-ring self-start text-sm text-ink-muted underline"
        >
          {typedMode ? "Draw it instead" : experienceCopy.signature.typedFallback}
        </button>
        <div className="flex gap-3">
          {!typedMode && (
            <GlassAction variant="secondary" onClick={handleClear} className="flex-1">
              {experienceCopy.signature.clearAction}
            </GlassAction>
          )}
          <GlassAction variant="secondary" onClick={onCancel} className="flex-1">
            {experienceCopy.signature.cancelAction}
          </GlassAction>
        </div>
        <GlassAction variant="primary" disabled={!canSubmit} onClick={handleSubmit} className="w-full">
          {experienceCopy.signature.signAction}
        </GlassAction>
      </div>
    </div>
  );
}
