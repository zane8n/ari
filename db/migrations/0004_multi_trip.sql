CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"budget_item_id" uuid,
	"day" date,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text NOT NULL,
	"amount_usd" numeric(10, 2) NOT NULL,
	"fund" text DEFAULT 'pot' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_category_check" CHECK ("expenses"."category" IN ('food', 'transport', 'activities', 'shopping', 'accommodation', 'other')),
	CONSTRAINT "expenses_currency_check" CHECK ("expenses"."currency" IN ('USD', 'KES', 'TZS')),
	CONSTRAINT "expenses_fund_check" CHECK ("expenses"."fund" IN ('pot', 'reserve'))
);
--> statement-breakpoint
CREATE TABLE "trip_checkins" (
	"trip_id" uuid NOT NULL,
	"day" date NOT NULL,
	"highlight" text,
	"mood" integer,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_checkins_trip_id_day_pk" PRIMARY KEY("trip_id","day"),
	CONSTRAINT "trip_checkins_mood_check" CHECK ("trip_checkins"."mood" IS NULL OR ("trip_checkins"."mood" BETWEEN 1 AND 5))
);
--> statement-breakpoint
CREATE TABLE "trip_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"phase" text DEFAULT 'before' NOT NULL,
	"title" text NOT NULL,
	"detail" text,
	"due_day" date,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"done_at" timestamp with time zone,
	CONSTRAINT "trip_tasks_phase_check" CHECK ("trip_tasks"."phase" IN ('before', 'during'))
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"destination" text NOT NULL,
	"home_base" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"pot_usd" numeric(10, 2),
	"reserve_usd" numeric(10, 2),
	"spend_currency" text DEFAULT 'USD' NOT NULL,
	"timezone" text DEFAULT 'Africa/Nairobi' NOT NULL,
	"checkin_hour" integer DEFAULT 20 NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
-- Hand-edited: the tracker was single-trip until now. Any existing rows
-- belong to one legacy trip, so it is created first (only when there is
-- legacy data) and every existing row is pointed at it before trip_id
-- becomes NOT NULL. Its pot/reserve stay NULL and fall back to the
-- TRIP_CASH_BUDGET_USD / TRIP_RESERVE_BUDGET_USD env values at runtime.
INSERT INTO "trips" ("slug", "name", "destination", "start_date", "end_date", "spend_currency")
SELECT 'arusha', 'Arusha', 'Arusha',
       COALESCE((SELECT MIN("date") FROM "trip_days"), CURRENT_DATE),
       COALESCE((SELECT MAX("date") FROM "trip_days"), CURRENT_DATE),
       'TZS'
WHERE EXISTS (SELECT 1 FROM "trip_days")
   OR EXISTS (SELECT 1 FROM "budget_items")
   OR EXISTS (SELECT 1 FROM "itinerary_events");--> statement-breakpoint
ALTER TABLE "trip_days" ADD COLUMN "trip_id" uuid;--> statement-breakpoint
ALTER TABLE "trip_days" ADD COLUMN "pace" text;--> statement-breakpoint
ALTER TABLE "trip_days" ADD COLUMN "info" jsonb;--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "trip_id" uuid;--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "kind" text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "status" text DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "cut_rank" integer;--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "cut_note" text;--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "cut_saving_usd" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "itinerary_events" ADD COLUMN "trip_id" uuid;--> statement-breakpoint
ALTER TABLE "itinerary_events" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "itinerary_events" ADD COLUMN "is_optional" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "itinerary_events" ADD COLUMN "is_surprise" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "trip_days" SET "trip_id" = (SELECT "id" FROM "trips" WHERE "slug" = 'arusha');--> statement-breakpoint
UPDATE "budget_items" SET "trip_id" = (SELECT "id" FROM "trips" WHERE "slug" = 'arusha');--> statement-breakpoint
UPDATE "itinerary_events" SET "trip_id" = (SELECT "id" FROM "trips" WHERE "slug" = 'arusha');--> statement-breakpoint
-- Each logged actual becomes one expense row linked back to its budget line,
-- and that line is marked paid; 0005 then drops the old actual_* columns.
INSERT INTO "expenses" ("trip_id", "budget_item_id", "day", "category", "label", "amount", "currency", "amount_usd", "fund", "created_at")
SELECT "trip_id", "id", "day", "category", "label", "actual_amount", COALESCE("actual_currency", 'USD'), "actual_usd",
       CASE WHEN "is_reserve" THEN 'reserve' ELSE 'pot' END, "updated_at"
FROM "budget_items"
WHERE "actual_usd" IS NOT NULL AND "actual_amount" IS NOT NULL;--> statement-breakpoint
UPDATE "budget_items" SET "status" = 'paid' WHERE "actual_usd" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_days" ALTER COLUMN "trip_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_items" ALTER COLUMN "trip_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "itinerary_events" ALTER COLUMN "trip_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_days" DROP CONSTRAINT IF EXISTS "trip_days_pkey";--> statement-breakpoint
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_trip_id_date_pk" PRIMARY KEY("trip_id","date");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_budget_item_id_budget_items_id_fk" FOREIGN KEY ("budget_item_id") REFERENCES "public"."budget_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_checkins" ADD CONSTRAINT "trip_checkins_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_tasks" ADD CONSTRAINT "trip_tasks_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_trip_idx" ON "expenses" USING btree ("trip_id","day");--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_kind_check" CHECK ("budget_items"."kind" IN ('fixed', 'running'));--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_status_check" CHECK ("budget_items"."status" IN ('open', 'paid', 'dropped'));