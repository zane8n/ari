CREATE TABLE "trip_days" (
	"date" date PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"mood" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
