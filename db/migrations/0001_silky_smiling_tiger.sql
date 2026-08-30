CREATE TABLE "budget_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"day" date,
	"estimated_usd" numeric(10, 2) NOT NULL,
	"actual_amount" numeric(12, 2),
	"actual_currency" text,
	"actual_usd" numeric(10, 2),
	"notes" text,
	"is_reserve" boolean DEFAULT false NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_items_category_check" CHECK ("budget_items"."category" IN ('food', 'transport', 'activities', 'shopping', 'accommodation', 'other')),
	CONSTRAINT "budget_items_currency_check" CHECK ("budget_items"."actual_currency" IS NULL OR "budget_items"."actual_currency" IN ('USD', 'KES', 'TZS'))
);
--> statement-breakpoint
CREATE TABLE "itinerary_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"time_of_day" text,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"linked_budget_item_id" uuid,
	"status" text DEFAULT 'planned' NOT NULL,
	"original_day" date,
	"notes" text,
	"is_custom" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "itinerary_events_status_check" CHECK ("itinerary_events"."status" IN ('planned', 'done', 'skipped'))
);
--> statement-breakpoint
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_linked_budget_item_id_budget_items_id_fk" FOREIGN KEY ("linked_budget_item_id") REFERENCES "public"."budget_items"("id") ON DELETE set null ON UPDATE no action;