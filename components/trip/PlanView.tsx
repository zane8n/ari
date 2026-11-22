"use client";

import { useEffect, useRef, useState } from "react";
import { PencilSimple } from "@phosphor-icons/react";
import type { ItineraryEvent } from "@/db/schema";
import { AnimatePresence, m } from "@/lib/motion/m";
import { formatDayMonth, formatWeekday } from "@/lib/trip/dates";
import { DayTimeline } from "./TodayView";
import { useTrip } from "./TripContext";
import { ease, Reveal } from "./ui";

/** A swipeable strip of day cards; the chosen day unfolds below as a calm list. */
export function PlanView() {
  const { bundle, today } = useTrip();
  const { days } = bundle;
  const [selected, setSelected] = useState(() => (days.some((d) => d.date === today) ? today : (days[0]?.date ?? "")));
  const [editing, setEditing] = useState(false);
  const day = days.find((d) => d.date === selected) ?? null;
  const checked = new Set(bundle.checkins.map((c) => c.day));
  const strip = useRef<HTMLDivElement>(null);

  // Keep the chosen card in view when arriving on the tab.
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (el && strip.current) strip.current.scrollLeft = Math.max(0, el.offsetLeft - 24);
  }, []);

  return (
    <div className="flex flex-col gap-7 pt-4">
      <div ref={strip} role="tablist" aria-label="Trip days" className="trip-scroll-x -mx-6 flex scroll-px-6 gap-3 overflow-x-auto px-6 pt-2 pb-4">
        {days.map((d, i) => {
          const active = d.date === selected;
          const count = bundle.events.filter((e) => e.day === d.date).length;
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setSelected(d.date);
                setEditing(false);
              }}
              className={`relative flex w-[128px] shrink-0 flex-col items-start gap-1 p-4 text-left transition-[transform,box-shadow] duration-500 ${
                active ? "trip-card -translate-y-0.5" : "trip-soft"
              }`}
              style={active ? { boxShadow: "var(--t-shadow), inset 0 2px 0 var(--t-sea)" } : undefined}
            >
              <span className="text-xs text-[var(--t-muted)]">{d.date === today ? "Today" : `Day ${i + 1}`}</span>
              <span className="trip-num text-[30px] leading-none">{formatWeekday(d.date)}</span>
              <span className="text-xs text-[var(--t-muted)]">{formatDayMonth(d.date)}</span>
              <span className="mt-2 line-clamp-2 text-[13px] leading-snug font-medium">{d.label}</span>
              <span className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--t-muted)]">
                {count} {count === 1 ? "plan" : "plans"}
                {checked.has(d.date) && <span className="h-1.5 w-1.5 rounded-full bg-[var(--t-good)]" aria-label="closed" />}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {day && (
          <m.div key={day.date + (editing ? "-edit" : "")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }} className="flex flex-col gap-6">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-[32px] leading-tight font-medium italic">{day.label}</h2>
                {day.mood && <p className="font-display mt-1 text-[17px] text-[var(--t-muted)] italic">{day.mood}</p>}
              </div>
              <button type="button" onClick={() => setEditing(!editing)} aria-pressed={editing} className="trip-chip !min-h-[38px] shrink-0 !text-[13px]">
                <PencilSimple size={14} />
                {editing ? "Done" : "Edit"}
              </button>
            </div>
            {editing ? <DayEditor date={day.date} /> : <DayTimeline day={day} />}
            {!editing && <DayBudget date={day.date} />}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DayBudget({ date }: { date: string }) {
  const { money, fmt, openLog } = useTrip();
  const lines = money.items.filter((x) => x.item.day === date && !x.item.isReserve);
  if (lines.length === 0) return null;
  const total = lines.reduce((s, x) => s + x.item.estimatedUsd, 0);
  return (
    <Reveal label={`Planned spend · ${fmt(total)}`} className="trip-soft px-5">
      <ul className="flex flex-col pb-3">
        {lines.map((x) => (
          <li key={x.item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className={`min-w-0 truncate ${x.item.status === "dropped" ? "text-[var(--t-muted)] line-through" : ""}`}>{x.item.label}</span>
            {x.item.status === "open" ? (
              <button type="button" onClick={() => openLog({ budgetItemId: x.item.id, day: date })} className="trip-chip !min-h-[34px] shrink-0 !px-3 !text-[13px]">
                {fmt(x.item.estimatedUsd)}
              </button>
            ) : (
              <span className={`shrink-0 tabular-nums ${x.item.status === "paid" ? "text-[var(--t-good)]" : "text-[var(--t-muted)]"}`}>
                {x.item.status === "paid" ? `Paid ${fmt(x.paidUsd)}` : "Freed"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

function DayEditor({ date }: { date: string }) {
  const { bundle, addEvent } = useTrip();
  const events = bundle.events.filter((e) => e.day === date).sort((a, b) => a.sortOrder - b.sortOrder);
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {events.map((event) => (
        <EditableEvent key={event.id} event={event} />
      ))}
      {adding ? (
        <EventForm
          submitLabel="Add"
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            await addEvent({
              day: date,
              title: values.title,
              timeOfDay: values.timeOfDay || undefined,
              description: values.description || undefined,
              location: values.location || undefined,
            });
            setAdding(false);
          }}
        />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="trip-btn trip-btn-ghost w-full">
          + Add an activity
        </button>
      )}
    </div>
  );
}

type EventValues = { title: string; timeOfDay: string; description: string; location: string };

function EditableEvent({ event }: { event: ItineraryEvent }) {
  const { bundle, updateEvent, removeEvent } = useTrip();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return (
      <EventForm
        initial={{ title: event.title, timeOfDay: event.timeOfDay ?? "", description: event.description ?? "", location: event.location ?? "" }}
        submitLabel="Save"
        onCancel={() => setEditing(false)}
        onSubmit={async (values) => {
          await updateEvent(event.id, {
            title: values.title,
            timeOfDay: values.timeOfDay || null,
            description: values.description || null,
            location: values.location || null,
          });
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="trip-soft px-4 py-4">
      <p className="text-xs font-bold text-[var(--t-muted)]">{event.timeOfDay}</p>
      <p className="font-semibold">{event.title}</p>
      {event.originalDay && <p className="text-[11px] text-[var(--t-muted)] italic">moved from {formatWeekday(event.originalDay)} {formatDayMonth(event.originalDay)}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setEditing(true)} className="trip-btn trip-btn-ghost !min-h-[36px] !px-3 text-xs">
          Edit
        </button>
        <select
          value=""
          onChange={(e) => e.target.value && updateEvent(event.id, { day: e.target.value })}
          aria-label="Move to another day"
          className="trip-input !min-h-[36px] !w-auto !text-xs"
        >
          <option value="">Move to…</option>
          {bundle.days
            .filter((d) => d.date !== event.day)
            .map((d) => (
              <option key={d.date} value={d.date}>
                {formatWeekday(d.date)} {formatDayMonth(d.date)}
              </option>
            ))}
        </select>
        {confirmDelete ? (
          <>
            <button type="button" onClick={() => removeEvent(event.id)} className="trip-btn !min-h-[36px] !px-3 trip-btn-warn text-xs">
              Delete it
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="trip-btn trip-btn-quiet !min-h-[36px] text-xs">
              Keep
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="trip-btn trip-btn-quiet !min-h-[36px] text-xs">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function EventForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: EventValues;
  submitLabel: string;
  onSubmit: (values: EventValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<EventValues>(initial ?? { title: "", timeOfDay: "", description: "", location: "" });
  const [saving, setSaving] = useState(false);
  const set = (key: keyof EventValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!values.title.trim()) return;
        setSaving(true);
        await onSubmit({ ...values, title: values.title.trim() });
        setSaving(false);
      }}
      className="trip-card flex flex-col gap-3 p-5"
    >
      <div className="flex gap-2">
        <input value={values.timeOfDay} onChange={set("timeOfDay")} placeholder="17:30" aria-label="Time" className="trip-input !w-24" />
        <input value={values.title} onChange={set("title")} placeholder="What's the plan?" aria-label="Title" className="trip-input" autoFocus />
      </div>
      <textarea value={values.description} onChange={set("description")} placeholder="Details" aria-label="Details" rows={2} className="trip-input" />
      <input value={values.location} onChange={set("location")} placeholder="Where" aria-label="Location" className="trip-input" />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="trip-btn trip-btn-primary">
          {saving ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="trip-btn trip-btn-quiet">
          Cancel
        </button>
      </div>
    </form>
  );
}
