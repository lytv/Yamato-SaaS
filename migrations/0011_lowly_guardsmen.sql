CREATE TABLE IF NOT EXISTS "plan_detail" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"plan_id" integer NOT NULL,
	"location_code" text NOT NULL,
	"location_type" text,
	"product_code" text NOT NULL,
	"product_sub_code" text NOT NULL,
	"planned_quantity" integer NOT NULL,
	"actual_quantity" integer DEFAULT 0,
	"planned_start_date" date,
	"planned_end_date" date,
	"actual_start_date" date,
	"actual_end_date" date,
	"status" text DEFAULT 'planned',
	"priority" integer DEFAULT 5,
	"note" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plan_detail" ADD CONSTRAINT "plan_detail_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "plan_detail_unique_idx" ON "plan_detail" USING btree ("plan_id","location_code","product_sub_code","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_detail_location_idx" ON "plan_detail" USING btree ("location_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_detail_product_idx" ON "plan_detail" USING btree ("product_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_detail_status_idx" ON "plan_detail" USING btree ("status");