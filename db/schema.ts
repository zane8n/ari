import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
 * The trip tracker — a private, practical tool for actually running each
 * vacation, distinct from the invitation/proposal narrative above. Protected
 * by the same host session. Every trip-scoped row hangs off one `trips` row
 * (reached at /host/trip/<slug>), seeded once from a gitignored local content
 * file (this repo is public — real dates, accommodation and budget figures
 * must never land in source, only in this database), then edited live.
 */
export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  destination: text("destination").notNull(),
  homeBase: text("home_base"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  /** The shared pot. Null only for the legacy (pre-multi-trip) row, which falls back to TRIP_CASH_BUDGET_USD. */
  potUsd: numeric("pot_usd", { precision: 10, scale: 2 }),
  /** The emergency reserve, held outside the pot. Null falls back to TRIP_RESERVE_BUDGET_USD. */
  reserveUsd: numeric("reserve_usd", { precision: 10, scale: 2 }),
  /** The currency money is usually paid in on the ground — the quick-log default. */
  spendCurrency: text("spend_currency").$type<Currency>().notNull().default("USD"),
  timezone: text("timezone").notNull().default("Africa/Nairobi"),
  /** Local hour (0–23) after which the evening check-in is surfaced and the calendar reminder fires. */
  checkinHour: integer("checkin_hour").notNull().default(20),
  /** Short house rules for the trip's money, shown on the Money view. */
  rules: jsonb("rules").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

/** Sun, tide and weather notes for a day — free-form display data, never computed on. */
export type TripDayInfo = {
  sunrise?: string;
  sunset?: string;
  highTides?: string[];
  lowTides?: string[];
  rainRisk?: string;
  why?: string;
};

export const tripDays = pgTable(
  "trip_days",
  {
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    label: text("label").notNull(),
    mood: text("mood"),
    pace: text("pace"),
    info: jsonb("info").$type<TripDayInfo>(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.tripId, table.date] })],
);

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

/**
 * `fixed` is a one-off cost (a booking, a dinner) that closes once paid.
 * `running` is a pot that many small spends draw down across the trip
 * (tuk-tuks, groceries, snacks) and stays open until the trip ends.
 */
export const BUDGET_KIND_VALUES = ["fixed", "running"] as const;
export type BudgetKind = (typeof BUDGET_KIND_VALUES)[number];

/** `open` still expected · `paid` settled by logged spend · `dropped` won't happen (skipped/cut) — its estimate is freed. */
export const BUDGET_STATUS_VALUES = ["open", "paid", "dropped"] as const;
export type BudgetStatus = (typeof BUDGET_STATUS_VALUES)[number];

export const budgetItems = pgTable(
  "budget_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    category: text("category").$type<BudgetCategory>().notNull(),
    label: text("label").notNull(),
    day: date("day"),
    estimatedUsd: numeric("estimated_usd", { precision: 10, scale: 2 }).notNull(),
    kind: text("kind").$type<BudgetKind>().notNull().default("fixed"),
    status: text("status").$type<BudgetStatus>().notNull().default("open"),
    /** Position in the "if costs run over, cut in this order" list — null means never cut. */
    cutRank: integer("cut_rank"),
    cutNote: text("cut_note"),
    cutSavingUsd: numeric("cut_saving_usd", { precision: 10, scale: 2 }),
    notes: text("notes"),
    isReserve: boolean("is_reserve").notNull().default(false),
    isCustom: boolean("is_custom").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("budget_items_category_check", sql`${table.category} IN ('food', 'transport', 'activities', 'shopping', 'accommodation', 'other')`),
    check("budget_items_kind_check", sql`${table.kind} IN ('fixed', 'running')`),
    check("budget_items_status_check", sql`${table.status} IN ('open', 'paid', 'dropped')`),
  ],
);

export type BudgetItem = typeof budgetItems.$inferSelect;
export type NewBudgetItem = typeof budgetItems.$inferInsert;

/** Which money an expense came out of: the shared pot, or the emergency reserve held outside it. */
export const EXPENSE_FUND_VALUES = ["pot", "reserve"] as const;
export type ExpenseFund = (typeof EXPENSE_FUND_VALUES)[number];

/**
 * Every real payment, as entered on the ground — many per budget line
 * (every tuk-tuk is its own row). The USD equivalent is computed
 * server-side at log time and frozen, so later rate moves never rewrite
 * history.
 */
export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    budgetItemId: uuid("budget_item_id").references(() => budgetItems.id, { onDelete: "set null" }),
    day: date("day"),
    category: text("category").$type<BudgetCategory>().notNull(),
    label: text("label").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").$type<Currency>().notNull(),
    amountUsd: numeric("amount_usd", { precision: 10, scale: 2 }).notNull(),
    fund: text("fund").$type<ExpenseFund>().notNull().default("pot"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("expenses_trip_idx").on(table.tripId, table.day),
    check("expenses_category_check", sql`${table.category} IN ('food', 'transport', 'activities', 'shopping', 'accommodation', 'other')`),
    check("expenses_currency_check", sql`${table.currency} IN ('USD', 'KES', 'TZS')`),
    check("expenses_fund_check", sql`${table.fund} IN ('pot', 'reserve')`),
  ],
);

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export const EVENT_STATUS_VALUES = ["planned", "done", "skipped"] as const;
export type EventStatus = (typeof EVENT_STATUS_VALUES)[number];

export const itineraryEvents = pgTable(
  "itinerary_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    timeOfDay: text("time_of_day"),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    phone: text("phone"),
    linkedBudgetItemId: uuid("linked_budget_item_id").references(() => budgetItems.id, { onDelete: "set null" }),
    status: text("status").$type<EventStatus>().notNull().default("planned"),
    isOptional: boolean("is_optional").notNull().default(false),
    /** Shown as a sealed card — the real details stay off the shared tracker. */
    isSurprise: boolean("is_surprise").notNull().default(false),
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

/** One row per day the evening check-in was completed. */
export const tripCheckins = pgTable(
  "trip_checkins",
  {
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    highlight: text("highlight"),
    mood: integer("mood"),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tripId, table.day] }),
    check("trip_checkins_mood_check", sql`${table.mood} IS NULL OR (${table.mood} BETWEEN 1 AND 5)`),
  ],
);

export type TripCheckin = typeof tripCheckins.$inferSelect;

/** `before` = the pre-trip booking checklist; `during` = day-before confirmations, due on `dueDay`. */
export const TASK_PHASE_VALUES = ["before", "during"] as const;
export type TaskPhase = (typeof TASK_PHASE_VALUES)[number];

export const tripTasks = pgTable(
  "trip_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    phase: text("phase").$type<TaskPhase>().notNull().default("before"),
    title: text("title").notNull(),
    detail: text("detail"),
    dueDay: date("due_day"),
    sortOrder: integer("sort_order").notNull().default(0),
    doneAt: timestamp("done_at", { withTimezone: true }),
  },
  (table) => [check("trip_tasks_phase_check", sql`${table.phase} IN ('before', 'during')`)],
);

export type TripTask = typeof tripTasks.$inferSelect;

/**
 * Private, time-locked letters — one row per letter, reached through an
 * unguessable `/letter/<token>` link. The body lives only here (this repo is
 * public; see content/letter.ts), and is never sent to the browser before
 * `unlockAt`.
 */
export const letters = pgTable("letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: text("token_hash").notNull().unique(),
  body: text("body").notNull(),
  signature: text("signature"),
  unlockAt: timestamp("unlock_at", { withTimezone: true }).notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Letter = typeof letters.$inferSelect;
export type NewLetter = typeof letters.$inferInsert;
