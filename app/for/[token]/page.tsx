import { notFound } from "next/navigation";
import { ExperienceShell } from "@/components/experience/ExperienceShell";
import { getEnv } from "@/lib/config/env";
import { decryptPayload } from "@/lib/server/crypto";
import { findInviteByToken } from "@/lib/server/invites";
import { createInitialState, type ExperienceState } from "@/lib/experience/types";
import type { RevealData } from "@/lib/reveal/types";
import { sealedPayloadV1Schema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

function buildRevealData(): RevealData {
  const env = getEnv();
  return {
    destination: env.VACATION_DESTINATION,
    startIso: env.VACATION_START,
    endIso: env.VACATION_END,
    note: env.FINAL_PRIVATE_NOTE,
  };
}

export default async function InvitePage({ params }: PageProps<"/for/[token]">) {
  const { token } = await params;
  const invite = await findInviteByToken(token);

  if (!invite || invite.status === "revoked") {
    notFound();
  }

  if (invite.status === "sealed") {
    if (!invite.encryptedPayload || invite.payloadSchemaVersion === null) {
      notFound();
    }
    const decrypted = sealedPayloadV1Schema.parse(
      decryptPayload(invite.encryptedPayload, invite.publicId, invite.payloadSchemaVersion),
    );

    const initialState: ExperienceState = {
      ...createInitialState(invite.publicId),
      stage: "reveal",
      preferredName: decrypted.preferredName,
      themeId: decrypted.themeId,
      sealedAt: (invite.sealedAt ?? new Date()).toISOString(),
    };

    return <ExperienceShell token={token} initialState={initialState} initialReveal={buildRevealData()} />;
  }

  const initialState = createInitialState(invite.publicId);
  return <ExperienceShell token={token} initialState={initialState} initialReveal={null} />;
}
