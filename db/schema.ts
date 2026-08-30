import { sql } from "drizzle-orm";
import { boolean, check, date, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

/**
 * The trip budget/itinerary tracker — a private, practical tool for actually
 * running the vacation, distinct from the invitation/proposal narrative
 * above. Protected by the same host session, seeded once from a gitignored
 * local content file (this repo is public — real dates, accommodation and
 * budget figures must never land in source, only in this database), then
 * edited live during the trip.
 */
export const tripDays = pgTable("trip_days", {
  date: date("date").primaryKey(),
  label: text("label").notNull(),
  mood: text("mood"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type TripDay = typeof tripDays.$inferSelect;
export type NewTripDay = typeof tripDays.$inferInsert;


export const BUDGET_CATEGORY_VALUES = [
  "food",
  "transport",
  "activities",
  "shopping",
  "accommodation",
  "other",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORY_VALUES)[number];

export const CURRENCY_VALUES = ["USD", "KES", "TZS"] as const;
export type Currency = (typeof CURRENCY_VALUES)[number];

export const budgetItems = pgTable(
  "budget_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: text("category").$type<BudgetCategory>().notNull(),
    label: text("label").notNull(),
    day: date("day"),
    estimatedUsd: numeric("estimated_usd", { precision: 10, scale: 2 }).notNull(),
    actualAmount: numeric("actual_amount", { precision: 12, scale: 2 }),
    actualCurrency: text("actual_currency").$type<Currency>(),
    actualUsd: numeric("actual_usd", { precision: 10, scale: 2 }),
    notes: text("notes"),
    isReserve: boolean("is_reserve").notNull().default(false),
    isCustom: boolean("is_custom").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("budget_items_category_check", sql`${table.category} IN ('food', 'transport', 'activities', 'shopping', 'accommodation', 'other')`),
    check("budget_items_currency_check", sql`${table.actualCurrency} IS NULL OR ${table.actualCurrency} IN ('USD', 'KES', 'TZS')`),
  ],
);

export type BudgetItem = typeof budgetItems.$inferSelect;
export type NewBudgetItem = typeof budgetItems.$inferInsert;

export const EVENT_STATUS_VALUES = ["planned", "done", "skipped"] as const;
export type EventStatus = (typeof EVENT_STATUS_VALUES)[number];

export const itineraryEvents = pgTable(
  "itinerary_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    day: date("day").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    timeOfDay: text("time_of_day"),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    linkedBudgetItemId: uuid("linked_budget_item_id").references(() => budgetItems.id, { onDelete: "set null" }),
    status: text("status").$type<EventStatus>().notNull().default("planned"),
    originalDay: date("original_day"),
    notes: text("notes"),
    isCustom: boolean("is_custom").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("itinerary_events_status_check", sql`${table.status} IN ('planned', 'done', 'skipped')`)],
);

export type ItineraryEvent = typeof itineraryEvents.$inferSelect;
export type NewItineraryEvent = typeof itineraryEvents.$inferInsert;
