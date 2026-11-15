import { config } from "dotenv";

config({ path: ".env.local" });

async function main(): Promise<void> {
  const seed = await import("../content/letter.local").catch(() => {
    throw new Error(
      "content/letter.local.ts not found. This repo is public, so the letter is gitignored — " +
        "copy content/letter.example.ts to content/letter.local.ts and write the real letter there first.",
    );
  });

  const { getDb } = await import("../db/client");
  const { letters } = await import("../db/schema");
  const { getEnv } = await import("../lib/config/env");
  const { generateInviteToken, hashToken } = await import("../lib/server/invites");
  const { paginateLetter } = await import("../lib/letter/paginate");

  const { unlockAt, body, signature } = seed.LETTER;
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(unlockAt) || Number.isNaN(new Date(unlockAt).getTime())) {
    throw new Error("LETTER.unlockAt must be ISO 8601 with an explicit offset, e.g. 2026-01-01T16:00:00+03:00.");
  }
  const pages = paginateLetter(body);
  if (pages.length === 0) throw new Error("LETTER.body is empty.");

  const token = generateInviteToken();
  await getDb()
    .insert(letters)
    .values({
      tokenHash: hashToken(token),
      body,
      signature: signature?.trim() || null,
      unlockAt: new Date(unlockAt),
    });

  console.log("Letter stored.\n");
  console.log(`Pages: ${pages.length} (${pages.map((page) => page.length).join(" + ")} paragraphs)`);
  console.log(`Opens: ${new Date(unlockAt).toLocaleString("en-GB", { timeZone: "Africa/Nairobi" })} (Nairobi)\n`);
  console.log("Private link — send it only to her:");
  console.log(`${getEnv().PUBLIC_SITE_ORIGIN}/letter/${token}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
