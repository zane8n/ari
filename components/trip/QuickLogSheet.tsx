"use client";

import { useMemo, useRef, useState } from "react";
import { BUDGET_CATEGORY_VALUES, type BudgetCategory, type Currency, type ExpenseFund } from "@/db/schema";
import { convertFromUsd, convertToUsd, formatMoney } from "@/lib/currency/convert";
import { CATEGORY_LABELS } from "@/lib/trip/analysis";
import { formatDayMonth, formatWeekday } from "@/lib/trip/dates";
import { useTrip, type LogRequest } from "./TripContext";
import { Sheet } from "./ui";

/** Round a converted planning figure to something you'd actually hand over (KES to the nearest 10). */
function roundForCash(amount: number, currency: Currency): number {
  if (currency === "USD") return Math.round(amount * 100) / 100;
  return Math.round(amount / 10) * 10;
}

/**
 * The three-tap log: amount → what for → save. Everything else defaults
 * sensibly (today, the trip's cash currency, the pot) and stays one tap away.
 */
export function QuickLogSheet() {
  const { logRequest } = useTrip();
  if (!logRequest) return null;
  // Remounted per request, so every open starts from that request's defaults.
  return <QuickLogBody key={JSON.stringify(logRequest)} logRequest={logRequest} />;
}

