import "server-only";
import { eq } from "drizzle-orm";
import type { TripSeed } from "@/content/trip-seed";
import { getDb } from "@/db/client";
import { budgetItems, itineraryEvents, tripDays, trips, tripTasks } from "@/db/schema";

export type SeedResult = { status: "created"; slug: string; counts: Record<"days" | "budget" | "events" | "tasks", number> } | { status: "exists"; slug: string };

/** Writes a whole validated trip plan in one transaction. Never overwrites: an existing slug is left untouched. */
export async function seedTrip(seed: TripSeed): Promise<SeedResult> {
  const db = getDb();
  const slug = seed.trip.slug;
  const [existing] = await db.select({ id: trips.id }).from(trips).where(eq(trips.slug, slug)).limit(1);
  if (existing) return { status: "exists", slug };

  await db.transaction(async (tx) => {
    const [trip] = await tx
      .insert(trips)
      .values({
        slug,
        name: seed.trip.name,
        destination: seed.trip.destination,
        homeBase: seed.trip.homeBase ?? null,
        startDate: seed.trip.startDate,
        endDate: seed.trip.endDate,
        potUsd: seed.trip.potUsd.toFixed(2),
        reserveUsd: seed.trip.reserveUsd.toFixed(2),
        spendCurrency: seed.trip.spendCurrency,
        timezone: seed.trip.timezone ?? "Africa/Nairobi",
        checkinHour: seed.trip.checkinHour ?? 20,
        rules: seed.trip.rules ?? [],
      })
      .returning();

    await tx.insert(tripDays).values(
      seed.days.map((day, i) => ({ tripId: trip.id, date: day.date, label: day.label, mood: day.mood ?? null, pace: day.pace ?? null, info: day.info ?? null, sortOrder: i })),
    );

    const lineIds = new Map<string, string>();
    for (const line of seed.budget) {
      const [row] = await tx
        .insert(budgetItems)
        .values({
          tripId: trip.id,
          day: line.day,
          category: line.category,
          kind: line.kind ?? "fixed",
          label: line.label,
          estimatedUsd: line.estimatedUsd.toFixed(2),
          notes: line.notes ?? null,
          cutRank: line.cutRank ?? null,
          cutNote: line.cutNote ?? null,
          cutSavingUsd: line.cutSavingUsd === undefined ? null : line.cutSavingUsd.toFixed(2),
        })
        .returning({ id: budgetItems.id });
      lineIds.set(line.key, row.id);
    }

    if (seed.events.length > 0) {
      await tx.insert(itineraryEvents).values(
        seed.events.map((event, i) => ({
          tripId: trip.id,
          day: event.day,
          sortOrder: i,
          timeOfDay: event.timeOfDay ?? null,
          title: event.title,
          description: event.description ?? null,
          location: event.location ?? null,
          phone: event.phone ?? null,
          linkedBudgetItemId: event.budgetKey ? (lineIds.get(event.budgetKey) ?? null) : null,
          isOptional: event.isOptional ?? false,
          isSurprise: event.isSurprise ?? false,
        })),
      );
    }

    if (seed.tasks.length > 0) {
      await tx.insert(tripTasks).values(seed.tasks.map((task, i) => ({ tripId: trip.id, phase: task.phase, title: task.title, detail: task.detail ?? null, dueDay: task.dueDay ?? null, sortOrder: i })));
    }
  });

  return { status: "created", slug, counts: { days: seed.days.length, budget: seed.budget.length, events: seed.events.length, tasks: seed.tasks.length } };
}
