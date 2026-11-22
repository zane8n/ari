"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChartLineUp, Plus, SunHorizon, MapTrifold, Wallet } from "@phosphor-icons/react";
import { daysBetween, formatDateRange, tripPhase } from "@/lib/trip/dates";
import type { TripBundle } from "@/lib/trip/types";
import { CheckinSheet } from "./CheckinSheet";
import { InsightsView } from "./InsightsView";
import { MoneyView } from "./MoneyView";
import { PlanView } from "./PlanView";
import { QuickLogSheet } from "./QuickLogSheet";
import { TodayView } from "./TodayView";
import { TripProvider, useTrip } from "./TripContext";

export type TripTab = "today" | "plan" | "money" | "insights";

/**
 * The trip tracker shell. Entry points: /host/trip/<slug> (Today),
 * ?tab=plan|money|insights, ?log=1 (straight into the quick log — the
 * home-screen shortcut) and ?checkin=YYYY-MM-DD (the calendar reminder link).
 */
export function TripApp({ initial, entry }: { initial: TripBundle; entry: { tab?: TripTab; log?: boolean; checkin?: string } }) {
  return (
    <TripProvider initial={initial}>
      <Shell entry={entry} />
    </TripProvider>
  );
}

const TABS: { id: TripTab; label: string; icon: typeof SunHorizon }[] = [
  { id: "today", label: "Today", icon: SunHorizon },
  { id: "plan", label: "Plan", icon: MapTrifold },
  { id: "money", label: "Money", icon: Wallet },
  { id: "insights", label: "Insights", icon: ChartLineUp },
];

function Shell({ entry }: { entry: { tab?: TripTab; log?: boolean; checkin?: string } }) {
  const { bundle, today, money, fmt, currency, currencies, setCurrency, openLog, openCheckin, toast, dismissToast } = useTrip();
  const { trip, days } = bundle;
  const [tab, setTab] = useState<TripTab>(entry.tab ?? "today");

  // Deep links open their sheet once, then the URL is cleaned so a refresh doesn't reopen it.
  useEffect(() => {
    if (entry.log) openLog();
    if (entry.checkin && days.some((d) => d.date === entry.checkin)) openCheckin(entry.checkin);
    if (entry.log || entry.checkin) window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  function go(next: TripTab) {
    setTab(next);
    window.scrollTo({ top: 0 });
  }

  const phase = tripPhase(trip.startDate, trip.endDate, today);
  const dayIndex = days.findIndex((d) => d.date === today);
  const status =
    phase === "during" && dayIndex >= 0 ? `Day ${dayIndex + 1} of ${days.length}` : phase === "before" ? `In ${daysBetween(today, trip.startDate)} days` : "Home again";
  const over = money.headroomUsd < 0;

  return (
    <div className="trip">
      <header className="sticky top-0 z-30 border-b border-[var(--t-line)] bg-[var(--t-canvas)]/95 backdrop-blur" style={{ paddingTop: "var(--safe-t)" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
          <Link href="/host/trip?all=1" className="min-w-0 flex-1" aria-label="All trips">
            <span className="font-display block truncate text-xl leading-tight font-semibold">{trip.name}</span>
            <span className="block truncate text-[11px] font-semibold text-[var(--t-muted)]">
              {status} · {formatDateRange(trip.startDate, trip.endDate)}
            </span>
          </Link>
          {currencies.length > 1 && (
            <div className="flex shrink-0 border border-[var(--t-line-strong)]" role="group" aria-label="Display currency">
              {currencies.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={currency === c}
                  onClick={() => setCurrency(c)}
                  className={`min-h-[36px] min-w-12 px-2 text-xs font-bold ${currency === c ? "bg-[var(--t-ink)] text-[var(--t-surface)]" : "text-[var(--t-muted)]"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
        {tab !== "money" && (
          <button type="button" onClick={() => go("money")} className="mx-auto flex w-full max-w-2xl items-baseline gap-2 px-4 pb-2 text-left text-xs">
            <span className="font-semibold">Left {fmt(money.leftUsd)}</span>
            <span className="text-[var(--t-muted)]">·</span>
            <span className={over ? "font-semibold text-[var(--t-coral)]" : "text-[var(--t-muted)]"}>
              {over ? `plan runs ${fmt(-money.headroomUsd)} over` : `${fmt(money.extrasPerDayUsd)}/day free`}
            </span>
            {money.todaySpentUsd > 0 && (
              <>
                <span className="text-[var(--t-muted)]">·</span>
                <span className="text-[var(--t-muted)]">today {fmt(money.todaySpentUsd)}</span>
              </>
            )}
          </button>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-5" style={{ paddingBottom: "calc(var(--t-nav-h) + var(--safe-b) + 40px)" }}>
        {tab === "today" && <TodayView onOpenMoney={() => go("money")} />}
        {tab === "plan" && <PlanView />}
        {tab === "money" && <MoneyView />}
        {tab === "insights" && <InsightsView />}
      </main>

      <nav className="trip-nav" aria-label="Trip sections">
        <div className="mx-auto grid max-w-2xl grid-cols-5 items-stretch" style={{ height: "var(--t-nav-h)" }}>
          {TABS.slice(0, 2).map((t) => (
            <NavButton key={t.id} tab={t} active={tab === t.id} onClick={() => go(t.id)} />
          ))}
          <div className="flex items-center justify-center">
            <button type="button" onClick={() => openLog()} className="trip-fab flex h-14 w-14 -translate-y-3 flex-col items-center justify-center" aria-label="Log a spend">
              <Plus size={26} weight="bold" />
              <span className="text-[9px] font-bold tracking-widest uppercase">Log</span>
            </button>
          </div>
          {TABS.slice(2).map((t) => (
            <NavButton key={t.id} tab={t} active={tab === t.id} onClick={() => go(t.id)} />
          ))}
        </div>
      </nav>

      {toast && (
        <div className="trip-toast" role="status">
          <div className={`flex items-center gap-3 px-4 py-3 text-sm ${toast.tone === "warn" ? "bg-[var(--t-coral)] text-white" : "bg-[var(--t-ink)] text-[var(--t-surface)]"}`}>
            <span className="min-w-0 flex-1">{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={async () => {
                  const undo = toast.undo;
                  dismissToast();
                  await undo?.();
                }}
                className="shrink-0 font-bold underline underline-offset-2"
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}

      <CheckinSheet />
      <QuickLogSheet />
    </div>
  );
}

function NavButton({ tab, active, onClick }: { tab: (typeof TABS)[number]; active: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} className="relative flex flex-col items-center justify-center gap-0.5 text-[var(--t-muted)]">
      <Icon size={22} weight={active ? "fill" : "regular"} />
      <span className="text-[11px] font-bold">{tab.label}</span>
    </button>
  );
}
