import { desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { DeleteInviteButton } from "@/components/host/DeleteInviteButton";
import { HostLoginForm } from "@/components/host/HostLoginForm";
import { experienceCopy } from "@/content/experience-copy";
import { getDb } from "@/db/client";
import { inviteSessions } from "@/db/schema";
import { decryptPayload } from "@/lib/server/crypto";
import { HOST_SESSION_COOKIE_NAME, verifyHostSessionToken } from "@/lib/server/host-auth";
import { buildSignaturePaths } from "@/lib/server/signatureSvg";
import { getTheme } from "@/lib/theme/themes";
import { sealedPayloadV1Schema, type SealedPayloadV1 } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export default async function HostPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(HOST_SESSION_COOKIE_NAME)?.value;

  if (!verifyHostSessionToken(session)) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center px-5">
        <HostLoginForm />
      </main>
    );
  }

  const db = getDb();
  const invites = await db.select().from(inviteSessions).orderBy(desc(inviteSessions.createdAt));

  return (
    <main className="mx-auto flex min-h-[100svh] max-w-2xl flex-col gap-6 px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Host view</h1>
        <a href="/host/trip" className="text-sm font-medium text-accent-strong underline">
          Trip tracker →
        </a>
      </div>
      {invites.length === 0 && <p className="text-ink-muted">No invites provisioned yet.</p>}

      {invites.map((invite) => {
        let decrypted: SealedPayloadV1 | null = null;
        if (invite.status === "sealed" && invite.encryptedPayload && invite.payloadSchemaVersion !== null) {
          try {
            decrypted = sealedPayloadV1Schema.parse(
              decryptPayload(invite.encryptedPayload, invite.publicId, invite.payloadSchemaVersion),
            );
          } catch {
            decrypted = null;
          }
        }
        const theme = decrypted ? getTheme(decrypted.themeId) : null;
        const signaturePaths =
          decrypted?.signature.kind === "drawn" ? buildSignaturePaths(decrypted.signature.points) : null;

        return (
          <section key={invite.id} className="aura-panel-solid flex flex-col gap-3 px-6 py-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs tracking-wide text-ink-muted uppercase">{invite.publicId}</p>
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}
                >
                  {invite.status}
                </span>
                <DeleteInviteButton publicId={invite.publicId} label={decrypted?.preferredName ?? invite.publicId} />
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-ink">
              <dt className="text-ink-muted">Opened</dt>
              <dd>{invite.openedAt ? invite.openedAt.toLocaleString() : "Not yet"}</dd>
              <dt className="text-ink-muted">Sealed</dt>
              <dd>{invite.sealedAt ? invite.sealedAt.toLocaleString() : "Not yet"}</dd>
              <dt className="text-ink-muted">Agreement</dt>
              <dd>{invite.agreementVersion}</dd>
            </dl>

            {decrypted && (
              <div className="mt-2 flex flex-col gap-3 border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
                <p className="text-ink">
                  <strong>Preferred name:</strong> {decrypted.preferredName}
                </p>
                <p className="text-ink">
                  <strong>Theme:</strong> {theme?.displayName}
                </p>
                <p className="text-ink">
                  <strong>Spoil modes:</strong>{" "}
                  {decrypted.spoilModes.map((id) => experienceCopy.spoilModes.options[id]).join(", ")}
                </p>
                <p className="text-ink">
                  <strong>Travel personality:</strong> {experienceCopy.travelPersona.options[decrypted.travelPersona]}
                </p>
                <p className="text-ink break-words">
                  <strong>One thing not to miss:</strong>{" "}
                  {decrypted.mustNotMiss.kind === "surprise"
                    ? experienceCopy.mustNotMiss.surpriseOption
                    : decrypted.mustNotMiss.value}
                </p>

                <div>
                  <p className="mb-1 text-sm text-ink-muted">Signature</p>
                  {decrypted.signature.kind === "typed" ? (
                    <p className="font-display text-2xl text-ink italic">{decrypted.signature.value}</p>
                  ) : signaturePaths && signaturePaths.paths.length > 0 ? (
                    <svg viewBox={signaturePaths.viewBox} className="h-24 w-full max-w-xs">
                      {signaturePaths.paths.map((d, index) => (
                        <path
                          key={index}
                          d={d}
                          fill="none"
                          stroke="var(--accent-strong)"
                          strokeWidth={1.6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ))}
                    </svg>
                  ) : (
                    <p className="text-sm text-ink-muted">No strokes recorded.</p>
                  )}
                </div>

                <a
                  href={`/api/host/invite/${invite.publicId}/card`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-ink-muted underline"
                >
                  View invitation image
                </a>
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
