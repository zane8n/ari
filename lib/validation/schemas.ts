import { z } from "zod";
import { THEME_IDS } from "@/lib/theme/themes";
import { SPOIL_MODE_IDS, TRAVEL_PERSONA_IDS } from "@/lib/experience/ids";
import { AGREEMENT_VERSION } from "@/lib/experience/types";

/** Letters, marks, spaces, apostrophes and hyphens only — rejects markup by construction. */
const NAME_PATTERN = /^[\p{L}\p{M}\p{Zs}'’\-]+$/u;

export const preferredNameSchema = z
  .string()
  .trim()
  .min(1, "Tell me what to call you.")
  .max(32, "Let's keep it under 32 characters.")
  .regex(NAME_PATTERN, "Letters, spaces, apostrophes and hyphens only.");

export const themeIdSchema = z.enum(THEME_IDS);

export const spoilModeIdSchema = z.enum(SPOIL_MODE_IDS);

export const spoilModesSchema = z
  .array(spoilModeIdSchema)
  .min(1, "Choose at least one.")
  .max(4)
  .refine((modes) => new Set(modes).size === modes.length, "Duplicate selection.");

export const travelPersonaIdSchema = z.enum(TRAVEL_PERSONA_IDS);

export const mustNotMissSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text"),
    value: z.string().trim().min(2, "A couple more characters.").max(180, "Keep it under 180 characters."),
  }),
  z.object({ kind: z.literal("surprise") }),
]);

export const agreementVersionSchema = z.literal(AGREEMENT_VERSION);

/** Hard ceiling referenced by the signature canvas, the seal API body-size check and this schema. */
export const MAX_SIGNATURE_POINTS = 12_000;
export const MAX_SIGNATURE_POINT_GROUPS = 40;

const signaturePointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  time: z.number().finite(),
  pressure: z.number().finite().optional(),
});

const signaturePointGroupSchema = z.array(signaturePointSchema).min(2);

export const drawnSignatureSchema = z
  .object({
    kind: z.literal("drawn"),
    points: z.array(signaturePointGroupSchema).min(1).max(MAX_SIGNATURE_POINT_GROUPS),
  })
  .refine(
    (draft) => draft.points.reduce((total, group) => total + group.length, 0) <= MAX_SIGNATURE_POINTS,
    "Signature is too long.",
  );

export const typedSignatureSchema = z.object({
  kind: z.literal("typed"),
  value: z.string().trim().min(1).max(64),
});

export const signatureDraftSchema = z.discriminatedUnion("kind", [drawnSignatureSchema, typedSignatureSchema]);

/** Body-size ceiling for POST /api/invite/[token]/seal (section 20.1). */
export const MAX_SEAL_BODY_BYTES = 300 * 1024;

export const idempotencyKeySchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid idempotency key.");

/** Matches SealedPayloadV1 (section 19.1) — the encrypted envelope's plaintext shape. */
export const sealedPayloadV1Schema = z.object({
  preferredName: preferredNameSchema,
  themeId: themeIdSchema,
  birthdayWish: z.literal("vacation"),
  spoilModes: spoilModesSchema,
  travelPersona: travelPersonaIdSchema,
  mustNotMiss: mustNotMissSchema,
  agreementVersion: agreementVersionSchema,
  agreementAcknowledgedAt: z.string().datetime(),
  signature: signatureDraftSchema,
});

export type SealedPayloadV1 = z.infer<typeof sealedPayloadV1Schema>;

/** The answer-bearing subset known by the time Review is reached (pre-agreement, pre-signature). */
export const reviewableAnswersSchema = sealedPayloadV1Schema.omit({
  agreementAcknowledgedAt: true,
  signature: true,
});

export const sealSubmissionSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  payload: sealedPayloadV1Schema,
});

export type SealSubmission = z.infer<typeof sealSubmissionSchema>;
