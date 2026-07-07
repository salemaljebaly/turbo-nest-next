ALTER TABLE "idempotency_keys" DROP CONSTRAINT "idempotency_keys_key_unique";--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD COLUMN "user_id" text;--> statement-breakpoint
DELETE FROM "idempotency_keys";--> statement-breakpoint
ALTER TABLE "idempotency_keys" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_user_key_unique" ON "idempotency_keys" USING btree ("user_id","key");
