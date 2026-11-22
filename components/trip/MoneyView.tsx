"use client";

import { useMemo, useState } from "react";
import { Trash } from "@phosphor-icons/react";
import { BUDGET_CATEGORY_VALUES, type BudgetCategory, type BudgetKind } from "@/db/schema";
import { formatMoney } from "@/lib/currency/convert";
import { CATEGORY_LABELS } from "@/lib/trip/analysis";
import { formatDayMonth, formatWeekday } from "@/lib/trip/dates";
import type { ItemMoney } from "@/lib/trip/money";
import { AnimatePresence, m } from "@/lib/motion/m";
import { useTrip } from "./TripContext";
import { CountUp, ease, Fleuron, PotRing, Reveal, Rise, SectionTitle, Stat } from "./ui";

type MoneyTab = "overview" | "budget" | "payments";
const MONEY_TABS: { id: MoneyTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "budget", label: "Budget" },
  { id: "payments", label: "Payments" },
];

export function MoneyView() {
  const { money, fmt } = useTrip();
  const [tab, setTab] = useState<MoneyTab>("overview");
  const over = money.headroomUsd < 0;

  return (
    <div className="flex flex-col gap-8 pt-4">
      <Rise className="flex flex-col items-center gap-5">
        <PotRing money={money} size={240}>
          <p className="trip-eyebrow">Left in our pot</p>
          <p className="trip-num mt-1 text-[40px] leading-none">
            <CountUp value={money.leftUsd} format={fmt} />
          </p>
          <p className="mt-1 text-xs text-[var(--t-muted)]">of {fmt(money.potUsd)}</p>
        </PotRing>
        <p className={`max-w-sm text-center text-[15px] leading-relaxed ${over ? "text-[var(--t-coral)]" : "text-[var(--t-muted)]"}`}>
          {over
            ? `If the rest goes to plan we land ${fmt(-money.headroomUsd)} over. Plan B below shows what to swap first.`
            : money.daysLeft > 0
              ? `If the rest goes to plan, ${fmt(money.headroomUsd)} stays free — about ${fmt(money.extrasPerDayUsd)} a day for treats.`
              : `We came home with ${fmt(money.headroomUsd)} unspent.`}
        </p>
      </Rise>

      <Fleuron />

      <Rise delay={0.08} className="grid grid-cols-3 gap-2">
        <Stat label="Spent" value={fmt(money.spentUsd)} />
        <Stat label="Still planned" value={fmt(money.stillExpectedUsd)} />
        <Stat label={over ? "Over" : "Free"} value={fmt(Math.abs(money.headroomUsd))} tone={over ? "warn" : "good"} />
      </Rise>

      <Rise delay={0.14} className="flex justify-center">
        <div className="trip-seg" role="tablist" aria-label="Money sections">
          {MONEY_TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {tab === t.id && <m.span layoutId="money-tab" className="trip-seg-pill" transition={{ duration: 0.4, ease }} />}
              {t.label}
            </button>
          ))}
        </div>
      </Rise>

      <AnimatePresence mode="wait">
        <m.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease }} className="flex flex-col gap-6">
          {tab === "overview" && <Overview />}
          {tab === "budget" && <BudgetLines />}
          {tab === "payments" && <Payments />}
        </m.div>
      </AnimatePresence>
    </div>
  );
}

