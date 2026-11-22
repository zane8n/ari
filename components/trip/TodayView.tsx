"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Drop, MoonStars, Sun, Waves } from "@phosphor-icons/react";
import type { ItineraryEvent, TripDay } from "@/db/schema";
import { addDays, daysBetween, formatDateRange, formatDayMonth, formatLongDay, formatWeekday, parseStartMinutes, tripPhase } from "@/lib/trip/dates";
import { pendingCheckins } from "@/lib/trip/money";
import { useTrip } from "./TripContext";
import { CheckButton, ContactLinks, Legend, PotBar, SectionTitle, Swatch } from "./ui";

export function TodayView({ onOpenMoney }: { onOpenMoney: () => void }) {
  const { bundle, today, minutesNow } = useTrip();
  const { trip, days } = bundle;
  const phase = tripPhase(trip.startDate, trip.endDate, today);

  const pending = useMemo(
    () =>
      pendingCheckins({
        dayDates: days.map((d) => d.date),
        checkedIn: new Set(bundle.checkins.map((c) => c.day)),
        today,
        minutesNow,
        checkinHour: trip.checkinHour,
      }),
    [days, bundle.checkins, today, minutesNow, trip.checkinHour],
  );

  return (
    <div className="flex flex-col gap-6">
      <CheckinNudge overdue={pending.overdue} dueToday={pending.dueToday} />
      {phase === "before" && <BeforeTrip onOpenMoney={onOpenMoney} />}
      {phase === "during" && <DayAgenda day={days.find((d) => d.date === today) ?? null} />}
      {phase === "after" && <AfterTrip />}
    </div>
  );
}

function CheckinNudge({ overdue, dueToday }: { overdue: string[]; dueToday: boolean }) {
  const { openCheckin, today } = useTrip();
  if (overdue.length === 0 && !dueToday) return null;
  const first = overdue[0];
  if (first) {
    return (
      <button type="button" onClick={() => openCheckin(first)} className="flex w-full items-center gap-3 border-l-4 border-[var(--t-coral)] bg-[var(--t-coral-soft)] px-4 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[var(--t-coral)]">
            {overdue.length === 1 ? `${formatWeekday(first)} isn't closed yet` : `${overdue.length} days aren't closed yet`}
          </span>
          <span className="block text-sm text-[var(--t-ink)]">Two minutes: tick it off, settle the costs.</span>
        </span>
        <span className="trip-btn trip-btn-ink !min-h-[40px] shrink-0">Catch up</span>
      </button>
    );
  }
  return (
    <button type="button" onClick={() => openCheckin(today)} className="flex w-full items-center gap-3 bg-[var(--t-ink)] px-4 py-4 text-left text-[var(--t-surface)]">
      <MoonStars size={28} weight="duotone" className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="font-display block text-xl leading-tight font-semibold">Evening check-in</span>
        <span className="block text-sm opacity-80">Tick off today, log the spend, see what&apos;s left.</span>
      </span>
      <span className="trip-btn !min-h-[40px] shrink-0 bg-[var(--t-surface)] text-[var(--t-ink)]">Start</span>
    </button>
  );
}

function DayFacts({ day }: { day: TripDay }) {
  const info = day.info;
  if (!info && !day.pace) return null;
  const facts: { icon: React.ReactNode; label: string }[] = [];
  if (info?.sunrise || info?.sunset) facts.push({ icon: <Sun size={14} weight="bold" />, label: [info.sunrise && `↑${info.sunrise}`, info.sunset && `↓${info.sunset}`].filter(Boolean).join("  ") });
  if (info?.lowTides?.length) facts.push({ icon: <Waves size={14} weight="bold" />, label: `Low ${info.lowTides.join(" · ")}` });
  if (info?.highTides?.length) facts.push({ icon: <Waves size={14} weight="fill" />, label: `High ${info.highTides.join(" · ")}` });
  if (info?.rainRisk) facts.push({ icon: <Drop size={14} weight="bold" />, label: `Rain: ${info.rainRisk}` });
  return (
    <div className="flex flex-col gap-2">
      <div className="trip-scroll-x -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {day.pace && <span className="trip-tag shrink-0 !bg-[var(--t-sea-soft)] !text-[var(--t-sea-strong)]">{day.pace}</span>}
        {facts.map((f) => (
          <span key={f.label} className="trip-tag shrink-0">
            {f.icon}
            {f.label}
          </span>
        ))}
      </div>
      {info?.why && <p className="text-sm text-[var(--t-muted)]">{info.why}</p>}
    </div>
  );
}

