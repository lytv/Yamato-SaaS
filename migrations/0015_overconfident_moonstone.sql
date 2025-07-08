CREATE TABLE IF NOT EXISTS "outsource_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"order_code" text NOT NULL,
	"order_title" text,
	"created_by_user_id" text NOT NULL,
	"assigned_to_user_id" text NOT NULL,
	"order_date" date NOT NULL,
	"expected_completion_date" date,
	"actual_completion_date" date,
	"status" text DEFAULT 'draft',
	"priority" integer DEFAULT 5,
	"total_amount" numeric(12, 2),
	"currency" text DEFAULT 'VND',
	"notes" text,
	"attachment" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "order_code_owner_idx" ON "outsource_order" USING btree ("order_code","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outsource_order_status_idx" ON "outsource_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outsource_order_assigned_user_idx" ON "outsource_order" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outsource_order_date_idx" ON "outsource_order" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outsource_order_created_by_idx" ON "outsource_order" USING btree ("created_by_user_id");