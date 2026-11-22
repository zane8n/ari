"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarPlus, Copy, ShareNetwork } from "@phosphor-icons/react";
import { m } from "@/lib/motion/m";
import { useTrip } from "./TripContext";
import { Sheet, ThemePicker } from "./ui";

type PassView = { id: string; label: string; createdAt: string; claimedAt: string | null; lastSeenAt: string | null; revokedAt: string | null };

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** The trip's settings sheet. Hosts manage passes here; guests just get the reminders calendar. */
export function TripMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { bundle, api, isHost, themeId, setThemeId, currency, currencies, setCurrency } = useTrip();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={bundle.trip.name} description="Just for this phone">
      <div className="flex flex-col gap-9 pb-2">
        <section className="flex flex-col gap-4">
          <p className="trip-eyebrow text-center">Your colour</p>
          <ThemePicker value={themeId} onChange={setThemeId} />
        </section>

        {currencies.length > 1 && (
          <section className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Show money in</p>
            <div className="trip-seg" role="group" aria-label="Display currency">
              {currencies.map((c) => (
                <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)}>
                  {currency === c && <span className="trip-seg-pill" />}
                  {c}
                </button>
              ))}
            </div>
          </section>
        )}

        {isHost && <Passes />}
        <section>
          <a href={api.remindersUrl} download className="trip-soft flex items-center gap-3 px-5 py-4">
            <CalendarPlus size={22} className="shrink-0 text-[var(--t-sea)]" />
            <span className="text-sm">
              Add the nightly {String(bundle.trip.checkinHour).padStart(2, "0")}:00 check-in to your calendar
            </span>
          </a>
        </section>
        {isHost && (
          <section className="flex gap-2">
            <Link href="/host/trip?all=1" className="trip-btn trip-btn-ghost flex-1">
              All trips
            </Link>
            <Link href="/host/trip/import" className="trip-btn trip-btn-ghost flex-1">
              Add a trip
            </Link>
          </section>
        )}
      </div>
    </Sheet>
  );
}

function Passes() {
  const { bundle, reportError } = useTrip();
  const base = `/api/host/trips/${encodeURIComponent(bundle.trip.slug)}/passes`;
  const [passes, setPasses] = useState<PassView[] | null>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<{ label: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [version, setVersion] = useState(0);
  const load = () => setVersion((v) => v + 1);

  useEffect(() => {
    let alive = true;
    fetch(base)
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (alive && body) setPasses(body.passes);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [base, version]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: label.trim() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Couldn't create the pass.");
      setFresh({ label: body.pass.label, url: body.url });
      setCopied(false);
      setLabel("");
      load();
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    const response = await fetch(`${base}/${id}`, { method: "DELETE" });
    if (!response.ok) reportError(new Error("Couldn't withdraw that pass."));
    load();
  }

  async function share() {
    if (!fresh) return;
    const text = `Your pass for ${bundle.trip.name}. It opens once, on one phone:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: bundle.trip.name, text, url: fresh.url });
        return;
      } catch {
        // Cancelled — fall through to copy.
      }
    }
    await copy();
  }

  async function copy() {
    if (!fresh) return;
    try {
      await navigator.clipboard.writeText(fresh.url);
      setCopied(true);
    } catch {
      reportError(new Error("Copy failed — press and hold the link to copy it."));
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="trip-eyebrow">Share the trip</p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--t-muted)]">A one-time pass opens this trip on one phone, once, and stays signed in there until you withdraw it.</p>
      </div>

      {fresh ? (
        <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="trip-pass-card flex flex-col gap-4 p-6">
          <p className="trip-eyebrow">A pass for {fresh.label}</p>
          <p className="rounded-2xl bg-white/70 px-4 py-3 font-mono text-xs break-all select-all">{fresh.url}</p>
          <p className="text-[11px] text-[var(--t-muted)]">This link is shown once. Send it now.</p>
          <div className="flex gap-2">
            <button type="button" onClick={share} className="trip-btn trip-btn-primary flex-1">
              <ShareNetwork size={16} weight="bold" /> Send
            </button>
            <button type="button" onClick={copy} className="trip-btn trip-btn-ghost flex-1">
              <Copy size={16} /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button type="button" onClick={() => setFresh(null)} className="trip-btn trip-btn-quiet self-center">
            Done
          </button>
        </m.div>
      ) : (
        <form onSubmit={create} className="flex gap-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder="Who is it for? e.g. Her phone" aria-label="Pass name" className="trip-input" />
          <button type="submit" disabled={busy || !label.trim()} className="trip-btn trip-btn-primary shrink-0">
            {busy ? "…" : "Create"}
          </button>
        </form>
      )}

      {passes && passes.length > 0 && (
        <ul className="trip-soft divide-y divide-[var(--t-line)] overflow-hidden">
          {passes.map((p) => {
            const status = p.revokedAt ? "Withdrawn" : p.claimedAt ? `In use · seen ${when(p.lastSeenAt ?? p.claimedAt)}` : "Not opened yet";
            return (
              <li key={p.id} className={`flex items-center gap-3 px-5 py-3 ${p.revokedAt ? "opacity-50" : ""}`}>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{p.label}</span>
                  <span className="block text-[11px] text-[var(--t-muted)]">{status}</span>
                </span>
                {!p.revokedAt && (
                  <button type="button" onClick={() => revoke(p.id)} className="trip-btn trip-btn-quiet !min-h-[36px] text-xs">
                    Withdraw
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
