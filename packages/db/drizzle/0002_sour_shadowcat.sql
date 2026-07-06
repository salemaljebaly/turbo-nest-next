CREATE TYPE "public"."idempotency_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"response" jsonb,
	"status" "idempotency_status" DEFAULT 'in_progress' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idempotency_keys_status_idx" ON "idempotency_keys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_owner_id_idx" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");