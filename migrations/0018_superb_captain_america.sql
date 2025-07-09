CREATE TABLE IF NOT EXISTS "batch_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"naming_pattern" text NOT NULL,
	"default_period_days" integer DEFAULT 30,
	"auto_calculate_on_create" boolean DEFAULT false,
	"allow_user_period_override" boolean DEFAULT true,
	"default_metadata" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"usage_count" integer DEFAULT 0,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calculation_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid,
	"user_id" uuid,
	"performed_by" uuid NOT NULL,
	"action" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calculation_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_start_date" timestamp with time zone NOT NULL,
	"default_end_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"calculated_at" timestamp with time zone,
	"finalized_at" timestamp with time zone,
	"finalized_by" uuid,
	"total_users" integer DEFAULT 0,
	"total_employee_salary" numeric(15, 2) DEFAULT '0',
	"total_outsource_amount" numeric(15, 2) DEFAULT '0',
	"grand_total" numeric(15, 2) DEFAULT '0',
	"auto_calculate_on_create" boolean DEFAULT false,
	"allow_user_period_override" boolean DEFAULT true,
	"incremental_mode" boolean DEFAULT false,
	"last_full_calculation" timestamp with time zone,
	"affected_users_count" integer DEFAULT 0,
	"notes" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calculation_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_id" uuid NOT NULL,
	"production_step_id" uuid NOT NULL,
	"employee_salary_quantity" numeric(15, 4) DEFAULT '0',
	"employee_salary_unit_price" numeric(15, 4) DEFAULT '0',
	"employee_salary_amount" numeric(15, 2) DEFAULT '0',
	"outsource_quantity" numeric(15, 4) DEFAULT '0',
	"outsource_unit_price" numeric(15, 4) DEFAULT '0',
	"outsource_amount" numeric(15, 2) DEFAULT '0',
	"step_name" text,
	"step_description" text,
	"source_employee_entry_ids" jsonb,
	"source_outsource_receipt_ids" jsonb,
	"data_volume_processed" integer,
	"calculation_complexity_score" integer,
	"optimization_suggestions" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calculation_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid,
	"user_id" uuid,
	"notification_type" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"metadata" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calculation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"employee_salary_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"outsource_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"actual_start_date" timestamp with time zone NOT NULL,
	"actual_end_date" timestamp with time zone NOT NULL,
	"total_production_steps" integer DEFAULT 0,
	"total_employee_entries" integer DEFAULT 0,
	"total_outsource_entries" integer DEFAULT 0,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"calculation_duration_ms" integer,
	"has_validation_errors" boolean DEFAULT false,
	"validation_errors" jsonb,
	"source_data_hash" text,
	"source_data_version" text,
	"data_change_detection_enabled" boolean DEFAULT true,
	"data_hash" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_calculation_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"custom_start_date" timestamp with time zone,
	"custom_end_date" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_custom_period" boolean DEFAULT false NOT NULL,
	"exclude_from_calculation" boolean DEFAULT false NOT NULL,
	"calculation_progress" integer DEFAULT 0,
	"last_error_message" text,
	"retry_count" integer DEFAULT 0,
	"estimated_completion_time" timestamp with time zone,
	"notes" text,
	"reason_for_custom_period" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"last_calculated_at" timestamp with time zone,
	"calculation_error" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calculation_details" ADD CONSTRAINT "calculation_details_result_id_calculation_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."calculation_results"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calculation_notifications" ADD CONSTRAINT "calculation_notifications_batch_id_calculation_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."calculation_batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calculation_results" ADD CONSTRAINT "calculation_results_batch_id_calculation_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."calculation_batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_calculation_periods" ADD CONSTRAINT "user_calculation_periods_batch_id_calculation_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."calculation_batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_templates_name_idx" ON "batch_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_templates_created_by_idx" ON "batch_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_audit_timestamp_idx" ON "calculation_audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_audit_batch_idx" ON "calculation_audit_log" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_audit_user_idx" ON "calculation_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_audit_performed_by_idx" ON "calculation_audit_log" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_audit_action_idx" ON "calculation_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_batches_name_idx" ON "calculation_batches" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_batches_status_idx" ON "calculation_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_batches_date_range_idx" ON "calculation_batches" USING btree ("default_start_date","default_end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_batches_created_by_idx" ON "calculation_batches" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_details_result_idx" ON "calculation_details" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_details_step_idx" ON "calculation_details" USING btree ("production_step_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_details_result_step_idx" ON "calculation_details" USING btree ("result_id","production_step_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_notifications_batch_idx" ON "calculation_notifications" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_notifications_user_idx" ON "calculation_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_notifications_status_idx" ON "calculation_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_notifications_type_idx" ON "calculation_notifications" USING btree ("notification_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_notifications_scheduled_at_idx" ON "calculation_notifications" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_results_batch_user_idx" ON "calculation_results" USING btree ("batch_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_results_batch_idx" ON "calculation_results" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_results_user_idx" ON "calculation_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_results_calculated_at_idx" ON "calculation_results" USING btree ("calculated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calc_results_unique_batch_user" ON "calculation_results" USING btree ("batch_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_calc_periods_batch_user_idx" ON "user_calculation_periods" USING btree ("batch_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_calc_periods_batch_idx" ON "user_calculation_periods" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_calc_periods_user_idx" ON "user_calculation_periods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_calc_periods_status_idx" ON "user_calculation_periods" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_calc_periods_unique_batch_user" ON "user_calculation_periods" USING btree ("batch_id","user_id");