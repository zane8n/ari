import { randomBytes } from "node:crypto";
import { getDb } from "@/db/client";
import { inviteSessions } from "@/db/schema";
import { generateInviteToken, hashToken } from "@/lib/server/invites";

/** Provisions a fresh, real invite row for one e2e test — mirrors scripts/provision-invite.ts. */
export async function provisionTestInvite(): Promise<{ token: string; publicId: string }> {
  const token = generateInviteToken();
  const publicId = `e2e-${randomBytes(6).toString("base64url")}`;

  await getDb()
    .insert(inviteSessions)
    .values({ publicId, inviteTokenHash: hashToken(token), status: "issued" });

  return { token, publicId };
}
