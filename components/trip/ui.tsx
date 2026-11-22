"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CaretDown, Phone, WhatsappLogo, X } from "@phosphor-icons/react";
import { animate, AnimatePresence, m, useReducedMotion } from "@/lib/motion/m";
import { FLUID_EASE } from "@/lib/motion/tokens";
import { THEME_LIST, type ThemeId } from "@/lib/theme/themes";
import type { MoneySummary } from "@/lib/trip/money";
import { tripThemeVars } from "@/lib/trip/theme";
import { useTrip } from "./TripContext";

export const ease = FLUID_EASE;
/** The letter's own entrance curve — slower and calmer than the app default. */
export const calm = [0.22, 0.8, 0.3, 1] as const;

/** ── ◆ ── the letter's fleuron, the only divider the trip uses. */
export function Fleuron({ className = "" }: { className?: string }) {
  return (
    <div className={`trip-fleuron ${className}`} aria-hidden>
      <i />
    </div>
  );
}

/** Sheets render in a portal outside the trip root, so they carry this device's palette themselves. */
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
  const { themeId } = useTrip();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="trip-sheet-overlay" />
        <Dialog.Content className="trip trip-sheet" style={{ minHeight: 0, ...(tripThemeVars(themeId) as React.CSSProperties) }}>
          <div className="flex items-start justify-between gap-3 px-6 pt-4 pb-3">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-[30px] leading-tight font-medium italic">{title}</Dialog.Title>
              <Dialog.Description className={description ? "mt-0.5 text-sm text-[var(--t-muted)]" : "sr-only"}>{description ?? title}</Dialog.Description>
            </div>
            <Dialog.Close className="trip-btn trip-btn-quiet -mr-3 !min-h-[44px] !w-11 shrink-0 !p-0" aria-label="Close">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">{children}</div>
          {footer && <div className="trip-sheet-footer px-6 py-4">{footer}</div>}
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
        <h2 className="font-display text-2xl leading-tight font-medium">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Content that eases in as it appears — the one entrance every screen shares. */
export function Rise({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <m.div className={className} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62, ease: calm, delay }}>
      {children}
    </m.div>
  );
}

/** Progressive disclosure: secondary detail stays folded away until asked for. */
export function Reveal({ label, children, defaultOpen = false, className = "" }: { label: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={className}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left">
        <span className="text-sm font-medium text-[var(--t-muted)]">{label}</span>
        <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease }} className="text-[var(--t-muted)]">
          <CaretDown size={16} />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
            <div className="pt-2">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A number that glides to its new value instead of jumping. */
export function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduce) {
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, { duration: 0.8, ease, onUpdate: (v) => setShown(v) });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);
  return <>{format(reduce ? value : shown)}</>;
}

/** The pot as a soft ring: spent (solid) → still planned (tint). Over-budget spills in coral. */
export function PotRing({ money, size = 220, children }: { money: MoneySummary; size?: number; children?: React.ReactNode }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const scale = Math.max(money.potUsd, money.forecastUsd, 1);
  const spent = Math.min(1, money.spentUsd / scale);
  const planned = Math.min(1 - spent, money.stillExpectedUsd / scale);
  const over = money.headroomUsd < 0;
  const arc = (fraction: number, offset: number, color: string, key: string) => (
    <m.circle
      key={key}
      cx={size / 2}
      cy={size / 2}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="butt"
      transform={`rotate(-90 ${size / 2} ${size / 2})`}
      initial={{ strokeDasharray: `0 ${c}` }}
      animate={{ strokeDasharray: `${Math.max(0, fraction * c)} ${c}`, strokeDashoffset: -offset * c }}
      transition={{ duration: 1.2, ease: calm }}
    />
  );
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${Math.round((money.spentUsd / Math.max(1, money.potUsd)) * 100)}% of the pot spent`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(184 144 76 / 0.35)" strokeWidth={1} />
        <circle cx={size / 2} cy={size / 2} r={r - 10} fill="none" stroke="rgb(184 144 76 / 0.18)" strokeWidth={1} />
        {planned > 0.005 && arc(planned, spent, over ? "var(--t-coral)" : "color-mix(in srgb, var(--t-sea) 28%, transparent)", "planned")}
        {spent > 0.005 && arc(spent, 0, "var(--t-sea)", "spent")}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/** Slim linear version of the ring for glances. */
export function PotBar({ money }: { money: MoneySummary }) {
  const scale = Math.max(money.potUsd, money.forecastUsd, 1);
  const pct = (v: number) => `${Math.max(0, (v / scale) * 100)}%`;
  return (
    <div className="trip-bar" role="img" aria-label={`Spent ${Math.round((money.spentUsd / Math.max(1, money.potUsd)) * 100)}% of the pot`}>
      <m.span initial={{ width: 0 }} animate={{ width: pct(money.spentUsd) }} transition={{ duration: 0.9, ease }} style={{ background: "var(--t-sea)" }} />
      <m.span
        initial={{ width: 0 }}
        animate={{ width: pct(money.stillExpectedUsd) }}
        transition={{ duration: 0.9, ease, delay: 0.1 }}
        style={{ background: money.headroomUsd < 0 ? "var(--t-coral)" : "color-mix(in srgb, var(--t-sea) 28%, transparent)" }}
      />
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "good" | "warn" }) {
  return (
    <div className="min-w-0 text-center">
      <p className={`trip-num truncate text-2xl leading-none ${tone === "good" ? "text-[var(--t-good)]" : tone === "warn" ? "text-[var(--t-coral)]" : ""}`}>{value}</p>
      <p className="mt-1.5 text-xs text-[var(--t-muted)]">{label}</p>
    </div>
  );
}

export function CheckButton({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={onClick} className="trip-check">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <m.path
          d="M3.5 8.5l3 3 6-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="butt"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.3, ease }}
        />
      </svg>
    </button>
  );
}

/** Phone numbers in the plan become one-tap call and WhatsApp buttons. */
export function ContactLinks({ phone }: { phone: string }) {
  const digits = phone.replace(/[^\d+]/g, "");
  return (
    <span className="flex flex-wrap gap-2">
      <a href={`tel:${digits}`} className="trip-chip !min-h-[38px] !text-[13px]">
        <Phone size={15} /> Call
      </a>
      <a href={`https://wa.me/${digits.replace(/^\+/, "")}`} target="_blank" rel="noreferrer" className="trip-chip !min-h-[38px] !text-[13px]">
        <WhatsappLogo size={15} /> WhatsApp
      </a>
    </span>
  );
}

/** The twelve invitation palettes as soft swatches. */
export function ThemePicker({ value, onChange }: { value: ThemeId; onChange: (id: ThemeId) => void }) {
  const current = THEME_LIST.find((t) => t.id === value);
  return (
    <div>
      <div className="grid grid-cols-6 gap-3" role="radiogroup" aria-label="Your colour">
        {THEME_LIST.map((theme) => {
          const active = theme.id === value;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={theme.displayName}
              onClick={() => onChange(theme.id)}
              className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95"
              style={{ background: theme.accent, boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.45), 0 0 0 1px rgb(184 144 76 / 0.35)" }}
            >
              {active && <m.span layoutId="theme-ring" className="absolute -inset-[5px] rounded-full border" style={{ borderColor: "var(--t-gilt)" }} transition={{ duration: 0.4, ease: calm }} />}
            </button>
          );
        })}
      </div>
      {current && (
        <p className="mt-3 text-center text-sm">
          <span className="font-display text-lg font-medium italic">{current.displayName}</span>
          <span className="text-[var(--t-muted)]"> · {current.character}</span>
        </p>
      )}
    </div>
  );
}