/** A single day's plan as a timeline, with "now / next" placed against the local clock. */
export function DayAgenda({ day, showHeader = true }: { day: TripDay | null; showHeader?: boolean }) {
  const { bundle, today, minutesNow, setTaskDone } = useTrip();
  if (!day) return <p className="text-[var(--t-muted)]">No plan for today.</p>;
  const index = bundle.days.findIndex((d) => d.date === day.date);
  const events = bundle.events.filter((e) => e.day === day.date).sort((a, b) => a.sortOrder - b.sortOrder);
  const isToday = day.date === today;
  const nextId = isToday
    ? events.find((e) => e.status === "planned" && (parseStartMinutes(e.timeOfDay) ?? 24 * 60) >= minutesNow - 30)?.id
    : undefined;
  const confirms = bundle.tasks.filter((t) => t.phase === "during" && t.dueDay === day.date);

  return (
    <section className="flex flex-col gap-4">
      {showHeader && (
        <header className="flex flex-col gap-2">
          <p className="trip-eyebrow">
            Day {index + 1} of {bundle.days.length} · {formatLongDay(day.date)}
          </p>
          <h1 className="font-display text-[34px] leading-[1.05] font-semibold">{day.label}</h1>
          {day.mood && <p className="font-display text-lg text-[var(--t-muted)] italic">{day.mood}</p>}
          <DayFacts day={day} />
        </header>
      )}

      <ol className="relative flex flex-col">
        {events.map((event, i) => (
          <AgendaRow key={event.id} event={event} isNext={event.id === nextId} isLast={i === events.length - 1} />
        ))}
        {events.length === 0 && <p className="text-sm text-[var(--t-muted)]">Nothing planned. Enjoy it.</p>}
      </ol>

      {confirms.length > 0 && (
        <div className="trip-card px-4 py-3">
          <p className="trip-eyebrow mb-2">Confirm for tomorrow</p>
          <ul className="flex flex-col gap-2">
            {confirms.map((task) => (
              <li key={task.id} className="flex items-start gap-3">
                <CheckButton checked={Boolean(task.doneAt)} onClick={() => setTaskDone(task, !task.doneAt)} label={task.title} />
                <span className={`pt-1 text-sm ${task.doneAt ? "text-[var(--t-muted)] line-through" : ""}`}>{task.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function AgendaRow({ event, isNext, isLast }: { event: ItineraryEvent; isNext: boolean; isLast: boolean }) {
  const { setEventStatus, money, fmt, openLog } = useTrip();
  const [expanded, setExpanded] = useState(isNext);
  const line = event.linkedBudgetItemId ? money.items.find((m) => m.item.id === event.linkedBudgetItemId) : undefined;
  const done = event.status === "done";
  const skipped = event.status === "skipped";

  return (
    <li className={`relative flex gap-3 pb-4 ${skipped ? "opacity-55" : ""}`}>
      {!isLast && <span className="absolute top-9 bottom-0 left-[15px] w-px bg-[var(--t-line-strong)]" aria-hidden />}
      <CheckButton checked={done} onClick={() => setEventStatus(event, done ? "planned" : "done")} label={`Mark ${event.title} done`} />
      <div className={`min-w-0 flex-1 ${event.isSurprise ? "trip-surprise px-3 py-2.5" : isNext ? "trip-card border-[var(--t-sea)] px-3 py-2.5" : ""}`}>
        <button type="button" onClick={() => setExpanded(!expanded)} className="block w-full text-left" aria-expanded={expanded}>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {event.timeOfDay && <span className="text-xs font-bold text-[var(--t-muted)] tabular-nums">{event.timeOfDay}</span>}
            {isNext && <span className="trip-tag !bg-[var(--t-sea)] !text-white">Next</span>}
            {event.isOptional && <span className="trip-tag">Optional</span>}
            {skipped && <span className="trip-tag !bg-[var(--t-coral-soft)] !text-[var(--t-coral)]">Skipped</span>}
          </span>
          <span className={`mt-0.5 block leading-snug font-semibold ${done ? "text-[var(--t-muted)] line-through decoration-1" : ""}`}>{event.title}</span>
        </button>
        {expanded && (
          <div className="mt-2 flex flex-col gap-2 text-sm">
            {event.description && <p className="whitespace-pre-line text-[var(--t-muted)]">{event.description}</p>}
            {event.location && <p className="text-xs font-semibold">{event.location}</p>}
            {event.phone && <ContactLinks phone={event.phone} />}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {line && line.item.status === "open" && line.item.kind === "fixed" && (
                <button type="button" onClick={() => openLog({ budgetItemId: line.item.id, day: event.day })} className="trip-btn trip-btn-ghost !min-h-[36px] !px-3 text-xs">
                  Log cost · {fmt(line.item.estimatedUsd)} planned
                </button>
              )}
              {line && line.item.status === "paid" && <span className="trip-tag !bg-[var(--t-good-soft)] !text-[var(--t-good)]">Paid {fmt(line.paidUsd)}</span>}
              {!done && (
                <button type="button" onClick={() => setEventStatus(event, skipped ? "planned" : "skipped")} className="trip-btn trip-btn-quiet !min-h-[36px] text-xs">
                  {skipped ? "Un-skip" : "Skip this"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function BeforeTrip({ onOpenMoney }: { onOpenMoney: () => void }) {
  const { bundle, today, money, fmt, setTaskDone, api } = useTrip();
  const { trip } = bundle;
  const daysToGo = daysBetween(today, trip.startDate);
  const prep = bundle.tasks.filter((t) => t.phase === "before");
  const done = prep.filter((t) => t.doneAt).length;
  const [showDone, setShowDone] = useState(false);
  const visible = showDone ? prep : prep.filter((t) => !t.doneAt);
  const firstDay = bundle.days[0] ?? null;
  const dueSoon = (dueDay: string | null) => dueDay !== null && dueDay <= addDays(today, 3);

  return (
    <>
      <header className="flex flex-col gap-1 pt-2">
        <p className="trip-eyebrow">{formatDateRange(trip.startDate, trip.endDate)}</p>
        <h1 className="font-display text-[44px] leading-none font-semibold">
          {daysToGo === 1 ? "Tomorrow." : `${daysToGo} days to go.`}
        </h1>
        <p className="text-[var(--t-muted)]">
          {trip.destination}
          {trip.homeBase ? ` · ${trip.homeBase}` : ""}
        </p>
      </header>

      <button type="button" onClick={onOpenMoney} className="trip-card flex flex-col gap-3 px-4 py-4 text-left">
        <div className="flex items-baseline justify-between gap-2">
          <p className="trip-eyebrow">The pot</p>
          <p className="text-xs font-semibold text-[var(--t-sea)]">Money →</p>
        </div>
        <p className="trip-num text-4xl leading-none">{fmt(money.potUsd)}</p>
        <PotBar money={money} />
        <Legend
          items={[
            { swatch: Swatch.spent, label: "Paid ahead", value: fmt(money.spentUsd) },
            { swatch: Swatch.expected, label: "Planned", value: fmt(money.stillExpectedUsd) },
            money.headroomUsd >= 0
              ? { swatch: Swatch.free, label: "Cushion", value: fmt(money.headroomUsd) }
              : { swatch: Swatch.over, label: "Over", value: fmt(-money.headroomUsd) },
          ]}
        />
      </button>

      {prep.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle
            eyebrow={`${done} of ${prep.length} done`}
            title="Before we go"
            action={
              done > 0 ? (
                <button type="button" onClick={() => setShowDone(!showDone)} className="trip-btn trip-btn-quiet !min-h-[36px] text-xs">
                  {showDone ? "Hide done" : "Show done"}
                </button>
              ) : undefined
            }
          />
          <div className="trip-bar !h-1.5">
            <span style={{ width: `${(done / prep.length) * 100}%`, background: "var(--t-good)" }} />
          </div>
          <ul className="trip-card divide-y divide-[var(--t-line)]">
            {visible.map((task) => (
              <li key={task.id} className="flex items-start gap-3 px-3 py-3">
                <CheckButton checked={Boolean(task.doneAt)} onClick={() => setTaskDone(task, !task.doneAt)} label={task.title} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={`text-sm leading-snug font-semibold ${task.doneAt ? "text-[var(--t-muted)] line-through" : ""}`}>{task.title}</p>
                  {task.detail && !task.doneAt && <p className="mt-0.5 text-xs text-[var(--t-muted)]">{task.detail}</p>}
                </div>
                {task.dueDay && !task.doneAt && (
                  <span className={`trip-tag shrink-0 ${dueSoon(task.dueDay) ? "!bg-[var(--t-sun-soft)] !text-[var(--t-sun)]" : ""}`}>
                    {formatDayMonth(task.dueDay)}
                  </span>
                )}
              </li>
            ))}
            {visible.length === 0 && <li className="px-3 py-3 text-sm text-[var(--t-muted)]">All done. Pack the sunscreen.</li>}
          </ul>
        </section>
      )}

      <a href={api.remindersUrl} download className="trip-card flex items-center gap-3 px-4 py-3">
        <CalendarPlus size={26} weight="duotone" className="shrink-0 text-[var(--t-sea)]" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Add nightly check-in reminders</span>
          <span className="block text-xs text-[var(--t-muted)]">
            A {String(trip.checkinHour).padStart(2, "0")}:00 nudge on every trip day, plus your dated prep. No plan details are included.
          </span>
        </span>
      </a>

      {firstDay && (
        <section className="flex flex-col gap-3">
          <SectionTitle eyebrow={`First up · ${formatWeekday(firstDay.date)} ${formatDayMonth(firstDay.date)}`} title={firstDay.label} />
          <DayAgenda day={firstDay} showHeader={false} />
        </section>
      )}
    </>
  );
}

const MOODS = ["Rough", "Meh", "Good", "Great", "Perfect"];

function AfterTrip() {
  const { bundle, money, fmt } = useTrip();
  const memories = bundle.days
    .map((d) => ({ day: d, checkin: bundle.checkins.find((c) => c.day === d.date) }))
    .filter((x) => x.checkin?.highlight || x.checkin?.mood);
  return (
    <>
      <header className="flex flex-col gap-1 pt-2">
        <p className="trip-eyebrow">{formatDateRange(bundle.trip.startDate, bundle.trip.endDate)}</p>
        <h1 className="font-display text-[40px] leading-none font-semibold">That was {bundle.trip.destination}.</h1>
      </header>
      <div className="trip-card flex flex-col gap-3 px-4 py-4">
        <p className="trip-eyebrow">Final tally</p>
        <p className="trip-num text-4xl leading-none">{fmt(money.spentUsd)}</p>
        <p className="text-sm text-[var(--t-muted)]">
          of a {fmt(money.potUsd)} pot · {money.leftUsd >= 0 ? `${fmt(money.leftUsd)} came home` : `${fmt(-money.leftUsd)} over`}
          {money.reserveSpentUsd > 0 ? ` · reserve used ${fmt(money.reserveSpentUsd)}` : " · reserve untouched"}
        </p>
        <PotBar money={money} />
      </div>
      {memories.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title="What we wrote down" />
          {memories.map(({ day, checkin }) => (
            <figure key={day.date} className="border-l-2 border-[var(--t-gilt)] pl-4">
              <figcaption className="trip-eyebrow">
                {formatWeekday(day.date)} · {day.label}
                {checkin?.mood ? ` · ${MOODS[checkin.mood - 1]}` : ""}
              </figcaption>
              {checkin?.highlight && <blockquote className="font-display mt-1 text-xl leading-snug italic">{checkin.highlight}</blockquote>}
            </figure>
          ))}
        </section>
      )}
    </>
  );
}
