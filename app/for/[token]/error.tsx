"use client";

import { useEffect } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { GlassAction } from "@/components/controls/GlassAction";

/**
 * A transient DB blip (Neon's WebSocket layer occasionally drops mid-query)
 * must never leave a one-shot invite link staring at Next's raw crash page —
 * `reset()` just re-renders the server component, which re-runs the query.
 */
export default function InviteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[100svh] items-center justify-center px-5">
      <div className="flex max-w-[28rem] flex-col items-center gap-5 text-center">
        <p className="font-display text-xl text-ink">{experienceCopy.edgeStates.pageLoadHiccup}</p>
        <GlassAction variant="primary" onClick={reset}>
          {experienceCopy.edgeStates.pageLoadRetry}
        </GlassAction>
      </div>
    </main>
  );
}
