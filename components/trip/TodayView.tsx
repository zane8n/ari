"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarPlus, Drop, MoonStars, SunHorizon, Waves } from "@phosphor-icons/react";
import type { ItineraryEvent, TripDay } from "@/db/schema";
import { AnimatePresence, m } from "@/lib/motion/m";
import { daysBetween, formatDateRange, formatDayMonth, formatLongDay, formatWeekday, parseStartMinutes, tripPhase } from "@/lib/trip/dates";
import { pendingCheckins } from "@/lib/trip/money";
import { useTrip } from "./TripContext";
import { CheckButton, ContactLinks, CountUp, ease, PotBar, PotRing, Reveal, Rise } from "./ui";

export function TodayView({ onOpenMoney, onOpenPlan }: { onOpenMoney: () => void; onOpenPlan: () => void }) {
  const { bundle, today } = useTrip();
  const phase = tripPhase(bundle.trip.startDate, bundle.trip.endDate, today);
  if (phase === "before") return <BeforeTrip onOpenMoney={onOpenMoney} onOpenPlan={onOpenPlan} />;
  if (phase === "after") return <AfterTrip />;
  return <DuringTrip onOpenMoney={onOpenMoney} />;
}

/* ───────────────────────── Before the trip ───────────────────────── */

function BeforeTrip({ onOpenMoney, onOpenPlan }: { onOpenMoney: () => void; onOpenPlan: () => void }) {
  const { bundle, today, api } = useTrip();
  const { trip } = bundle;
  const daysToGo = daysBetween(today, trip.startDate);
  const firstDay = bundle.days[0];

  return (
    <div className="flex flex-col gap-8 pt-6">
      <Rise className="text-center">
        <p className="trip-eyebrow">{formatDateRange(trip.startDate, trip.endDate)}</p>
        <p className="trip-num mt-3 text-[96px] leading-[0.85] text-[var(--t-sea)]">{daysToGo}</p>
        <p className="font-display mt-2 text-2xl">
          {daysToGo === 1 ? "day until" : "days until"} {trip.destination}
        </p>
        {trip.homeBase && <p className="mt-1 text-sm text-[var(--t-muted)]">{trip.homeBase}</p>}
      </Rise>

      <Rise delay={0.08}>
        <PrepCard />
      </Rise>

      <Rise delay={0.16}>
        <MoneyGlance onOpen={onOpenMoney} />
      </Rise>

      <Rise delay={0.22} className="flex flex-col gap-1">
        {firstDay && (
          <button type="button" onClick={onOpenPlan} className="trip-soft flex items-center gap-3 px-5 py-4 text-left">
            <SunHorizon size={22} className="shrink-0 text-[var(--t-sea)]" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-[var(--t-muted)]">
                Day one · {formatWeekday(firstDay.date)} {formatDayMonth(firstDay.date)}
              </span>
              <span className="block truncate font-medium">{firstDay.label}</span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-[var(--t-muted)]" />
          </button>
        )}
        <a href={api.remindersUrl} download className="flex items-center gap-3 px-5 py-4 text-sm text-[var(--t-muted)]">
          <CalendarPlus size={20} className="shrink-0" />
          <span>Add a gentle {String(trip.checkinHour).padStart(2, "0")}:00 reminder to your calendar</span>
        </a>
      </Rise>
    </div>
  );
}