function QuickLogBody({ logRequest }: { logRequest: LogRequest }) {
  const { closeLog, bundle, today, money, rates, logExpense, fmt } = useTrip();
  const { trip, days } = bundle;

  const tripDates = useMemo(() => days.map((d) => d.date), [days]);
  const defaultDay = tripDates.includes(today) ? today : null;

  const linesById = useMemo(() => new Map(money.items.map((m) => [m.item.id, m])), [money.items]);
  const initialLine = logRequest.budgetItemId ? linesById.get(logRequest.budgetItemId) : undefined;

  const [amount, setAmount] = useState(() =>
    logRequest.amountUsd !== undefined ? String(roundForCash(convertFromUsd(logRequest.amountUsd, trip.spendCurrency, rates), trip.spendCurrency)) : "",
  );
  const [currency, setCurrency] = useState<Currency>(trip.spendCurrency);
  const [itemId, setItemId] = useState<string | null>(initialLine?.item.id ?? null);
  const [other, setOther] = useState(false);
  const [category, setCategory] = useState<BudgetCategory>("food");
  const [label, setLabel] = useState("");
  const [day, setDay] = useState<string | null>(logRequest.day !== undefined ? logRequest.day : (initialLine?.item.day ?? defaultDay));
  const [fund, setFund] = useState<ExpenseFund>(initialLine?.item.isReserve ? "reserve" : "pot");
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const selectedDay = day ?? today;
  // What-for suggestions: that day's unpaid one-offs first, then the running pots, then anything else still open.
  const suggestions = useMemo(() => {
    const open = money.items.filter((m) => !m.item.isReserve && m.item.status === "open");
    const dayFixed = open.filter((m) => m.item.kind === "fixed" && m.item.day === selectedDay);
    const running = open.filter((m) => m.item.kind === "running");
    const rest = open.filter((m) => m.item.kind === "fixed" && m.item.day !== selectedDay);
    return { dayFixed, running, rest };
  }, [money.items, selectedDay]);

  const selected = itemId ? linesById.get(itemId) : undefined;
  const parsed = Number.parseFloat(amount.replace(/,/g, ""));
  const valid = Number.isFinite(parsed) && parsed >= 0 && amount.trim() !== "" && (Boolean(selected) || (other && label.trim().length > 0));

  function choose(id: string) {
    setOther(false);
    setItemId((current) => (current === id ? null : id));
    const line = linesById.get(id);
    if (line?.item.isReserve) setFund("reserve");
    window.setTimeout(() => amountRef.current?.focus(), 0);
  }

  function fillAsPlanned() {
    if (!selected) return;
    const target = selected.item.kind === "running" ? selected.stillExpectedUsd : selected.item.estimatedUsd;
    setAmount(String(roundForCash(convertFromUsd(target, currency, rates), currency)));
  }

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    const result = await logExpense({
      amount: parsed,
      currency,
      budgetItemId: selected?.item.id ?? null,
      ...(selected ? {} : { category, label: label.trim() }),
      day,
      fund,
    });
    setSaving(false);
    if (result) closeLog();
  }

  const usdPreview = Number.isFinite(parsed) && currency !== "USD" ? formatMoney(convertToUsd(parsed, currency, rates), "USD") : null;

  return (
    <Sheet
      open
      onOpenChange={(next) => !next && closeLog()}
      title={selected ? `What did it cost?` : "Log a spend"}
      description={selected ? selected.item.label : "Amount, what for, done."}
      footer={
        <button type="button" onClick={save} disabled={!valid || saving} className="trip-btn trip-btn-primary w-full text-base">
          {saving ? "Saving…" : valid ? `Log ${formatMoney(parsed, currency)}` : "Log it"}
        </button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex flex-col gap-5"
      >
        <div>
          <div className="flex items-stretch gap-2">
            <div className="flex shrink-0 border border-[var(--t-line-strong)]">
              {[trip.spendCurrency, ...(trip.spendCurrency === "USD" ? [] : (["USD"] as Currency[]))].map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={currency === c}
                  onClick={() => setCurrency(c)}
                  className={`min-w-14 px-2 text-sm font-bold ${currency === c ? "bg-[var(--t-ink)] text-[var(--t-surface)]" : "bg-[var(--t-surface)] text-[var(--t-muted)]"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              ref={amountRef}
              autoFocus
              inputMode="decimal"
              enterKeyHint="done"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="0"
              aria-label={`Amount in ${currency}`}
              className="trip-input trip-num !min-h-[64px] flex-1 !text-4xl"
            />
          </div>
          <div className="mt-1.5 flex min-h-[28px] items-center justify-between gap-2 text-xs text-[var(--t-muted)]">
            <span>{usdPreview ? `≈ ${usdPreview}` : " "}</span>
            {selected && (
              <button type="button" onClick={fillAsPlanned} className="font-semibold text-[var(--t-sea)] underline underline-offset-2">
                {selected.item.kind === "running" ? `Fill what's left (${fmt(selected.stillExpectedUsd)})` : `As planned · ${fmt(selected.item.estimatedUsd)}`}
              </button>
            )}
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="trip-eyebrow mb-2">What for</legend>
          {suggestions.dayFixed.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.dayFixed.map((m) => (
                <button key={m.item.id} type="button" aria-pressed={itemId === m.item.id} onClick={() => choose(m.item.id)} className="trip-chip">
                  {m.item.label}
                  <span className="text-[11px] font-medium opacity-70">{fmt(m.item.estimatedUsd)}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {suggestions.running.map((m) => (
              <button key={m.item.id} type="button" aria-pressed={itemId === m.item.id} onClick={() => choose(m.item.id)} className="trip-chip">
                {m.item.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={other}
              onClick={() => {
                setOther(true);
                setItemId(null);
              }}
              className="trip-chip"
            >
              Something else
            </button>
          </div>
          {selected && selected.item.kind === "fixed" && selected.item.day !== selectedDay && (
            <p className="text-xs text-[var(--t-muted)]">Planned for {selected.item.day ? `${formatWeekday(selected.item.day)} ${formatDayMonth(selected.item.day)}` : "any day"}.</p>
          )}
          {suggestions.rest.length > 0 && !other && (
            <details className="text-sm">
              <summary className="cursor-pointer py-2 font-semibold text-[var(--t-muted)]">Other planned items ({suggestions.rest.length})</summary>
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.rest.map((m) => (
                  <button key={m.item.id} type="button" aria-pressed={itemId === m.item.id} onClick={() => choose(m.item.id)} className="trip-chip">
                    {m.item.label}
                  </button>
                ))}
              </div>
            </details>
          )}
          {other && (
            <div className="flex flex-col gap-2 border-l-2 border-[var(--t-sea)] pl-3">
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Coconut on the beach" aria-label="What was it" className="trip-input" autoFocus />
              <div className="flex flex-wrap gap-1.5">
                {BUDGET_CATEGORY_VALUES.filter((c) => c !== "accommodation").map((c) => (
                  <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className="trip-chip !min-h-[36px] !text-xs">
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="trip-eyebrow">Day</span>
            <select value={day ?? ""} onChange={(e) => setDay(e.target.value || null)} className="trip-input">
              {tripDates.map((d) => (
                <option key={d} value={d}>
                  {formatWeekday(d)} {formatDayMonth(d)}
                  {d === today ? " · today" : ""}
                </option>
              ))}
              <option value="">Not a trip day</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="trip-eyebrow">Paid from</span>
            <select value={fund} onChange={(e) => setFund(e.target.value as ExpenseFund)} className="trip-input">
              <option value="pot">Shared pot</option>
              <option value="reserve">Emergency reserve</option>
            </select>
          </label>
        </div>
        {fund === "reserve" && (
          <p className="bg-[var(--t-coral-soft)] px-3 py-2 text-xs text-[var(--t-coral)]">The reserve is for emergencies, not optional extras. It&apos;s tracked separately from the pot.</p>
        )}
      </form>
    </Sheet>
  );
}
