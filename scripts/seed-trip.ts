import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * `pnpm seed:trip <slug>` — loads content/trips/<slug>.local.ts and writes
 * the whole trip in one transaction. Idempotent: if a trip with that slug
 * already exists it does nothing (delete the trips row, which cascades, to reseed).
 */
async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug || !/^[a-z0-9-]{1,40}$/.test(slug)) throw new Error("Usage: pnpm seed:trip <slug>  (lowercase letters, digits, hyphens)");

  const { getDb } = await import("../db/client");
  const { budgetItems, itineraryEvents, tripDays, trips, tripTasks } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");
  const mod = (await import(`../content/trips/${slug}.local`).catch(() => {
    throw new Error(
      `content/trips/${slug}.local.ts not found. Real trip content is gitignored (this repo is public) — ` +
        "copy content/trips/example.ts to that path and fill in the real plan first.",
    );
  })) as { TRIP: import("../content/trip-seed").TripSeed };
  const seed = mod.TRIP;
  if (seed.trip.slug !== slug) throw new Error(`The file's trip.slug is "${seed.trip.slug}", expected "${slug}".`);

  const db = getDb();
  const [existing] = await db.select({ id: trips.id }).from(trips).where(eq(trips.slug, slug)).limit(1);
  if (existing) {
    console.log(`Trip "${slug}" already exists — skipping (delete its trips row to reseed; everything cascades).`);
    return;
  }

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
        seed.events.map((event, i) => {
          const linked = event.budgetKey ? lineIds.get(event.budgetKey) : undefined;
          if (event.budgetKey && !linked) throw new Error(`Event "${event.title}" points at unknown budget key "${event.budgetKey}".`);
          return {
            tripId: trip.id,
            day: event.day,
            sortOrder: i,
            timeOfDay: event.timeOfDay ?? null,
            title: event.title,
            description: event.description ?? null,
            location: event.location ?? null,
            phone: event.phone ?? null,
            linkedBudgetItemId: linked ?? null,
            isOptional: event.isOptional ?? false,
            isSurprise: event.isSurprise ?? false,
          };
        }),
      );
    }

    if (seed.tasks.length > 0) {
      await tx.insert(tripTasks).values(seed.tasks.map((task, i) => ({ tripId: trip.id, phase: task.phase, title: task.title, detail: task.detail ?? null, dueDay: task.dueDay ?? null, sortOrder: i })));
    }
  });

  console.log(`Seeded "${slug}": ${seed.days.length} days, ${seed.budget.length} budget lines, ${seed.events.length} events, ${seed.tasks.length} tasks.`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
