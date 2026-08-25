import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { getEnv } from "@/lib/config/env";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: Db | null = null;

/**
 * Lazily-initialised singleton using the Pool-based (WebSocket) Neon driver,
 * not neon-http — sealing needs a real session-scoped transaction with
 * SELECT ... FOR UPDATE, which neon-http's one-request-per-query model can't
 * provide.
 */
export function getDb(): Db {
  if (!cachedDb) {
    const pool = new Pool({ connectionString: getEnv().DATABASE_URL });
    cachedDb = drizzle(pool, { schema });
  }
  return cachedDb;
}
