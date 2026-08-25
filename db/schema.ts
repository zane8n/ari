import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const INVITE_STATUS_VALUES = ["issued", "opened", "sealed", "revoked"] as const;
export type InviteStatus = (typeof INVITE_STATUS_VALUES)[number];

export const inviteSessions = pgTable(
  "invite_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: text("public_id").notNull().unique(),
    inviteTokenHash: text("invite_token_hash").notNull().unique(),
    status: text("status").$type<InviteStatus>().notNull().default("issued"),
    agreementVersion: text("agreement_version").notNull().default("lover-agreement-v1"),
    encryptedPayload: text("encrypted_payload"),
    payloadSchemaVersion: integer("payload_schema_version"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    sealedAt: timestamp("sealed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    idempotencyKeyHash: text("idempotency_key_hash").unique(),
  },
  (table) => [
    check("invite_sessions_status_check", sql`${table.status} IN ('issued', 'opened', 'sealed', 'revoked')`),
  ],
);

export type InviteSession = typeof inviteSessions.$inferSelect;
export type NewInviteSession = typeof inviteSessions.$inferInsert;
