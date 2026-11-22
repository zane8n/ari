/** Timezone-safe date helpers for the trip tracker. All trip dates are plain `YYYY-MM-DD` strings in the trip's own timezone. */

export function todayInZone(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Minutes since local midnight in the given zone. */
export function minutesInZone(timeZone: string, now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export type TripPhase = "before" | "during" | "after";

export function tripPhase(startDate: string, endDate: string, today: string): TripPhase {
  if (today < startDate) return "before";
  if (today > endDate) return "after";
  return "during";
}

/** Reads the first `HH:MM` in a free-form time label ("16:30–18:21", "09:00") as minutes since midnight. */
export function parseStartMinutes(timeOfDay: string | null | undefined): number | null {
  if (!timeOfDay) return null;
  const match = /(\d{1,2}):(\d{2})/.exec(timeOfDay);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

const weekdayShort = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export function formatWeekday(date: string): string {
  return weekdayShort.format(new Date(`${date}T00:00:00Z`));
}

export function formatDayMonth(date: string): string {
  return dayMonth.format(new Date(`${date}T00:00:00Z`));
}

export function formatLongDay(date: string): string {
  return longDay.format(new Date(`${date}T00:00:00Z`));
}

export function formatDateRange(start: string, end: string): string {
  const year = end.slice(0, 4);
  return `${formatDayMonth(start)} – ${formatDayMonth(end)} ${year}`;
}
