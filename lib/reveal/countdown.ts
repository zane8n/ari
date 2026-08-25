/** Displays the destination's own calendar date — never silently shifted by the viewer's browser timezone. */
export function formatVacationDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return iso;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    date,
  );
}

export function formatVacationDateRange(startIso: string, endIso: string): string {
  return `${formatVacationDate(startIso)} – ${formatVacationDate(endIso)}`;
}

/** Real elapsed-time math (offset-aware), unlike the offset-naive display above — intentionally different. */
export function daysUntil(startIso: string, now: Date = new Date()): number {
  const diffMs = new Date(startIso).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
