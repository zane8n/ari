import { config } from "dotenv";

config({ path: ".env.local" });

/** Idempotent: skips seeding entirely if any budget item, event or trip day already exists. */
async function main(): Promise<void> {
  const { getDb } = await import("../db/client");
  const { budgetItems, itineraryEvents, tripDays } = await import("../db/schema");
  const { TRIP_BUDGET_SEED, TRIP_EVENTS_SEED, TRIP_DAYS_SEED } = await import("../content/arusha-trip.local").catch(() => {
    throw new Error(
      "content/arusha-trip.local.ts not found. This repo is public, so real trip content is gitignored — " +
        "copy content/arusha-trip.example.ts to content/arusha-trip.local.ts and fill in the real plan first.",
    );
  });

  const db = getDb();

  const [existingBudget] = await db.select({ id: budgetItems.id }).from(budgetItems).limit(1);
  const [existingEvents] = await db.select({ id: itineraryEvents.id }).from(itineraryEvents).limit(1);
  const [existingDays] = await db.select({ date: tripDays.date }).from(tripDays).limit(1);

  if (existingBudget || existingEvents || existingDays) {
    console.log("Trip data already seeded — skipping (delete rows manually first if you want to reseed).");
    return;
  }

  await db.insert(tripDays).values(
    TRIP_DAYS_SEED.map((day) => ({
      date: day.date,
      label: day.label,
      mood: day.mood ?? null,
      sortOrder: day.sortOrder,
    })),
  );

  await db.insert(budgetItems).values(
    TRIP_BUDGET_SEED.map((item) => ({
      category: item.category,
      label: item.label,
      day: item.day,
      estimatedUsd: item.estimatedUsd.toFixed(2),
      notes: item.notes ?? null,
    })),
  );

  await db.insert(itineraryEvents).values(
    TRIP_EVENTS_SEED.map((event) => ({
      day: event.day,
      sortOrder: event.sortOrder,
      timeOfDay: event.timeOfDay ?? null,
      title: event.title,
      description: event.description ?? null,
      location: event.location ?? null,
    })),
  );

  console.log(`Seeded ${TRIP_DAYS_SEED.length} trip days, ${TRIP_BUDGET_SEED.length} budget items and ${TRIP_EVENTS_SEED.length} itinerary events.`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
