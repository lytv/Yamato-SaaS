CREATE TABLE IF NOT EXISTS "plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"plan_code" text NOT NULL,
	"plan_name" text NOT NULL,
	"plan_year" integer NOT NULL,
	"plan_month" integer NOT NULL,
	"total_target_quantity" integer,
	"total_actual_quantity" integer DEFAULT 0,
	"status" text DEFAULT 'draft',
	"plan_start_date" date,
	"plan_end_date" date,
	"approved_by" text,
	"approved_at" timestamp,
	"note" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_month_valid" CHECK (plan_month >= 1 AND plan_month <= 12)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "plan_code_owner_idx" ON "plan" USING btree ("plan_code","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_month_year_idx" ON "plan" USING btree ("plan_year","plan_month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_status_idx" ON "plan" USING btree ("status");