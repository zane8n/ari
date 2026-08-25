import { randomBytes } from "node:crypto";
import { config } from "dotenv";

config({ path: ".env.local" });

function generatePublicId(): string {
  return randomBytes(9).toString("base64url");
}

async function main(): Promise<void> {
  const { getDb } = await import("../db/client");
  const { inviteSessions } = await import("../db/schema");
  const { getEnv } = await import("../lib/config/env");
  const { generateInviteToken, hashToken } = await import("../lib/server/invites");

  const env = getEnv();
  const token = generateInviteToken();
  const publicId = generatePublicId();

  const db = getDb();
  await db.insert(inviteSessions).values({
    publicId,
    inviteTokenHash: hashToken(token),
    status: "issued",
  });

  const url = `${env.PUBLIC_SITE_ORIGIN}/for/${token}`;
  console.log("Invite provisioned.\n");
  console.log("Recipient URL — send this privately, never in a public repo, issue tracker or chat preview:");
  console.log(`${url}\n`);
  console.log(`publicId: ${publicId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
