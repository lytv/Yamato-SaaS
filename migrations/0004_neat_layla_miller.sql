CREATE TABLE IF NOT EXISTS "work_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"table_code" text NOT NULL,
	"table_name" text,
	"table_detail" text,
	"table_type" text,
	"table_category" integer,
	"capacity_per_day" integer,
	"capacity_per_hour" integer,
	"table_size_length" numeric(8, 2),
	"table_size_width" numeric(8, 2),
	"location_code" text,
	"department" text,
	"assigned_operator" text,
	"supervisor" text,
	"status" text DEFAULT 'active',
	"availability_schedule" text,
	"last_maintenance_date" date,
	"next_maintenance_date" date,
	"equipment_model" text,
	"installation_date" date,
	"warranty_expiry_date" date,
	"utilization_rate" numeric(5, 2),
	"efficiency_rating" numeric(5, 2),
	"total_processed_units" integer DEFAULT 0,
	"special_capabilities" text,
	"limitations" text,
	"note" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "work_table_code_owner_idx" ON "work_table" USING btree ("table_code","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_table_type_idx" ON "work_table" USING btree ("table_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_table_status_idx" ON "work_table" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_table_category_idx" ON "work_table" USING btree ("table_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_table_location_idx" ON "work_table" USING btree ("location_code");