CREATE TABLE "invite_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"invite_token_hash" text NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"agreement_version" text DEFAULT 'lover-agreement-v1' NOT NULL,
	"encrypted_payload" text,
	"payload_schema_version" integer,
	"opened_at" timestamp with time zone,
	"sealed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key_hash" text,
	CONSTRAINT "invite_sessions_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "invite_sessions_invite_token_hash_unique" UNIQUE("invite_token_hash"),
	CONSTRAINT "invite_sessions_idempotency_key_hash_unique" UNIQUE("idempotency_key_hash"),
	CONSTRAINT "invite_sessions_status_check" CHECK ("invite_sessions"."status" IN ('issued', 'opened', 'sealed', 'revoked'))
);