/** One task in focus; the rest wait behind a fold. */
function PrepCard() {
  const { bundle, setTaskDone } = useTrip();
  const prep = useMemo(
    () => bundle.tasks.filter((t) => t.phase === "before").sort((a, b) => (a.dueDay ?? "9999").localeCompare(b.dueDay ?? "9999") || a.sortOrder - b.sortOrder),
    [bundle.tasks],
  );
  if (prep.length === 0) return null;
  const open = prep.filter((t) => !t.doneAt);
  const done = prep.length - open.length;
  const next = open[0];

  return (
    <section className="trip-card p-6">
      <div className="flex items-center justify-between">
        <p className="trip-eyebrow">Before we go</p>
        <p className="text-xs text-[var(--t-muted)]">
          {done} of {prep.length}
        </p>
      </div>
      <div className="trip-bar mt-3 !h-1.5">
        <m.span initial={{ width: 0 }} animate={{ width: `${(done / prep.length) * 100}%` }} transition={{ duration: 0.7, ease }} style={{ background: "var(--t-sea)" }} />
      </div>

      <AnimatePresence mode="wait">
        {next ? (
          <m.div key={next.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease }} className="mt-6">
            <p className="font-display text-[26px] leading-snug font-medium">{next.title}</p>
            {next.detail && <p className="mt-2 text-sm leading-relaxed text-[var(--t-muted)]">{next.detail}</p>}
            <div className="mt-5 flex items-center gap-3">
              <button type="button" onClick={() => setTaskDone(next, true)} className="trip-btn trip-btn-primary">
                Done
              </button>
              {next.dueDay && <span className="text-sm text-[var(--t-muted)]">by {formatDayMonth(next.dueDay)}</span>}
            </div>
          </m.div>
        ) : (
          <m.p key="all-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display mt-6 text-2xl">
            All set. Pack the sunscreen.
          </m.p>
        )}
      </AnimatePresence>

      {prep.length > 1 && (
        <Reveal label={open.length > 1 ? `${open.length - 1} more to do` : "See the whole list"} className="mt-4 border-t border-[var(--t-line)] pt-2">
          <ul className="flex flex-col">
            {prep
              .filter((t) => t.id !== next?.id)
              .map((task) => (
                <li key={task.id} className="flex items-center gap-3 py-2.5">
                  <CheckButton checked={Boolean(task.doneAt)} onClick={() => setTaskDone(task, !task.doneAt)} label={task.title} />
                  <span className={`min-w-0 flex-1 text-sm ${task.doneAt ? "text-[var(--t-muted)] line-through" : ""}`}>{task.title}</span>
                  {task.dueDay && !task.doneAt && <span className="shrink-0 text-xs text-[var(--t-muted)]">{formatDayMonth(task.dueDay)}</span>}
                </li>
              ))}
          </ul>
        </Reveal>
      )}
    </section>
  );
}

/** The one money line worth seeing at a glance. */
function MoneyGlance({ onOpen }: { onOpen: () => void }) {
  const { money, fmt } = useTrip();
  const over = money.headroomUsd < 0;
  return (
    <button type="button" onClick={onOpen} className="trip-card flex w-full flex-col gap-4 p-6 text-left">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="trip-eyebrow">Left in our pot</p>
          <p className="trip-num mt-1 text-[38px] leading-none">
            <CountUp value={money.leftUsd} format={fmt} />
          </p>
        </div>
        <ArrowRight size={18} className="mb-1 text-[var(--t-muted)]" />
      </div>
      <PotBar money={money} />
      <p className={`text-sm ${over ? "text-[var(--t-coral)]" : "text-[var(--t-muted)]"}`}>
        {over ? `The plan runs ${fmt(-money.headroomUsd)} over — have a look` : `${fmt(money.headroomUsd)} free · about ${fmt(money.extrasPerDayUsd)} a day for treats`}
      </p>
    </button>
  );
}

/* ───────────────────────── During the trip ───────────────────────── */

