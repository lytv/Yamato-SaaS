CREATE TABLE IF NOT EXISTS "employee_salary_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"user_id" text NOT NULL,
	"production_step_detail_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"work_date" date NOT NULL,
	"entry_date" date DEFAULT now(),
	"actual_quantity" integer DEFAULT 0,
	"planned_quantity" integer DEFAULT 0,
	"limit_quantity" integer DEFAULT 0,
	"previous_entered_quantity" integer DEFAULT 0,
	"unit_price" numeric(10, 2),
	"total_amount" numeric(12, 2),
	"salary_note" text,
	"status" text DEFAULT 'draft',
	"approved_by" text,
	"approved_at" timestamp,
	"start_time" timestamp,
	"end_time" timestamp,
	"work_duration_minutes" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "actual_quantity_check" CHECK (actual_quantity >= 0),
	CONSTRAINT "planned_quantity_check" CHECK (planned_quantity >= 0),
	CONSTRAINT "limit_quantity_check" CHECK (limit_quantity >= 0),
	CONSTRAINT "unit_price_check" CHECK (unit_price >= 0),
	CONSTRAINT "total_amount_check" CHECK (total_amount >= 0),
	CONSTRAINT "work_duration_check" CHECK (work_duration_minutes >= 0)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_salary_entry" ADD CONSTRAINT "employee_salary_entry_user_id_user_sync_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_sync"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_salary_entry" ADD CONSTRAINT "employee_salary_entry_production_step_detail_id_production_step_detail_id_fk" FOREIGN KEY ("production_step_detail_id") REFERENCES "public"."production_step_detail"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_salary_entry" ADD CONSTRAINT "employee_salary_entry_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "employee_work_unique_idx" ON "employee_salary_entry" USING btree ("user_id","production_step_detail_id","plan_id","work_date","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_salary_user_idx" ON "employee_salary_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_salary_plan_idx" ON "employee_salary_entry" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_salary_work_date_idx" ON "employee_salary_entry" USING btree ("work_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_salary_status_idx" ON "employee_salary_entry" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_salary_entry_date_idx" ON "employee_salary_entry" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_salary_user_plan_idx" ON "employee_salary_entry" USING btree ("user_id","plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_salary_plan_date_idx" ON "employee_salary_entry" USING btree ("plan_id","work_date");