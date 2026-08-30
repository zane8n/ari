"use client";

import { useState } from "react";
import type { EventStatus, ItineraryEvent, TripDay } from "@/db/schema";
import type { SerializedBudgetItem } from "@/lib/server/trip";
import { eventsApi } from "./tripApi";

const STATUS_LABELS: Record<EventStatus, string> = { planned: "Planned", done: "Done", skipped: "Skipped" };
const STATUS_COLORS: Record<EventStatus, string> = {
  planned: "bg-black/5 text-ink-muted",
  done: "bg-green-100 text-green-800",
  skipped: "bg-red-100 text-red-700",
};

function formatDay(date: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export function ItineraryTab({
  events,
  setEvents,
  budgetItems,
  money,
  onError,
  tripDays,
}: {
  events: ItineraryEvent[];
  setEvents: React.Dispatch<React.SetStateAction<ItineraryEvent[]>>;
  budgetItems: SerializedBudgetItem[];
  money: (usd: number) => string;
  onError: (err: unknown) => void;
  tripDays: TripDay[];
}) {
  async function handleUpdate(id: string, patch: Parameters<typeof eventsApi.update>[1]): Promise<void> {
    try {
      const updated = await eventsApi.update(id, patch);
      setEvents((prev) => prev.map((event) => (event.id === id ? updated : event)));
    } catch (err) {
      onError(err);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      await eventsApi.remove(id);
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      onError(err);
    }
  }

  async function handleCreate(day: string, input: Omit<Parameters<typeof eventsApi.create>[0], "day">): Promise<void> {
    try {
      const created = await eventsApi.create({ ...input, day });
      setEvents((prev) => [...prev, created]);
    } catch (err) {
      onError(err);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {tripDays.map((tripDay) => {
        const dayEvents = events.filter((e) => e.day === tripDay.date).sort((a, b) => a.sortOrder - b.sortOrder);
        const dayBudget = budgetItems.filter((b) => b.day === tripDay.date);
        const dayEstimate = dayBudget.reduce((sum, b) => sum + b.estimatedUsd, 0);
        return (
          <DaySection
            key={tripDay.date}
            day={tripDay.date}
            title={tripDay.label}
            mood={tripDay.mood}
            estimate={dayEstimate > 0 ? money(dayEstimate) : null}
            events={dayEvents}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onCreate={(input) => handleCreate(tripDay.date, input)}
            tripDays={tripDays}
          />
        );
      })}
    </div>
  );
}

function DaySection({
  day,
  title,
  mood,
  estimate,
  events,
  onUpdate,
  onDelete,
  onCreate,
  tripDays,
}: {
  day: string;
  title: string;
  mood: string | null;
  estimate: string | null;
  events: ItineraryEvent[];
  onUpdate: (id: string, patch: Parameters<typeof eventsApi.update>[1]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: (input: Omit<Parameters<typeof eventsApi.create>[0], "day">) => Promise<void>;
  tripDays: TripDay[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const doneCount = events.filter((e) => e.status === "done").length;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-lg text-ink">
            {formatDay(day)} — {title}
          </h2>
          {mood && <p className="text-xs text-ink-muted italic">{mood}</p>}
        </div>
        <div className="text-right text-xs text-ink-muted">
          {events.length > 0 && (
            <p>
              {doneCount}/{events.length} done
            </p>
          )}
          {estimate && <p>Budget: {estimate}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {events.map((event) => (
          <EventRow key={event.id} event={event} onUpdate={onUpdate} onDelete={onDelete} tripDays={tripDays} />
        ))}
      </div>

      {showAddForm ? (
        <AddEventForm
          onCancel={() => setShowAddForm(false)}
          onCreate={async (input) => {
            await onCreate(input);
            setShowAddForm(false);
          }}
        />
      ) : (
        <button type="button" onClick={() => setShowAddForm(true)} className="self-start rounded px-2 py-2 text-xs font-medium text-ink-muted underline">
          + Add activity
        </button>
      )}
    </section>
  );
}

function EventRow({
  event,
  onUpdate,
  onDelete,
  tripDays,
}: {
  event: ItineraryEvent;
  onUpdate: (id: string, patch: Parameters<typeof eventsApi.update>[1]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  tripDays: TripDay[];
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [location, setLocation] = useState(event.location ?? "");
  const [timeOfDay, setTimeOfDay] = useState(event.timeOfDay ?? "");
  const [saving, setSaving] = useState(false);

  async function handleStatus(status: EventStatus): Promise<void> {
    await onUpdate(event.id, { status: event.status === status ? "planned" : status });
  }

  async function handleReschedule(newDay: string): Promise<void> {
    if (!newDay || newDay === event.day) return;
    await onUpdate(event.id, { day: newDay });
  }

  async function handleSaveEdit(): Promise<void> {
    setSaving(true);
    try {
      await onUpdate(event.id, {
        title: title.trim() || event.title,
        description: description.trim() || null,
        location: location.trim() || null,
        timeOfDay: timeOfDay.trim() || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-lg border border-black/10 bg-white px-4 py-3 ${event.status === "skipped" ? "opacity-60" : ""}`}>
      {editing ? (
        <div className="flex flex-col gap-2">
          <input value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} placeholder="Time of day" className="rounded-md border border-black/15 px-2.5 py-2.5 text-base" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-md border border-black/15 px-2.5 py-2.5 text-base" />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details"
            rows={2}
            className="rounded-md border border-black/15 px-2.5 py-2.5 text-base"
          />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="rounded-md border border-black/15 px-2.5 py-2.5 text-base" />
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveEdit} disabled={saving} className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-md px-4 py-2.5 text-sm text-ink-muted">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {event.timeOfDay && <span className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{event.timeOfDay}</span>}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[event.status]}`}>{STATUS_LABELS[event.status]}</span>
                {event.originalDay && <span className="text-[10px] text-ink-muted italic">moved from {formatDay(event.originalDay)}</span>}
              </div>
              <p className="mt-1 font-medium text-ink">{event.title}</p>
              {event.description && <p className="mt-0.5 text-sm text-ink-muted">{event.description}</p>}
              {event.location && <p className="mt-0.5 text-xs text-ink-muted">📍 {event.location}</p>}
            </div>
            <button type="button" onClick={() => onDelete(event.id)} aria-label="Delete" className="-mr-2 -mt-1 shrink-0 p-2.5 text-ink-muted hover:text-red-600">
              ✕
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleStatus("done")}
              className={`rounded-md px-3 py-2 text-xs font-medium ${event.status === "done" ? "bg-green-600 text-white" : "bg-black/5 text-ink-muted hover:bg-black/10"}`}
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => handleStatus("skipped")}
              className={`rounded-md px-3 py-2 text-xs font-medium ${event.status === "skipped" ? "bg-red-600 text-white" : "bg-black/5 text-ink-muted hover:bg-black/10"}`}
            >
              Skipped
            </button>
            <button type="button" onClick={() => setEditing(true)} className="rounded-md px-3 py-2 text-xs font-medium text-ink-muted hover:bg-black/5">
              Edit
            </button>
            <select
              defaultValue=""
              onChange={(e) => handleReschedule(e.target.value)}
              className="rounded-md border border-black/15 px-2 py-2 text-xs text-ink-muted"
              aria-label="Reschedule to another day"
            >
              <option value="">Reschedule…</option>
              {tripDays.filter((d) => d.date !== event.day).map((d) => (
                <option key={d.date} value={d.date}>
                  {formatDay(d.date)}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}

function AddEventForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (input: Omit<Parameters<typeof eventsApi.create>[0], "day">) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        timeOfDay: timeOfDay.trim() || undefined,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white px-4 py-3">
      <div className="flex gap-2">
        <input value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} placeholder="Time" className="w-24 rounded-md border border-black/15 px-2.5 py-2.5 text-base" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the plan?" className="min-w-0 flex-1 rounded-md border border-black/15 px-2.5 py-2.5 text-base" />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details" rows={2} className="rounded-md border border-black/15 px-2.5 py-2.5 text-base" />
      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="rounded-md border border-black/15 px-2.5 py-2.5 text-base" />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          Add
        </button>
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-2.5 text-sm text-ink-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}
