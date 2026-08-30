"use client";

import { useState } from "react";
import { BUDGET_CATEGORY_VALUES, type BudgetCategory, type Currency, type TripDay } from "@/db/schema";
import type { SerializedBudgetItem } from "@/lib/server/trip";
import { convertToUsd, formatMoney, type ExchangeRates } from "@/lib/currency/convert";
import { budgetApi } from "./tripApi";

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  food: "Food",
  transport: "Transport",
  activities: "Activities",
  shopping: "Shopping",
  accommodation: "Accommodation",
  other: "Other",
};

function dayLabel(day: string | null, tripDays: TripDay[]): string {
  if (!day) return "General / unplanned";
  const found = tripDays.find((d) => d.date === day);
  const fmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const formatted = fmt.format(new Date(`${day}T00:00:00Z`));
  return found ? `${formatted} — ${found.label}` : formatted;
}

export function BudgetTab({
  budgetItems,
  setBudgetItems,
  currency,
  rates,
  money,
  onError,
  tripDays,
}: {
  budgetItems: SerializedBudgetItem[];
  setBudgetItems: React.Dispatch<React.SetStateAction<SerializedBudgetItem[]>>;
  currency: Currency;
  rates: ExchangeRates;
  money: (usd: number) => string;
  onError: (err: unknown) => void;
  tripDays: TripDay[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  const groups = new Map<string | null, SerializedBudgetItem[]>();
  for (const item of budgetItems) {
    const key = item.day;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  const sortedKeys = [...groups.keys()].sort((a, b) => (a ?? "9999").localeCompare(b ?? "9999"));

  async function handleUpdate(id: string, patch: Parameters<typeof budgetApi.update>[1]): Promise<void> {
    const updated = await budgetApi.update(id, patch);
    setBudgetItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      await budgetApi.remove(id);
      setBudgetItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      onError(err);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {sortedKeys.map((key) => (
        <div key={key ?? "none"} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink-muted">{dayLabel(key, tripDays)}</h2>
          <div className="flex flex-col gap-2">
            {groups.get(key)!.map((item) => (
              <BudgetRow key={item.id} item={item} currency={currency} rates={rates} money={money} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      ))}

      {showAddForm ? (
        <AddBudgetItemForm
          tripDays={tripDays}
          onCancel={() => setShowAddForm(false)}
          onCreate={async (input) => {
            try {
              const created = await budgetApi.create(input);
              setBudgetItems((prev) => [...prev, created]);
              setShowAddForm(false);
            } catch (err) {
              onError(err);
            }
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="self-start rounded-lg border border-dashed border-black/20 px-4 py-2 text-sm text-ink-muted hover:border-black/40 hover:text-ink"
        >
          + Add budget item
        </button>
      )}
    </div>
  );
}

function BudgetRow({
  item,
  currency,
  rates,
  money,
  onUpdate,
  onDelete,
}: {
  item: SerializedBudgetItem;
  currency: Currency;
  rates: ExchangeRates;
  money: (usd: number) => string;
  onUpdate: (id: string, patch: Parameters<typeof budgetApi.update>[1]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [logging, setLogging] = useState(false);
  const [amount, setAmount] = useState(item.actualAmount !== null ? String(item.actualAmount) : "");
  const [entryCurrency, setEntryCurrency] = useState<Currency>(item.actualCurrency ?? currency);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasActual = item.actualUsd !== null;
  const variance = hasActual ? item.actualUsd! - item.estimatedUsd : null;

  async function handleSave(): Promise<void> {
    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return;
    setSaving(true);
    setError(null);
    try {
      await onUpdate(item.id, { actualAmount: parsedAmount, actualCurrency: entryCurrency });
      setLogging(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await onUpdate(item.id, { actualAmount: null, actualCurrency: null });
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear — try again.");
    } finally {
      setSaving(false);
    }
  }

  /** One click for "it cost exactly what we planned" — no typing needed. */
  async function handleAcceptBudget(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await onUpdate(item.id, { actualAmount: item.estimatedUsd, actualCurrency: "USD" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-black/10 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ink-muted uppercase">
              {CATEGORY_LABELS[item.category]}
            </span>
            {item.isReserve && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 uppercase" style={{ background: "#fef3c7" }}>
                Reserve
              </span>
            )}
          </div>
          <p className="mt-1 font-medium text-ink">{item.label}</p>
          {item.notes && <p className="mt-0.5 text-xs text-ink-muted">{item.notes}</p>}
        </div>
        <button type="button" onClick={() => onDelete(item.id)} aria-label="Delete" className="shrink-0 p-1 text-ink-muted hover:text-red-600">
          ✕
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-ink-muted">
          Est. <span className="font-medium text-ink">{money(item.estimatedUsd)}</span>
        </span>
        {hasActual ? (
          <span className="text-ink-muted">
            Actual{" "}
            <span className="font-medium text-ink">
              {item.actualCurrency && item.actualAmount !== null ? formatMoney(item.actualAmount, item.actualCurrency) : money(item.actualUsd!)}
            </span>
            {variance !== null && (
              <span className={`ml-1 ${variance > 0 ? "text-red-600" : "text-green-700"}`}>
                ({variance > 0 ? "+" : ""}
                {money(variance)})
              </span>
            )}
          </span>
        ) : (
          <span className="text-ink-muted italic">Not logged yet</span>
        )}
      </div>

      {logging ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            className="w-28 rounded-md border border-black/15 px-2 py-1.5 text-sm outline-none focus:border-black/40"
          />
          <select
            value={entryCurrency}
            onChange={(event) => setEntryCurrency(event.target.value as Currency)}
            className="rounded-md border border-black/15 px-2 py-1.5 text-sm outline-none focus:border-black/40"
          >
            <option value="USD">USD</option>
            <option value="KES">KES</option>
            <option value="TZS">TZS</option>
          </select>
          <button type="button" onClick={handleSave} disabled={saving || !amount} className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setLogging(false)} disabled={saving} className="rounded-md px-3 py-1.5 text-sm text-ink-muted">
            Cancel
          </button>
          {rates && amount && Number.isFinite(Number.parseFloat(amount)) && entryCurrency !== "USD" && (
            <span className="text-xs text-ink-muted">≈ {formatMoney(convertToUsd(Number.parseFloat(amount), entryCurrency, rates), "USD")}</span>
          )}
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setLogging(true)} disabled={saving} className="text-xs font-medium text-ink underline disabled:opacity-50">
            {hasActual ? "Edit actual" : "Log actual"}
          </button>
          {!hasActual && (
            <button type="button" onClick={handleAcceptBudget} disabled={saving} className="text-xs font-medium text-ink underline disabled:opacity-50">
              {saving ? "Saving…" : "Accept budget"}
            </button>
          )}
          {hasActual && (
            <button type="button" onClick={handleClear} disabled={saving} className="text-xs text-ink-muted underline disabled:opacity-50">
              Clear
            </button>
          )}
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

function AddBudgetItemForm({
  onCancel,
  onCreate,
  tripDays,
}: {
  onCancel: () => void;
  onCreate: (input: { category: BudgetCategory; label: string; day: string | null; estimatedUsd: number; notes?: string; isReserve?: boolean }) => Promise<void>;
  tripDays: TripDay[];
}) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<BudgetCategory>("other");
  const [day, setDay] = useState<string>("");
  const [estimatedUsd, setEstimatedUsd] = useState("");
  const [isReserve, setIsReserve] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const parsed = Number.parseFloat(estimatedUsd);
    if (!label.trim() || !Number.isFinite(parsed) || parsed < 0) return;
    setSaving(true);
    try {
      await onCreate({ category, label: label.trim(), day: day || null, estimatedUsd: parsed, isReserve });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white px-4 py-3">
      <input
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="What is this? e.g. Souvenir at Maasai Market"
        className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40"
      />
      <div className="flex flex-wrap gap-2">
        <select value={category} onChange={(event) => setCategory(event.target.value as BudgetCategory)} className="rounded-md border border-black/15 px-2 py-1.5 text-sm">
          {BUDGET_CATEGORY_VALUES.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
        <select value={day} onChange={(event) => setDay(event.target.value)} className="rounded-md border border-black/15 px-2 py-1.5 text-sm">
          <option value="">No specific day</option>
          {tripDays.map((d) => (
            <option key={d.date} value={d.date}>
              {d.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={estimatedUsd}
          onChange={(event) => setEstimatedUsd(event.target.value)}
          placeholder="Est. USD"
          className="w-28 rounded-md border border-black/15 px-2 py-1.5 text-sm"
        />
        <label className="flex items-center gap-1.5 text-xs text-ink-muted">
          <input type="checkbox" checked={isReserve} onChange={(event) => setIsReserve(event.target.checked)} />
          Reserve card
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
          Add
        </button>
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-ink-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}
