import { config } from "dotenv";

config({ path: ".env.local" });

async function main(): Promise<void> {
  const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
  const { getDb } = await import("./client");
  console.log("Running migrations against DATABASE_URL...");
  await migrate(getDb(), { migrationsFolder: "./db/migrations" });
  console.log("Migrations complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
