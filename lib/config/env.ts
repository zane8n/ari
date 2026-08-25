import "server-only";
import { z } from "zod";

const ISO_DATETIME_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
    RESPONSE_ENCRYPTION_KEY: z
      .string()
      .min(1, "RESPONSE_ENCRYPTION_KEY is required.")
      .refine((value) => {
        try {
          return Buffer.from(value, "base64").length === 32;
        } catch {
          return false;
        }
      }, "RESPONSE_ENCRYPTION_KEY must be base64-encoded 32 bytes (see scripts/provision-host-secret.ts)."),
    HOST_PASSWORD_HASH: z.string().min(1, "HOST_PASSWORD_HASH is required (run pnpm provision:host-secret)."),
    HOST_SESSION_SECRET: z
      .string()
      .refine((value) => {
        try {
          return Buffer.from(value, "base64").length >= 32;
        } catch {
          return false;
        }
      }, "HOST_SESSION_SECRET must be base64-encoded and at least 32 bytes."),
    VACATION_DESTINATION: z.string().min(1, "VACATION_DESTINATION is required — never inferred (section: Required content variables)."),
    VACATION_START: z
      .string()
      .regex(ISO_DATETIME_WITH_OFFSET, "VACATION_START must be ISO 8601 with an explicit UTC offset, e.g. 2026-11-02T14:00:00+02:00."),
    VACATION_END: z
      .string()
      .regex(ISO_DATETIME_WITH_OFFSET, "VACATION_END must be ISO 8601 with an explicit UTC offset, e.g. 2026-11-09T11:00:00+02:00."),
    FINAL_PRIVATE_NOTE: z
      .string()
      .min(1, "FINAL_PRIVATE_NOTE is required — one short reviewed sentence, not generated at runtime.")
      .max(180, "FINAL_PRIVATE_NOTE must be 180 characters or fewer."),
    PUBLIC_SITE_ORIGIN: z
      .string()
      .url("PUBLIC_SITE_ORIGIN must be a full https URL, e.g. https://example.com.")
      .refine(
        (value) => value.startsWith("https://") || value.startsWith("http://localhost"),
        "PUBLIC_SITE_ORIGIN must use https in production (http://localhost is fine for local dev).",
      ),
    RECIPIENT_DEFAULT_NAME: z.string().max(32).optional().default(""),
  })
  .refine((env) => new Date(env.VACATION_END).getTime() > new Date(env.VACATION_START).getTime(), {
    message: "VACATION_END must be after VACATION_START.",
    path: ["VACATION_END"],
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Fails loudly instead of shipping guessed copy or a reveal containing
 * square brackets. Every server module that needs these values calls this
 * rather than reading process.env directly, so a missing value surfaces as
 * one readable error instead of undefined leaking into rendered copy.
 */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Production configuration is incomplete. This is expected until Isaac supplies the real values — see .env.example.\n${issues}`,
    );
  }
  cached = parsed.data;
  return cached;
}

export function isEnvConfigured(): boolean {
  return envSchema.safeParse(process.env).success;
}
