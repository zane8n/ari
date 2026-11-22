"use client";

import { useState } from "react";
import { PencilSimple } from "@phosphor-icons/react";
import type { ItineraryEvent } from "@/db/schema";
import { formatDayMonth, formatWeekday } from "@/lib/trip/dates";
import { DayAgenda } from "./TodayView";
import { useTrip } from "./TripContext";

export function PlanView() {
  const { bundle, today } = useTrip();
  const { days } = bundle;
  const [selected, setSelected] = useState(() => (days.some((d) => d.date === today) ? today : (days[0]?.date ?? "")));
  const [editing, setEditing] = useState(false);
  const day = days.find((d) => d.date === selected) ?? null;
  const checked = new Set(bundle.checkins.map((c) => c.day));

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Trip days" className="trip-scroll-x -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {days.map((d, i) => {
          const active = d.date === selected;
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelected(d.date)}
              aria-pressed={active}
              className={`flex min-w-[64px] shrink-0 flex-col items-center border px-2 py-2 ${
                active ? "border-[var(--t-ink)] bg-[var(--t-ink)] text-[var(--t-surface)]" : "border-[var(--t-line-strong)] bg-[var(--t-surface)]"
              }`}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">{d.date === today ? "Today" : `Day ${i + 1}`}</span>
              <span className="trip-num text-xl leading-tight">{formatWeekday(d.date)}</span>
              <span className="text-[11px] opacity-75">{formatDayMonth(d.date)}</span>
              <span className={`mt-1 h-1 w-1 rounded-full ${checked.has(d.date) ? "bg-[var(--t-good)]" : "bg-transparent"}`} aria-label={checked.has(d.date) ? "Checked in" : undefined} />
            </button>
          );
        })}
      </nav>

      {day && (
        <>
          <div className="flex justify-end">
            <button type="button" onClick={() => setEditing(!editing)} aria-pressed={editing} className="trip-chip !min-h-[36px] !text-xs">
              <PencilSimple size={14} weight="bold" />
              {editing ? "Done editing" : "Edit this day"}
            </button>
          </div>
          {editing ? <DayEditor date={day.date} /> : <DayAgenda day={day} />}
          <DayBudget date={day.date} />
        </>
      )}
    </div>
  );
}

function DayBudget({ date }: { date: string }) {
  const { money, fmt, openLog } = useTrip();
  const lines = money.items.filter((m) => m.item.day === date && !m.item.isReserve);
  if (lines.length === 0) return null;
  const total = lines.reduce((s, m) => s + m.item.estimatedUsd, 0);
  return (
    <section className="trip-card px-4 py-3">
      <div className="flex items-baseline justify-between">
        <p className="trip-eyebrow">Planned spend this day</p>
        <p className="trip-num text-lg">{fmt(total)}</p>
      </div>
      <ul className="mt-2 divide-y divide-[var(--t-line)]">
        {lines.map((m) => (
          <li key={m.item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span className={`min-w-0 truncate ${m.item.status === "dropped" ? "text-[var(--t-muted)] line-through" : ""}`}>{m.item.label}</span>
            {m.item.status === "open" ? (
              <button type="button" onClick={() => openLog({ budgetItemId: m.item.id, day: date })} className="shrink-0 font-semibold text-[var(--t-sea)] underline underline-offset-2">
                {fmt(m.item.estimatedUsd)} · log
              </button>
            ) : (
              <span className={`shrink-0 tabular-nums ${m.item.status === "paid" ? "text-[var(--t-good)]" : "text-[var(--t-muted)]"}`}>
                {m.item.status === "paid" ? `Paid ${fmt(m.paidUsd)}` : "Dropped"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
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
        <button type="button" onClick={() => setAdding(true)} className="trip-btn trip-btn-ghost w-full border-dashed">
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
    <div className="trip-card px-3 py-3">
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
            <button type="button" onClick={() => removeEvent(event.id)} className="trip-btn !min-h-[36px] !px-3 bg-[var(--t-coral)] text-xs text-white">
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
      className="trip-card flex flex-col gap-2 border-[var(--t-sea)] px-3 py-3"
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
