import { experienceCopy } from "@/content/experience-copy";

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center px-5">
      <div className="glass-surface w-full max-w-[31rem] px-7 py-10 text-center">
        <p className="font-display text-xl text-ink">{experienceCopy.edgeStates.unavailable}</p>
      </div>
    </main>
  );
}
