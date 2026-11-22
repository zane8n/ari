/**
 * Runs as the first step of every build (see "build" in package.json), so
 * a Vercel deploy brings the database up to date on its own — nobody has
 * to run anything by hand:
 *
 * 1. Applies pending migrations in a transaction. A failure rolls back and
 *    fails the build, leaving the previous deployment serving.
 * 2. Imports any trip plan held in a `TRIP_PLAN_<NAME>` project environment
 *    variable — the plan's JSON (the shape of content/trip-seed.ts), raw or
 *    base64-encoded. Real plans live only there, private to the Vercel
 *    project, never in this public repo. Import is create-only: an existing
 *    trip with that slug is left alone, so the variable can stay set and
 *    later edits made in the app are never overwritten.
 *
 * Skips cleanly when there's no DATABASE_URL (local builds, CI).
 */
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import * as schema from "../db/schema";
import { writeTripSeed } from "../lib/trip/seedWriter";
import { tripSeedSchema } from "../lib/validation/tripSeedSchema";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[build-migrate] No DATABASE_URL — skipping migrations.");
    return;
  }
  if (typeof WebSocket === "undefined") {
    throw new Error("[build-migrate] This Node version has no global WebSocket — use Node.js 22 or newer.");
  }
  const pool = new Pool({ connectionString: url });
  try {
    console.log("[build-migrate] Applying pending migrations…");
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("[build-migrate] Database is up to date.");

    for (const [name, value] of Object.entries(process.env)) {
      if (!name.startsWith("TRIP_PLAN_") || !value) continue;
      const json = value.trimStart().startsWith("{") ? value : Buffer.from(value, "base64").toString("utf8");
      const parsed = tripSeedSchema.safeParse(JSON.parse(json));
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new Error(`[build-migrate] ${name} isn't a valid trip plan (${issue?.path.join(".")}: ${issue?.message}).`);
      }
      const result = await writeTripSeed(db, parsed.data);
      console.log(
        result.status === "created"
          ? `[build-migrate] ${name}: imported trip "${result.slug}" (${result.counts.days} days, ${result.counts.events} events).`
          : `[build-migrate] ${name}: trip "${result.slug}" already exists — left untouched.`,
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
