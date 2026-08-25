import { experienceCopy } from "@/content/experience-copy";

// Keeps the global 404 (a genuinely unmatched route, not a notFound() call
// from within an already-dynamic page) on the same nonce-compatible dynamic
// rendering as every other route.
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center px-5">
      <div className="glass-surface w-full max-w-[31rem] px-7 py-10 text-center">
        <p className="font-display text-xl text-ink">{experienceCopy.edgeStates.unavailable}</p>
      </div>
    </main>
  );
}
