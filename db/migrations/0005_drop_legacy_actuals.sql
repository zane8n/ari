ALTER TABLE "budget_items" DROP CONSTRAINT "budget_items_currency_check";--> statement-breakpoint
ALTER TABLE "budget_items" DROP COLUMN "actual_amount";--> statement-breakpoint
ALTER TABLE "budget_items" DROP COLUMN "actual_currency";--> statement-breakpoint
ALTER TABLE "budget_items" DROP COLUMN "actual_usd";