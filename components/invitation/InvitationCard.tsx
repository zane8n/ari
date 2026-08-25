"use client";

import { useState, type MouseEvent } from "react";
import { experienceCopy } from "@/content/experience-copy";
import { InvitationIcon } from "@/components/icons/SceneIcons";
import { interpolate } from "@/lib/content/interpolate";
import { isIOS } from "@/lib/device/platform";
import { daysUntil, formatVacationDateRange } from "@/lib/reveal/countdown";
import type { RevealData } from "@/lib/reveal/types";
import type { ThemeRecord } from "@/lib/theme/themes";

export function InvitationCard({
  preferredName,
  theme,
  reveal,
  token,
  onReadAgreement,
}: {
  preferredName: string;
  theme: ThemeRecord | null;
  reveal: RevealData;
  token: string;
  onReadAgreement: () => void;
}) {
  const [showIOSHint, setShowIOSHint] = useState(false);
  const cardUrl = `/api/invite/${token}/card`;
  const days = daysUntil(reveal.startIso);

  function handleSave(event: MouseEvent<HTMLAnchorElement>): void {
    if (isIOS()) {
      event.preventDefault();
      window.open(cardUrl, "_blank");
      setShowIOSHint(true);
    }
  }

  return (
    <div className="glass-surface flex flex-col items-center gap-6 px-7 py-10 text-center" style={{ boxShadow: `var(--shadow-card), 0 0 60px -10px var(--accent-glow)` }}>
      <InvitationIcon className="h-8 w-8 text-accent-strong" />
      <p className="text-xs font-semibold tracking-wide text-accent-strong uppercase">{experienceCopy.reveal.eyebrow}</p>
      <h1 className="font-display text-[clamp(1.9rem,7vw,2.5rem)] leading-[1.05] text-ink">
        {interpolate(experienceCopy.reveal.invitationLine, { name: preferredName || "you" })}
      </h1>

      <div className="flex flex-col items-center gap-1">
        <p className="font-display text-2xl text-ink">{reveal.destination}</p>
        <p className="text-sm text-ink-muted">{formatVacationDateRange(reveal.startIso, reveal.endIso)}</p>
        <p className="tabular-nums mt-2 text-sm text-accent-strong">
          {days > 0 ? `${days} ${days === 1 ? "day" : "days"} to go` : "It's time"}
        </p>
      </div>

      {reveal.note && <p className="max-w-[30ch] text-[15px] leading-relaxed text-ink italic">{reveal.note}</p>}

      <div className="mt-2 flex flex-col items-center gap-3">
        <a
          href={cardUrl}
          download={`birthday-invitation-${(preferredName || "invitation").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`}
          onClick={handleSave}
          className="action-primary focus-ring"
        >
          {experienceCopy.reveal.saveAction}
        </a>
        {showIOSHint && <p className="text-xs text-ink-muted">Press and hold the image to save it.</p>}
        <button type="button" onClick={onReadAgreement} className="focus-ring text-sm text-ink-muted underline">
          {experienceCopy.reveal.readAgreementAction}
        </button>
      </div>

      {theme && (
        <span aria-hidden="true" className="mt-2 h-2 w-2 rounded-full" style={{ background: theme.accent }} />
      )}
    </div>
  );
}
