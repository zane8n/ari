"use client";

import { useEffect, useState } from "react";
import { ChartLineUp, MapTrifold, Plus, SunHorizon, Wallet } from "@phosphor-icons/react";
import { AnimatePresence, domMax, LazyMotion, m, MotionConfig } from "@/lib/motion/m";
import type { ThemeId } from "@/lib/theme/themes";
import { daysBetween, tripPhase } from "@/lib/trip/dates";
import { tripThemeVars } from "@/lib/trip/theme";
import type { TripBundle } from "@/lib/trip/types";
import { CheckinSheet } from "./CheckinSheet";
import { InsightsView } from "./InsightsView";
import { MoneyView } from "./MoneyView";
import { PlanView } from "./PlanView";
import { QuickLogSheet } from "./QuickLogSheet";
import { TodayView } from "./TodayView";
import { TripProvider, useTrip } from "./TripContext";
import { TripMenu } from "./TripMenu";
import { ease } from "./ui";

export type TripTab = "today" | "plan" | "money" | "insights";

/**
 * The trip tracker shell. Entry points: /host/trip/<slug> (Today),
 * ?tab=plan|money|insights, ?log=1 (straight into the quick log — the
 * home-screen shortcut) and ?checkin=YYYY-MM-DD (the calendar reminder link).
 * Reached either by the host or by a guest holding a one-time pass; each
 * device wears its own palette.
 */
export function TripApp({
  initial,
  access,
  themeId,
  entry,
}: {
  initial: TripBundle;
  access: "host" | "guest";
  themeId: ThemeId;
  entry: { tab?: TripTab; log?: boolean; checkin?: string };
}) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <TripProvider initial={initial} isHost={access === "host"} themeId={themeId}>
          <Shell entry={entry} />
        </TripProvider>
      </MotionConfig>
    </LazyMotion>
  );
}

const TABS: { id: TripTab; label: string; icon: typeof SunHorizon }[] = [
  { id: "today", label: "Today", icon: SunHorizon },
  { id: "plan", label: "Plan", icon: MapTrifold },
  { id: "money", label: "Money", icon: Wallet },
  { id: "insights", label: "Insights", icon: ChartLineUp },
];

function Shell({ entry }: { entry: { tab?: TripTab; log?: boolean; checkin?: string } }) {
  const { bundle, today, openLog, openCheckin, toast, dismissToast, themeId } = useTrip();
  const { trip, days } = bundle;
  const [tab, setTab] = useState<TripTab>(entry.tab ?? "today");
  const [menuOpen, setMenuOpen] = useState(false);

  // Deep links open their sheet once, then the URL is cleaned so a refresh doesn't reopen it.
  useEffect(() => {
    if (entry.log) openLog();
    if (entry.checkin && days.some((d) => d.date === entry.checkin)) openCheckin(entry.checkin);
    if (entry.log || entry.checkin) window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  function go(next: TripTab) {
    if (next === tab) return;
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const phase = tripPhase(trip.startDate, trip.endDate, today);
  const dayIndex = days.findIndex((d) => d.date === today);
  const status = phase === "during" && dayIndex >= 0 ? `Day ${dayIndex + 1} of ${days.length}` : phase === "before" ? `In ${daysBetween(today, trip.startDate)} days` : "Home again";

  return (
    <div className="trip trip-luxe" style={tripThemeVars(themeId) as React.CSSProperties}>
      <header className="trip-header sticky top-0 z-30" style={{ paddingTop: "var(--safe-t)" }}>
        <div className="mx-auto flex max-w-xl items-center gap-3 px-6 py-3">
          <button type="button" onClick={() => setMenuOpen(true)} className="trip-monogram shrink-0" aria-label="Trip menu">
            {trip.name.slice(0, 1)}
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-[22px] leading-tight font-medium">{trip.name}</p>
            <p className="truncate text-xs text-[var(--t-muted)]">{status}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 pt-4" style={{ paddingBottom: "calc(var(--t-nav-h) + var(--safe-b) + 64px)" }}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease }}>
            {tab === "today" && <TodayView onOpenMoney={() => go("money")} onOpenPlan={() => go("plan")} />}
            {tab === "plan" && <PlanView />}
            {tab === "money" && <MoneyView />}
            {tab === "insights" && <InsightsView />}
          </m.div>
        </AnimatePresence>
      </main>

      <nav className="trip-nav" aria-label="Trip sections">
        <div className="grid grid-cols-5 items-center" style={{ height: "var(--t-nav-h)" }}>
          {TABS.slice(0, 2).map((t) => (
            <NavButton key={t.id} tab={t} active={tab === t.id} onClick={() => go(t.id)} />
          ))}
          <div className="flex items-center justify-center">
            <button type="button" onClick={() => openLog()} className="trip-fab flex h-14 w-14 -translate-y-4 items-center justify-center" aria-label="Log a spend">
              <Plus size={26} weight="bold" />
            </button>
          </div>
          {TABS.slice(2).map((t) => (
            <NavButton key={t.id} tab={t} active={tab === t.id} onClick={() => go(t.id)} />
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {toast && (
          <m.div
            key={toast.id}
            className="trip-toast"
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className={`flex items-center gap-3 px-5 py-3.5 text-sm ${toast.tone === "warn" ? "trip-toast-warn" : "trip-toast-body"}`}>
              <span className="min-w-0 flex-1">{toast.message}</span>
              {toast.undo && (
                <button
                  type="button"
                  onClick={async () => {
                    const undo = toast.undo;
                    dismissToast();
                    await undo?.();
                  }}
                  className="shrink-0 font-semibold underline underline-offset-4"
                >
                  Undo
                </button>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <TripMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <CheckinSheet />
      <QuickLogSheet />
    </div>
  );
}

function NavButton({ tab, active, onClick }: { tab: (typeof TABS)[number]; active: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="relative z-0 flex h-full flex-col items-center justify-center gap-0.5 text-[var(--t-muted)] transition-colors"
    >
      {active && <m.span layoutId="nav-pill" className="trip-nav-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
      <Icon size={21} weight={active ? "fill" : "regular"} />
      <span className="text-[11px] font-medium">{tab.label}</span>
    </button>
  );
}
