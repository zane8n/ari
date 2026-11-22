/**
 * Runs as the first step of every build (see "build" in package.json), so
 * a Vercel deploy brings the database up to date on its own — nobody has
 * to run anything by hand. Uses the same transactional Neon driver as the
 * app: a failing migration rolls back and fails the build, which leaves the
 * previous deployment serving instead of shipping code against a half-
 * migrated database. Skips cleanly when there's no DATABASE_URL (local
 * builds, CI without a database).
 */
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[build-migrate] No DATABASE_URL — skipping migrations.");
    return;
  }
  if (typeof WebSocket === "undefined") {
    throw new Error("[build-migrate] This Node version has no global WebSocket — set the project's Node.js version to 22.x on Vercel.");
  }
  const pool = new Pool({ connectionString: url });
  try {
    console.log("[build-migrate] Applying pending migrations…");
    await migrate(drizzle(pool), { migrationsFolder: "./db/migrations" });
    console.log("[build-migrate] Database is up to date.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
