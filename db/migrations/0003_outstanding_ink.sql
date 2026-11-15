CREATE TABLE "letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"body" text NOT NULL,
	"signature" text,
	"unlock_at" timestamp with time zone NOT NULL,
	"opened_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "letters_token_hash_unique" UNIQUE("token_hash")
);
