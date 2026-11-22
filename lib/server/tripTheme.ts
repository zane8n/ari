import "server-only";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { inviteSessions } from "@/db/schema";
import { decryptPayload } from "@/lib/server/crypto";
import type { ThemeId } from "@/lib/theme/themes";
import { GUEST_DEFAULT_THEME, HOST_DEFAULT_THEME, resolveTripTheme, TRIP_THEME_COOKIE } from "@/lib/trip/theme";
import { sealedPayloadV1Schema } from "@/lib/validation/schemas";

/** The colour she chose in the sealed invitation, if there is one — the guest's starting palette. */
async function invitationThemeId(): Promise<ThemeId | null> {
  try {
    const [invite] = await getDb().select().from(inviteSessions).where(eq(inviteSessions.status, "sealed")).orderBy(desc(inviteSessions.sealedAt)).limit(1);
    if (!invite?.encryptedPayload || invite.payloadSchemaVersion === null) return null;
    return sealedPayloadV1Schema.parse(decryptPayload(invite.encryptedPayload, invite.publicId, invite.payloadSchemaVersion)).themeId;
  } catch {
    return null;
  }
}

/** This device's saved palette, else a sensible default for who's looking. */
export async function resolveDeviceTheme(access: "host" | "guest"): Promise<{ themeId: ThemeId; chosen: boolean }> {
  const saved = (await cookies()).get(TRIP_THEME_COOKIE)?.value;
  if (saved) return { themeId: resolveTripTheme(saved, HOST_DEFAULT_THEME), chosen: true };
  if (access === "host") return { themeId: HOST_DEFAULT_THEME, chosen: false };
  return { themeId: (await invitationThemeId()) ?? GUEST_DEFAULT_THEME, chosen: false };
}

export { invitationThemeId };
