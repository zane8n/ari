"use client";

import { useMemo, useState } from "react";
import type { EventStatus } from "@/db/schema";
import { formatMoney } from "@/lib/currency/convert";
import { formatLongDay } from "@/lib/trip/dates";
import { useTrip } from "./TripContext";
import { Sheet } from "./ui";

const MOODS = ["Rough", "Meh", "Good", "Great", "Perfect"];
const STEPS = ["The day", "The money", "Close it"] as const;

/**
 * The evening check-in: tick off the day, settle what each plan actually
 * cost, add anything unplanned, then close the day with one line to
 * remember it by. Built so each step is a column of single taps.
 */
export function CheckinSheet() {
  const { checkinDay } = useTrip();
  if (!checkinDay) return null;
  return <CheckinBody key={checkinDay} day={checkinDay} />;
}

function CheckinBody({ day }: { day: string }) {
  const { closeCheckin, bundle, money, fmt, setEventStatus, logExpense, updateItem, openLog, saveCheckin, showToast, rates } = useTrip();
  const existing = bundle.checkins.find((c) => c.day === day);
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<number | null>(existing?.mood ?? null);
  const [highlight, setHighlight] = useState(existing?.highlight ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const dayInfo = bundle.days.find((d) => d.date === day);
  const events = useMemo(() => bundle.events.filter((e) => e.day === day).sort((a, b) => a.sortOrder - b.sortOrder), [bundle.events, day]);
  const fixedLines = useMemo(
    () => money.items.filter((m) => !m.item.isReserve && m.item.kind === "fixed" && m.item.day === day && m.item.status !== "dropped"),
    [money.items, day],
  );
  const runningLines = useMemo(() => money.items.filter((m) => !m.item.isReserve && m.item.kind === "running" && m.item.status === "open"), [money.items]);
  const dayExpenses = bundle.expenses.filter((e) => e.day === day && e.fund === "pot");
  const daySpentUsd = dayExpenses.reduce((sum, e) => sum + e.amountUsd, 0);
  const unsettled = fixedLines.filter((m) => m.item.status === "open").length;

  async function setStatus(eventId: string, status: EventStatus) {
    const event = bundle.events.find((e) => e.id === eventId);
    if (!event) return;
    setBusyId(eventId);
    // In the check-in the money step settles costs, so don't pop the log sheet over it.
    await setEventStatus(event, event.status === status ? "planned" : status, { promptCost: false });
    setBusyId(null);
  }

  async function settle(itemId: string, amount: number, currency = bundle.trip.spendCurrency) {
    setBusyId(itemId);
    await logExpense({ budgetItemId: itemId, amount, currency, day }, { quiet: true });
    setBusyId(null);
  }

  async function finish() {
    setSaving(true);
    const saved = await saveCheckin({ day, mood, highlight: highlight.trim() || null });
    setSaving(false);
    if (saved) {
      closeCheckin();
      showToast({ message: `${formatLongDay(day)} closed. ${fmt(Math.max(0, money.extrasPerDayUsd))}/day free from here.` });
    }
  }

  const footer = (
    <div className="flex items-center gap-2">
      {step > 0 && (
        <button type="button" onClick={() => setStep(step - 1)} className="trip-btn trip-btn-ghost">
          Back
        </button>
      )}
      {step < STEPS.length - 1 ? (
        <button type="button" onClick={() => setStep(step + 1)} className="trip-btn trip-btn-primary flex-1">
          {step === 1 && unsettled > 0 ? `Next · ${unsettled} still open` : "Next"}
        </button>
      ) : (
        <button type="button" onClick={finish} disabled={saving} className="trip-btn trip-btn-primary flex-1">
          {saving ? "Saving…" : "Close the day"}
        </button>
      )}
    </div>
  );

  return (
    <Sheet
      open
      onOpenChange={(next) => !next && closeCheckin()}
      title="Evening check-in"
      description={`${formatLongDay(day)}${dayInfo ? ` · ${dayInfo.label}` : ""}`}
      footer={footer}
    >
      <ol className="mb-4 grid grid-cols-3 gap-1" aria-label="Check-in steps">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button type="button" onClick={() => setStep(i)} className="w-full text-left" aria-current={i === step ? "step" : undefined}>
              <span className={`block h-1 ${i <= step ? "bg-[var(--t-sea)]" : "bg-[var(--t-sunk)]"}`} />
              <span className={`mt-1 block text-[11px] font-bold tracking-wide uppercase ${i === step ? "text-[var(--t-ink)]" : "text-[var(--t-muted)]"}`}>{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[var(--t-muted)]">What actually happened today?</p>
          {events.length === 0 && <p className="text-sm">Nothing was planned — a free day.</p>}
          {events.map((event) => (
            <div key={event.id} className={`flex items-center gap-3 px-3 py-2.5 ${event.isSurprise ? "trip-surprise" : "trip-card"}`}>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[var(--t-muted)]">{event.timeOfDay}</p>
                <p className="leading-snug font-semibold">{event.title}</p>
              </div>
              <div className="flex shrink-0 gap-1" role="group" aria-label={`Status of ${event.title}`}>
                <button
                  type="button"
                  disabled={busyId === event.id}
                  aria-pressed={event.status === "done"}
                  onClick={() => setStatus(event.id, "done")}
                  className={`trip-btn !min-h-[40px] !px-3 ${event.status === "done" ? "trip-btn-good" : "trip-btn-ghost"}`}
                >
                  Done
                </button>
                <button
                  type="button"
                  disabled={busyId === event.id}
                  aria-pressed={event.status === "skipped"}
                  onClick={() => setStatus(event.id, "skipped")}
                  className={`trip-btn !min-h-[40px] !px-3 ${event.status === "skipped" ? "trip-btn-warn" : "trip-btn-ghost"}`}
                >
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          {fixedLines.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-sm text-[var(--t-muted)]">Today&apos;s planned costs — one tap if it matched the plan.</p>
              {fixedLines.map((m) => {
                const paid = m.item.status === "paid";
                const value = customAmount[m.item.id] ?? "";
                return (
                  <div key={m.item.id} className="trip-card px-3 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold">{m.item.label}</p>
                      <p className="trip-num shrink-0 text-lg">{paid ? fmt(m.paidUsd) : fmt(m.item.estimatedUsd)}</p>
                    </div>
                    {paid ? (
                      <p className="mt-1 text-xs font-semibold text-[var(--t-good)]">
                        Settled{m.varianceUsd ? ` · ${m.varianceUsd > 0 ? "+" : "−"}${fmt(Math.abs(m.varianceUsd))} vs plan` : " · on plan"}
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === m.item.id}
                          onClick={() => settle(m.item.id, m.item.estimatedUsd, "USD")}
                          className="trip-btn trip-btn-primary !min-h-[40px]"
                        >
                          As planned
                        </button>
                        <input
                          inputMode="decimal"
                          value={value}
                          onChange={(e) => setCustomAmount((s) => ({ ...s, [m.item.id]: e.target.value.replace(/[^\d.]/g, "") }))}
                          placeholder={bundle.trip.spendCurrency}
                          aria-label={`Actual amount for ${m.item.label} in ${bundle.trip.spendCurrency}`}
                          className="trip-input !min-h-[40px] w-28"
                        />
                        <button
                          type="button"
                          disabled={!value || busyId === m.item.id}
                          onClick={() => settle(m.item.id, Number.parseFloat(value))}
                          className="trip-btn trip-btn-ghost !min-h-[40px]"
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => updateItem(m.item.id, { status: "dropped" })} className="trip-btn trip-btn-quiet !min-h-[40px] text-xs">
                          Didn&apos;t happen
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {runningLines.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-sm text-[var(--t-muted)]">Small stuff today — tuk-tuks, snacks, groceries.</p>
              {runningLines.map((m) => {
                const value = customAmount[m.item.id] ?? "";
                const today = dayExpenses.filter((e) => e.budgetItemId === m.item.id).reduce((s, e) => s + e.amountUsd, 0);
                return (
                  <div key={m.item.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{m.item.label}</p>
                      <p className="text-[11px] text-[var(--t-muted)]">
                        {today > 0 ? `${fmt(today)} today · ` : ""}
                        {fmt(m.stillExpectedUsd)} left
                      </p>
                    </div>
                    <input
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => setCustomAmount((s) => ({ ...s, [m.item.id]: e.target.value.replace(/[^\d.]/g, "") }))}
                      placeholder={bundle.trip.spendCurrency}
                      aria-label={`Add to ${m.item.label} in ${bundle.trip.spendCurrency}`}
                      className="trip-input !min-h-[40px] w-24"
                    />
                    <button
                      type="button"
                      disabled={!value || busyId === m.item.id}
                      onClick={async () => {
                        await settle(m.item.id, Number.parseFloat(value));
                        setCustomAmount((s) => ({ ...s, [m.item.id]: "" }));
                      }}
                      className="trip-btn trip-btn-ghost !min-h-[40px] !px-3"
                    >
                      Add
                    </button>
                  </div>
                );
              })}
            </section>
          )}

          <button type="button" onClick={() => openLog({ day })} className="trip-btn trip-btn-ghost w-full border-dashed">
            + Something unplanned
          </button>

          {dayExpenses.length > 0 && (
            <section>
              <p className="trip-eyebrow mb-1">Logged for this day</p>
              <ul className="divide-y divide-[var(--t-line)] text-sm">
                {dayExpenses.map((e) => (
                  <li key={e.id} className="flex justify-between gap-2 py-1.5">
                    <span className="truncate">{e.label}</span>
                    <span className="shrink-0 tabular-nums">{formatMoney(e.amount, e.currency)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="trip-card px-3 py-3">
              <p className="trip-eyebrow">Spent this day</p>
              <p className="trip-num mt-1 text-2xl">{fmt(daySpentUsd)}</p>
            </div>
            <div className="trip-card px-3 py-3">
              <p className="trip-eyebrow">Left in the pot</p>
              <p className="trip-num mt-1 text-2xl">{fmt(money.leftUsd)}</p>
            </div>
          </div>
          <p className={`px-3 py-2 text-sm ${money.headroomUsd >= 0 ? "bg-[var(--t-sea-soft)] text-[var(--t-sea-strong)]" : "bg-[var(--t-coral-soft)] text-[var(--t-coral)]"}`}>
            {money.headroomUsd >= 0
              ? `On track. The rest of the plan fits, with ${fmt(money.extrasPerDayUsd)} a day free for extras.`
              : `The plan now runs ${fmt(-money.headroomUsd)} over the pot. The Money tab has the cut list, in your agreed order.`}
          </p>

          <fieldset>
            <legend className="trip-eyebrow mb-2">How was it?</legend>
            <div className="grid grid-cols-5 gap-1">
              {MOODS.map((label, i) => (
                <button key={label} type="button" aria-pressed={mood === i + 1} onClick={() => setMood(mood === i + 1 ? null : i + 1)} className="trip-chip !min-h-[44px] justify-center !px-1 !text-xs">
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1">
            <span className="trip-eyebrow">One line to remember it by</span>
            <textarea value={highlight} onChange={(e) => setHighlight(e.target.value)} rows={2} maxLength={280} placeholder="The glow in the water…" className="trip-input" />
          </label>
          {bundle.trip.spendCurrency !== "USD" && (
            <p className="text-[11px] text-[var(--t-muted)]">
              Rate used: 1 USD ≈ {rates[bundle.trip.spendCurrency].toFixed(0)} {bundle.trip.spendCurrency}.
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}