function DuringTrip({ onOpenMoney }: { onOpenMoney: () => void }) {
  const { bundle, today, minutesNow, setTaskDone } = useTrip();
  const day = bundle.days.find((d) => d.date === today);
  const pending = useMemo(
    () =>
      pendingCheckins({
        dayDates: bundle.days.map((d) => d.date),
        checkedIn: new Set(bundle.checkins.map((c) => c.day)),
        today,
        minutesNow,
        checkinHour: bundle.trip.checkinHour,
      }),
    [bundle.days, bundle.checkins, today, minutesNow, bundle.trip.checkinHour],
  );
  if (!day) return null;
  const confirms = bundle.tasks.filter((t) => t.phase === "during" && t.dueDay === day.date);
  const openConfirms = confirms.filter((t) => !t.doneAt).length;

  return (
    <div className="flex flex-col gap-7 pt-4">
      <CheckinNudge overdue={pending.overdue} dueToday={pending.dueToday} />

      <Rise>
        <p className="trip-eyebrow">{formatLongDay(day.date)}</p>
        <h1 className="font-display mt-1 text-[40px] leading-[1.05] font-medium">{day.label}</h1>
        {day.mood && <p className="font-display mt-2 text-lg text-[var(--t-muted)] italic">{day.mood}</p>}
        <DayFacts day={day} />
      </Rise>

      <Rise delay={0.08}>
        <NowCard day={day} />
      </Rise>

      <Rise delay={0.14}>
        <DayTimeline day={day} compact />
      </Rise>

      <Rise delay={0.2}>
        <MoneyGlance onOpen={onOpenMoney} />
      </Rise>

      {confirms.length > 0 && (
        <Rise delay={0.26}>
          <Reveal label={openConfirms > 0 ? `${openConfirms} ${openConfirms === 1 ? "thing" : "things"} to confirm for tomorrow` : "Tomorrow is confirmed ✓"} className="trip-soft px-5">
            <ul className="flex flex-col pb-3">
              {confirms.map((task) => (
                <li key={task.id} className="flex items-center gap-3 py-2">
                  <CheckButton checked={Boolean(task.doneAt)} onClick={() => setTaskDone(task, !task.doneAt)} label={task.title} />
                  <span className={`text-sm ${task.doneAt ? "text-[var(--t-muted)] line-through" : ""}`}>{task.title}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </Rise>
      )}
    </div>
  );
}

function CheckinNudge({ overdue, dueToday }: { overdue: string[]; dueToday: boolean }) {
  const { openCheckin, today } = useTrip();
  const day = overdue[0] ?? (dueToday ? today : null);
  if (!day) return null;
  const late = overdue.length > 0;
  return (
    <Rise>
      <button type="button" onClick={() => openCheckin(day)} className="trip-pass-card flex w-full items-center gap-4 p-6 text-left">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/70 text-[var(--t-sea)]">
          <MoonStars size={24} weight="duotone" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display block text-[22px] leading-tight font-medium">
            {late ? (overdue.length === 1 ? `Close ${formatWeekday(day)}` : `${overdue.length} days to close`) : "Close the day"}
          </span>
          <span className="block text-sm text-[var(--t-muted)]">Two minutes, together.</span>
        </span>
        <ArrowRight size={20} className="shrink-0 text-[var(--t-sea)]" />
      </button>
    </Rise>
  );
}

function DayFacts({ day }: { day: TripDay }) {
  const info = day.info;
  const facts: { icon: React.ReactNode; label: string }[] = [];
  if (info?.sunset) facts.push({ icon: <SunHorizon size={14} />, label: `Sunset ${info.sunset}` });
  if (info?.lowTides?.length) facts.push({ icon: <Waves size={14} />, label: `Low tide ${info.lowTides[0]}` });
  if (info?.rainRisk) facts.push({ icon: <Drop size={14} />, label: `${info.rainRisk} rain` });
  if (facts.length === 0 && !day.pace) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {day.pace && <span className="trip-tag !text-[var(--t-sea-strong)]">{day.pace}</span>}
      {facts.map((f) => (
        <span key={f.label} className="trip-tag">
          {f.icon}
          {f.label}
        </span>
      ))}
    </div>
  );
}

/** What's next, large — the one thing to look at right now. */
function NowCard({ day }: { day: TripDay }) {
  const { bundle, minutesNow, money, fmt, setEventStatus, openLog } = useTrip();
  const events = bundle.events.filter((e) => e.day === day.date).sort((a, b) => a.sortOrder - b.sortOrder);
  const next = events.find((e) => e.status === "planned" && (parseStartMinutes(e.timeOfDay) ?? 24 * 60) >= minutesNow - 45) ?? events.find((e) => e.status === "planned");

  if (!next) {
    return (
      <div className="trip-card p-6 text-center">
        <p className="font-display text-2xl">That&apos;s everything for today.</p>
        <p className="mt-1 text-sm text-[var(--t-muted)]">Enjoy the evening.</p>
      </div>
    );
  }
  const line = next.linkedBudgetItemId ? money.items.find((x) => x.item.id === next.linkedBudgetItemId) : undefined;
  const unpaid = line && line.item.kind === "fixed" && line.item.status === "open";

  return (
    <AnimatePresence mode="wait">
      <m.section
        key={next.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease }}
        className={`${next.isSurprise ? "trip-surprise" : "trip-card"} p-6`}
      >
        <p className="trip-eyebrow !text-[var(--t-sea-strong)]">Up next{next.timeOfDay ? ` · ${next.timeOfDay}` : ""}</p>
        <h2 className="font-display mt-2 text-[30px] leading-tight font-medium">{next.title}</h2>
        {next.description && <p className="mt-3 text-[15px] leading-relaxed text-[var(--t-muted)]">{next.description}</p>}
        {next.location && <p className="mt-3 text-sm font-medium">{next.location}</p>}
        {next.phone && (
          <div className="mt-4">
            <ContactLinks phone={next.phone} />
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setEventStatus(next, "done")} className="trip-btn trip-btn-primary">
            We did it
          </button>
          {unpaid && (
            <button type="button" onClick={() => openLog({ budgetItemId: line.item.id, day: next.day })} className="trip-btn trip-btn-ghost">
              Log · {fmt(line.item.estimatedUsd)}
            </button>
          )}
          <button type="button" onClick={() => setEventStatus(next, "skipped")} className="trip-btn trip-btn-quiet">
            Skip
          </button>
        </div>
      </m.section>
    </AnimatePresence>
  );
}

/** The day as a calm list. Tap a row for its details. In compact mode the "up next" item is left to NowCard. */
export function DayTimeline({ day, compact = false }: { day: TripDay; compact?: boolean }) {
  const { bundle } = useTrip();
  const events = bundle.events.filter((e) => e.day === day.date).sort((a, b) => a.sortOrder - b.sortOrder);
  const done = events.filter((e) => e.status !== "planned");
  const planned = events.filter((e) => e.status === "planned");
  if (events.length === 0) return <p className="py-6 text-center text-[var(--t-muted)]">Nothing planned. Enjoy it.</p>;
  const rows = compact ? planned.slice(1) : events;

  return (
    <div className="flex flex-col gap-2">
      {compact && rows.length > 0 && <p className="trip-eyebrow mb-1">Later</p>}
      <ul className="flex flex-col gap-2">
        {rows.map((event) => (
          <TimelineRow key={event.id} event={event} />
        ))}
      </ul>
      {compact && done.length > 0 && (
        <Reveal label={`${done.length} done earlier`}>
          <ul className="flex flex-col gap-2">
            {done.map((event) => (
              <TimelineRow key={event.id} event={event} />
            ))}
          </ul>
        </Reveal>
      )}
    </div>
  );
}

function TimelineRow({ event }: { event: ItineraryEvent }) {
  const { setEventStatus, money, fmt, openLog } = useTrip();
  const [open, setOpen] = useState(false);
  const done = event.status === "done";
  const skipped = event.status === "skipped";
  const line = event.linkedBudgetItemId ? money.items.find((x) => x.item.id === event.linkedBudgetItemId) : undefined;

  return (
    <m.li layout transition={{ duration: 0.3, ease }} className={`${event.isSurprise ? "trip-surprise" : "trip-soft"} ${skipped ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <CheckButton checked={done} onClick={() => setEventStatus(event, done ? "planned" : "done")} label={`${event.title} done`} />
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-[32px] min-w-0 flex-1 items-baseline gap-3 text-left">
          <span className="w-[68px] shrink-0 text-xs leading-tight text-[var(--t-muted)] tabular-nums">{shortTime(event.timeOfDay)}</span>
          <span className={`min-w-0 flex-1 truncate font-medium ${done ? "text-[var(--t-muted)] line-through decoration-1" : ""}`}>{event.title}</span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
            <div className="flex flex-col gap-3 px-4 pb-4 pl-[58px] text-sm">
              {event.timeOfDay && <p className="text-xs text-[var(--t-muted)]">{event.timeOfDay}</p>}
              {event.description && <p className="leading-relaxed text-[var(--t-muted)]">{event.description}</p>}
              {event.location && <p className="font-medium">{event.location}</p>}
              {event.phone && <ContactLinks phone={event.phone} />}
              <div className="flex flex-wrap gap-2">
                {line && line.item.kind === "fixed" && line.item.status === "open" && (
                  <button type="button" onClick={() => openLog({ budgetItemId: line.item.id, day: event.day })} className="trip-chip !min-h-[38px] !text-[13px]">
                    Log cost · {fmt(line.item.estimatedUsd)}
                  </button>
                )}
                {line?.item.status === "paid" && <span className="trip-tag !text-[var(--t-good)]">Paid {fmt(line.paidUsd)}</span>}
                {!done && (
                  <button type="button" onClick={() => setEventStatus(event, skipped ? "planned" : "skipped")} className="trip-chip !min-h-[38px] !text-[13px]">
                    {skipped ? "Bring it back" : "Skip this"}
                  </button>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.li>
  );
}

/** "16:30–18:21" → "16:30"; word labels ("Late afternoon") stay as they are. */
function shortTime(timeOfDay: string | null): string {
  if (!timeOfDay) return "";
  const clock = /\d{1,2}:\d{2}/.exec(timeOfDay);
  return clock ? clock[0] : timeOfDay;
}

/* ───────────────────────── After the trip ───────────────────────── */

const MOODS = ["Rough", "Meh", "Good", "Great", "Perfect"];

function AfterTrip() {
  const { bundle, money, fmt } = useTrip();
  const memories = bundle.days.map((d) => ({ day: d, checkin: bundle.checkins.find((c) => c.day === d.date) })).filter((x) => x.checkin?.highlight);
  return (
    <div className="flex flex-col gap-10 pt-6">
      <Rise className="text-center">
        <p className="trip-eyebrow">{formatDateRange(bundle.trip.startDate, bundle.trip.endDate)}</p>
        <h1 className="font-display mt-2 text-[40px] leading-tight font-medium">That was {bundle.trip.destination}.</h1>
      </Rise>
      <Rise delay={0.08}>
        <PotRing money={money}>
          <p className="trip-eyebrow">We spent</p>
          <p className="trip-num text-4xl">{fmt(money.spentUsd)}</p>
          <p className="text-xs text-[var(--t-muted)]">of {fmt(money.potUsd)}</p>
        </PotRing>
      </Rise>
      {memories.length > 0 && (
        <div className="flex flex-col gap-6">
          {memories.map(({ day, checkin }, i) => (
            <Rise key={day.date} delay={0.12 + i * 0.06}>
              <figure className="text-center">
                <blockquote className="font-display text-2xl leading-snug italic">“{checkin?.highlight}”</blockquote>
                <figcaption className="mt-2 text-xs text-[var(--t-muted)]">
                  {formatWeekday(day.date)} · {day.label}
                  {checkin?.mood ? ` · ${MOODS[checkin.mood - 1]}` : ""}
                </figcaption>
              </figure>
            </Rise>
          ))}
        </div>
      )}
    </div>
  );
}
