import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tripDays, tripTasks } from "@/db/schema";
import { getEnv } from "@/lib/config/env";
import { resolveTripRequest } from "@/lib/server/tripRoute";
import { buildIcs, zonedTimeToUtc, type ReminderEvent } from "@/lib/trip/ics";

export const dynamic = "force-dynamic";

/**
 * A downloadable calendar of nudges: one evening check-in per trip day at
 * the trip's check-in hour, plus a morning reminder for each dated task.
 * Deliberately carries no itinerary or surprise details — just the nudge
 * and a link back into the tracker.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolved = await resolveTripRequest(request, (await params).slug, "read");
  if ("response" in resolved) return resolved.response;
  const { trip } = resolved;
  const db = getDb();
  const [days, tasks] = await Promise.all([
    db.select().from(tripDays).where(eq(tripDays.tripId, trip.id)),
    db.select().from(tripTasks).where(eq(tripTasks.tripId, trip.id)),
  ]);

  const base = `${getEnv().PUBLIC_SITE_ORIGIN}/host/trip/${trip.slug}`;
  const events: ReminderEvent[] = days.map((day) => ({
    uid: `checkin-${trip.id}-${day.date}@trip-tracker`,
    start: zonedTimeToUtc(day.date, trip.checkinHour, 0, trip.timezone),
    minutes: 10,
    title: `${trip.name}: 2-minute check-in`,
    description: "Tick off today, log what was spent, see what's left.",
    url: `${base}?checkin=${day.date}`,
  }));

  const taskDays = new Map<string, string[]>();
  for (const task of tasks) {
    if (!task.dueDay || task.doneAt) continue;
    taskDays.set(task.dueDay, [...(taskDays.get(task.dueDay) ?? []), task.title]);
  }
  for (const [dueDay, titles] of taskDays) {
    events.push({
      uid: `tasks-${trip.id}-${dueDay}@trip-tracker`,
      start: zonedTimeToUtc(dueDay, 10, 0, trip.timezone),
      minutes: 15,
      title: `${trip.name}: ${titles.length === 1 ? titles[0] : `${titles.length} things to confirm`}`,
      description: titles.map((t) => `• ${t}`).join("\n"),
      url: base,
    });
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  return new NextResponse(buildIcs(`${trip.name} reminders`, events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${trip.slug}-reminders.ics"`,
    },
  });
}