function Overview() {
  const { money, fmt, bundle } = useTrip();
  const over = money.headroomUsd < 0;
  return (
    <>
      <section className="trip-card flex flex-col gap-5 p-6">
        <p className="trip-eyebrow">Where it goes</p>
        <ul className="flex flex-col gap-4">
          {money.byCategory.map((row) => {
            const scale = Math.max(row.plannedUsd, row.spentUsd + row.stillExpectedUsd, 1);
            const hot = row.spentUsd + row.stillExpectedUsd > row.plannedUsd + 0.5;
            return (
              <li key={row.category}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{CATEGORY_LABELS[row.category]}</span>
                  <span className="tabular-nums">
                    <span className={hot ? "text-[var(--t-coral)]" : ""}>{fmt(row.spentUsd)}</span>
                    <span className="text-[var(--t-muted)]"> of {fmt(row.plannedUsd)}</span>
                  </span>
                </div>
                <div className="trip-bar mt-2 !h-1.5">
                  <m.span initial={{ width: 0 }} animate={{ width: `${(row.spentUsd / scale) * 100}%` }} transition={{ duration: 0.8, ease }} style={{ background: hot ? "var(--t-coral)" : "var(--t-sea)" }} />
                  <m.span initial={{ width: 0 }} animate={{ width: `${(row.stillExpectedUsd / scale) * 100}%` }} transition={{ duration: 0.8, ease, delay: 0.1 }} style={{ background: "color-mix(in srgb, var(--t-sea) 24%, transparent)" }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {money.cutPlan.length > 0 && (over ? <CutList /> : <Reveal label="Plan B, if we ever run over" className="trip-soft px-5"><CutList bare /></Reveal>)}

      <ReserveCard />

      {bundle.trip.rules.length > 0 && (
        <Reveal label="Our money rules" className="trip-soft px-5">
          <ol className="flex list-decimal flex-col gap-2 pb-4 pl-5 text-sm leading-relaxed">
            {bundle.trip.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </Reveal>
      )}
      {money.freedUsd > 0 && <p className="text-center text-sm text-[var(--t-good)]">Skipped plans have freed {fmt(money.freedUsd)}.</p>}
    </>
  );
}

function CutList({ bare = false }: { bare?: boolean }) {
  const { money, fmt, updateItem } = useTrip();
  const over = money.headroomUsd < 0 ? -money.headroomUsd : 0;
  return (
    <section className={`flex flex-col gap-4 ${bare ? "pb-4" : "trip-card p-6"}`}>
      {!bare && <SectionTitle eyebrow={`We need to find ${fmt(over)}`} title="Swap in this order" />}
      <ol className="flex flex-col gap-2">
        {money.cutPlan.map((step, i) => {
          const covers = over > 0 && step.cumulativeUsd >= over && (i === 0 || money.cutPlan[i - 1].cumulativeUsd < over);
          return (
            <li key={step.item.id} className="flex items-start gap-3">
              <span className="trip-num w-6 shrink-0 text-xl leading-6 text-[var(--t-muted)]">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{step.item.label}</p>
                {step.note && <p className="text-xs text-[var(--t-muted)]">{step.note}</p>}
                <p className="mt-0.5 text-xs font-semibold text-[var(--t-good)]">
                  saves ~{fmt(step.savingUsd)}
                  {covers ? " · this covers it" : ""}
                </p>
              </div>
              {over > 0 && (
                <button type="button" onClick={() =>
                    updateItem(step.item.id, {
                      estimatedUsd: Math.max(0, step.item.estimatedUsd - step.savingUsd),
                      cutRank: null,
                      notes: step.note ? `Cut applied: ${step.note}` : "Cut applied.",
                    })
                  } className="trip-btn trip-btn-ghost !min-h-[36px] shrink-0 !px-3 text-xs">
                  Apply
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ReserveCard() {
  const { money, fmt } = useTrip();
  if (money.reserveUsd <= 0 && money.reserveSpentUsd <= 0) return null;
  const used = money.reserveSpentUsd > 0;
  return (
    <section className="trip-soft flex items-center justify-between gap-3 px-5 py-4">
      <div>
        <p className="text-sm font-medium">Emergency reserve</p>
        <p className="text-xs text-[var(--t-muted)]">Never for optional activities.</p>
      </div>
      <div className="text-right">
        <p className={`trip-num text-2xl leading-none ${used ? "text-[var(--t-coral)]" : ""}`}>{fmt(money.reserveLeftUsd)}</p>
        <p className="text-[11px] text-[var(--t-muted)]">{used ? `${fmt(money.reserveSpentUsd)} used` : "untouched"}</p>
      </div>
    </section>
  );
}

function BudgetLines() {
  const { money } = useTrip();
  const [adding, setAdding] = useState(false);
  const lines = money.items.filter((x) => !x.item.isReserve);
  const running = lines.filter((x) => x.item.kind === "running");
  const upcoming = lines.filter((x) => x.item.kind === "fixed" && x.item.status === "open");
  const settled = lines.filter((x) => x.item.kind === "fixed" && x.item.status !== "open");

  return (
    <section className="flex flex-col gap-4">
            {running.length > 0 && <LineGroup title="Running pots" lines={running} />}
      {upcoming.length > 0 && <LineGroup title="Still to pay" lines={upcoming} />}
      {settled.length > 0 && <LineGroup title="Settled" lines={settled} />}
      {adding ? (
        <AddLineForm onDone={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="trip-btn trip-btn-ghost w-full">
          + Add a budget line
        </button>
      )}
    </section>
  );
}

function LineGroup({ title, lines }: { title: string; lines: ItemMoney[] }) {
  return (
    <div>
      <p className="trip-eyebrow mb-2 px-1">{title}</p>
      <ul className="trip-card divide-y divide-[var(--t-line)] overflow-hidden">
        {lines.map((x) => (
          <LineRow key={x.item.id} line={x} />
        ))}
      </ul>
    </div>
  );
}

function LineRow({ line }: { line: ItemMoney }) {
  const { fmt, money, openLog, updateItem, removeItem } = useTrip();
  const [open, setOpen] = useState(false);
  const [estimate, setEstimate] = useState(String(line.item.estimatedUsd));
  const { item } = line;
  const perDay = item.kind === "running" && money.daysLeft > 0 ? line.stillExpectedUsd / money.daysLeft : null;
  const pct = item.estimatedUsd > 0 ? Math.min(100, (line.paidUsd / item.estimatedUsd) * 100) : 0;

  return (
    <li className="px-5 py-4">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-baseline justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className={`block text-sm font-semibold ${item.status === "dropped" ? "text-[var(--t-muted)] line-through" : ""}`}>{item.label}</span>
          <span className="block text-[11px] text-[var(--t-muted)]">
            {item.day ? `${formatWeekday(item.day)} ${formatDayMonth(item.day)} · ` : ""}
            {CATEGORY_LABELS[item.category]}
            {item.cutRank !== null ? " · cuttable" : ""}
          </span>
        </span>
        <span className="shrink-0 text-right text-sm tabular-nums">
          {item.kind === "running" ? (
            <>
              <span className="block font-semibold">{fmt(line.stillExpectedUsd)} left</span>
              <span className="block text-[11px] text-[var(--t-muted)]">
                {fmt(line.paidUsd)} of {fmt(item.estimatedUsd)}
                {perDay !== null ? ` · ~${fmt(perDay)}/day` : ""}
              </span>
            </>
          ) : item.status === "paid" ? (
            <>
              <span className="block font-semibold">{fmt(line.paidUsd)}</span>
              {line.varianceUsd !== null && Math.abs(line.varianceUsd) >= 0.5 && (
                <span className={`block text-[11px] font-semibold ${line.varianceUsd > 0 ? "text-[var(--t-coral)]" : "text-[var(--t-good)]"}`}>
                  {line.varianceUsd > 0 ? "+" : "−"}
                  {fmt(Math.abs(line.varianceUsd))} vs plan
                </span>
              )}
            </>
          ) : item.status === "dropped" ? (
            <span className="block text-[11px] font-semibold text-[var(--t-good)]">{fmt(item.estimatedUsd)} freed</span>
          ) : (
            <span className="block font-semibold">{fmt(item.estimatedUsd)}</span>
          )}
        </span>
      </button>
      {item.kind === "running" && (
        <div className="trip-bar mt-2 !h-1">
          <span style={{ width: `${pct}%`, background: line.paidUsd > item.estimatedUsd ? "var(--t-coral)" : "var(--t-sea)" }} />
        </div>
      )}
      {open && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {item.status !== "dropped" && (
            <button type="button" onClick={() => openLog({ budgetItemId: item.id })} className="trip-btn trip-btn-primary !min-h-[36px] !px-3 text-xs">
              Log spend
            </button>
          )}
          {item.status === "open" && item.kind === "fixed" && (
            <button type="button" onClick={() => updateItem(item.id, { status: "dropped" })} className="trip-btn trip-btn-ghost !min-h-[36px] !px-3 text-xs">
              Not happening
            </button>
          )}
          {item.status !== "open" && (
            <button type="button" onClick={() => updateItem(item.id, { status: "open" })} className="trip-btn trip-btn-ghost !min-h-[36px] !px-3 text-xs">
              Reopen
            </button>
          )}
          <label className="flex items-center gap-1 text-xs text-[var(--t-muted)]">
            Est. USD
            <input
              inputMode="decimal"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value.replace(/[^\d.]/g, ""))}
              onBlur={() => {
                const v = Number.parseFloat(estimate);
                if (Number.isFinite(v) && v !== item.estimatedUsd) void updateItem(item.id, { estimatedUsd: v });
              }}
              className="trip-input !min-h-[36px] !w-20 !text-sm"
            />
          </label>
          <button type="button" onClick={() => removeItem(item.id)} aria-label={`Delete ${item.label}`} className="trip-btn trip-btn-quiet ml-auto !min-h-[36px]">
            <Trash size={16} />
          </button>
          {item.notes && <p className="w-full text-xs text-[var(--t-muted)]">{item.notes}</p>}
        </div>
      )}
    </li>
  );
}

function AddLineForm({ onDone }: { onDone: () => void }) {
  const { bundle, addItem } = useTrip();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<BudgetCategory>("food");
  const [kind, setKind] = useState<BudgetKind>("fixed");
  const [day, setDay] = useState("");
  const [estimate, setEstimate] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="trip-card flex flex-col gap-3 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const v = Number.parseFloat(estimate);
        if (!label.trim() || !Number.isFinite(v)) return;
        setSaving(true);
        await addItem({ label: label.trim(), category, kind, day: day || null, estimatedUsd: v });
        setSaving(false);
        onDone();
      }}
    >
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What is it?" aria-label="Label" className="trip-input" autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value as BudgetCategory)} aria-label="Category" className="trip-input">
          {BUDGET_CATEGORY_VALUES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value as BudgetKind)} aria-label="Kind" className="trip-input">
          <option value="fixed">One-off</option>
          <option value="running">Running pot</option>
        </select>
        <select value={day} onChange={(e) => setDay(e.target.value)} aria-label="Day" className="trip-input">
          <option value="">Any day</option>
          {bundle.days.map((d) => (
            <option key={d.date} value={d.date}>
              {formatWeekday(d.date)} {formatDayMonth(d.date)}
            </option>
          ))}
        </select>
        <input inputMode="decimal" value={estimate} onChange={(e) => setEstimate(e.target.value.replace(/[^\d.]/g, ""))} placeholder="Est. USD" aria-label="Estimate in USD" className="trip-input" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="trip-btn trip-btn-primary">
          Add
        </button>
        <button type="button" onClick={onDone} className="trip-btn trip-btn-quiet">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Payments() {
  const { bundle, fmt, removeExpense } = useTrip();
  const [showAll, setShowAll] = useState(false);
  const groups = useMemo(() => {
    const sorted = [...bundle.expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const map = new Map<string, typeof sorted>();
    for (const e of sorted) {
      const key = e.day ?? "";
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [bundle.expenses]);
  const visible = showAll ? groups : groups.slice(0, 3);

  return (
    <section className="flex flex-col gap-3">
      <p className="trip-eyebrow text-center">{bundle.expenses.length} logged</p>
      {groups.length === 0 && <p className="text-sm text-[var(--t-muted)]">Nothing logged yet. The + button logs a spend in three taps.</p>}
      {visible.map(([day, list]) => (
        <div key={day || "none"}>
          <div className="flex items-baseline justify-between">
            <p className="trip-eyebrow">{day ? `${formatWeekday(day)} ${formatDayMonth(day)}` : "Before / outside the trip"}</p>
            <p className="text-xs font-semibold tabular-nums">{fmt(list.filter((e) => e.fund === "pot").reduce((s, e) => s + e.amountUsd, 0))}</p>
          </div>
          <ul className="trip-card mt-2 divide-y divide-[var(--t-line)] overflow-hidden">
            {list.map((e) => (
              <li key={e.id} className="flex items-center gap-2 py-2 pr-2 pl-5 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {e.label}
                  {e.fund === "reserve" && <span className="trip-tag ml-1.5 !bg-[var(--t-coral-soft)] !text-[var(--t-coral)]">Reserve</span>}
                </span>
                <span className="shrink-0 tabular-nums">{formatMoney(e.amount, e.currency)}</span>
                <button type="button" onClick={() => removeExpense(e.id)} aria-label={`Remove ${e.label}`} className="trip-btn trip-btn-quiet !min-h-[36px] shrink-0 !px-2">
                  <Trash size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {groups.length > 3 && (
        <button type="button" onClick={() => setShowAll(!showAll)} className="trip-btn trip-btn-quiet self-start text-xs">
          {showAll ? "Show fewer days" : `Show all ${groups.length} days`}
        </button>
      )}
    </section>
  );
}
