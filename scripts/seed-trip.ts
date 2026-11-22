import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * `pnpm seed:trip <slug>` — developer path. Most people should use the
 * in-app import at /host/trip/import instead (no terminal needed).
 * Reads content/trips/<slug>.local.ts or .local.json.
 */
async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug || !/^[a-z0-9-]{1,40}$/.test(slug)) throw new Error("Usage: pnpm seed:trip <slug>");
  const { readFile } = await import("node:fs/promises");
  const { tripSeedSchema } = await import("../lib/validation/tripSeedSchema");
  const { seedTrip } = await import("../lib/server/seedTrip");

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(`content/trips/${slug}.local.json`, "utf8"));
  } catch {
    raw = ((await import(`../content/trips/${slug}.local`)) as { TRIP: unknown }).TRIP;
  }
  const seed = tripSeedSchema.parse(raw);
  if (seed.trip.slug !== slug) throw new Error(`The file's trip.slug is "${seed.trip.slug}", expected "${slug}".`);
  const result = await seedTrip(seed);
  console.log(result.status === "exists" ? `Trip "${slug}" already exists — nothing changed.` : `Seeded "${slug}": ${JSON.stringify(result.counts)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
