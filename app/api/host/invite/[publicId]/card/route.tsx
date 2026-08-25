import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { inviteSessions } from "@/db/schema";
import { getEnv } from "@/lib/config/env";
import { decryptPayload } from "@/lib/server/crypto";
import { HOST_SESSION_COOKIE_NAME, verifyHostSessionToken } from "@/lib/server/host-auth";
import { renderInvitationCard, sanitizeFilename } from "@/lib/server/renderInvitationCard";
import { sealedPayloadV1Schema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const cookieStore = await cookies();
  if (!verifyHostSessionToken(cookieStore.get(HOST_SESSION_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { publicId } = await params;
  const db = getDb();
  const [invite] = await db.select().from(inviteSessions).where(eq(inviteSessions.publicId, publicId)).limit(1);

  if (!invite || invite.status !== "sealed" || !invite.encryptedPayload || invite.payloadSchemaVersion === null) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const decrypted = sealedPayloadV1Schema.parse(
    decryptPayload(invite.encryptedPayload, invite.publicId, invite.payloadSchemaVersion),
  );
  const env = getEnv();

  const image = await renderInvitationCard({
    preferredName: decrypted.preferredName,
    themeId: decrypted.themeId,
    destination: env.VACATION_DESTINATION,
    startIso: env.VACATION_START,
    endIso: env.VACATION_END,
    note: env.FINAL_PRIVATE_NOTE,
  });

  const buffer = await image.arrayBuffer();
  const filename = `birthday-invitation-${sanitizeFilename(decrypted.preferredName)}.png`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
