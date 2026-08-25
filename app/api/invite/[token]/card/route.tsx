import { NextResponse } from "next/server";
import { getEnv } from "@/lib/config/env";
import { decryptPayload } from "@/lib/server/crypto";
import { findInviteByToken } from "@/lib/server/invites";
import { renderInvitationCard, sanitizeFilename } from "@/lib/server/renderInvitationCard";
import { buildRevealSignature } from "@/lib/server/signatureSvg";
import { sealedPayloadV1Schema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await findInviteByToken(token);

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
    signature: buildRevealSignature(decrypted.signature),
  });

  const buffer = await image.arrayBuffer();
  const filename = `birthday-invitation-${sanitizeFilename(decrypted.preferredName)}.png`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
