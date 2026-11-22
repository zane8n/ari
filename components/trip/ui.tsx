"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import type { MoneySummary } from "@/lib/trip/money";

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="trip-sheet-overlay" />
        <Dialog.Content className="trip trip-sheet" style={{ minHeight: 0 }} aria-describedby={description ? undefined : undefined}>
          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-2xl leading-tight font-medium">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-[var(--t-muted)]">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="trip-btn trip-btn-quiet -mr-2 shrink-0" aria-label="Close">
              <X size={20} weight="bold" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
          {footer && <div className="trip-sheet-footer px-5 py-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="trip-eyebrow">{eyebrow}</p>}
        <h2 className="font-display text-xl leading-tight font-medium">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Spent · still expected · free — the one bar every money view shares. */
export function PotBar({ money }: { money: MoneySummary }) {
  const scale = Math.max(money.potUsd, money.forecastUsd, 1);
  const pct = (v: number) => `${Math.max(0, (v / scale) * 100)}%`;
  const over = money.headroomUsd < 0;
  return (
    <div>
      <div className="trip-bar" role="img" aria-label={`Spent ${Math.round((money.spentUsd / Math.max(1, money.potUsd)) * 100)}% of the pot`}>
        <span style={{ width: pct(money.spentUsd), background: "var(--t-ink)" }} />
        <span className="trip-hatch" style={{ width: pct(money.stillExpectedUsd) }} />
        {over && <span style={{ width: pct(-money.headroomUsd), background: "var(--t-coral)" }} />}
      </div>
      {over && (
        <div className="relative h-0">
          <span className="absolute -top-[14px] h-[18px] w-[2px] bg-[var(--t-ink)]" style={{ left: pct(money.potUsd) }} aria-hidden />
        </div>
      )}
    </div>
  );
}

export function Legend({ items }: { items: { swatch: React.ReactNode; label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-3 gap-2 text-xs">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="flex items-center gap-1.5 text-[var(--t-muted)]">
            {item.swatch}
            {item.label}
          </dt>
          <dd className="trip-num mt-0.5 truncate text-lg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const Swatch = {
  spent: <span className="inline-block h-2.5 w-2.5 bg-[var(--t-ink)]" aria-hidden />,
  expected: <span className="trip-hatch inline-block h-2.5 w-2.5" aria-hidden />,
  free: <span className="inline-block h-2.5 w-2.5 border border-[var(--t-line-strong)] bg-[var(--t-sunk)]" aria-hidden />,
  over: <span className="inline-block h-2.5 w-2.5 bg-[var(--t-coral)]" aria-hidden />,
};

export function CheckButton({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={onClick} className="trip-check">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Phone numbers in the plan become one-tap call and WhatsApp links. */
export function ContactLinks({ phone }: { phone: string }) {
  const digits = phone.replace(/[^\d+]/g, "");
  const wa = digits.replace(/^\+/, "");
  return (
    <span className="flex flex-wrap gap-2">
      <a href={`tel:${digits}`} className="trip-tag !bg-[var(--t-sea-soft)] !text-[var(--t-sea-strong)] min-h-[32px] px-2.5">
        Call {phone}
      </a>
      <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="trip-tag !bg-[var(--t-good-soft)] !text-[var(--t-good)] min-h-[32px] px-2.5">
        WhatsApp
      </a>
    </span>
  );
}
