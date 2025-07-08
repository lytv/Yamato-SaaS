CREATE TABLE IF NOT EXISTS "outsource_order_detail" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"outsource_order_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"production_step_id" integer NOT NULL,
	"plan_code" text NOT NULL,
	"plan_name" text NOT NULL,
	"product_code" text NOT NULL,
	"product_name" text NOT NULL,
	"step_code" text NOT NULL,
	"step_name" text NOT NULL,
	"ordered_quantity" integer NOT NULL,
	"completed_quantity" integer DEFAULT 0,
	"expected_completion_date" date NOT NULL,
	"actual_completion_date" date,
	"status" text DEFAULT 'pending',
	"sequence_number" integer,
	"unit_price" numeric(10, 2),
	"total_price" numeric(12, 2),
	"item_notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outsource_order_detail" ADD CONSTRAINT "outsource_order_detail_outsource_order_id_outsource_order_id_fk" FOREIGN KEY ("outsource_order_id") REFERENCES "public"."outsource_order"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outsource_order_detail" ADD CONSTRAINT "outsource_order_detail_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outsource_order_detail" ADD CONSTRAINT "outsource_order_detail_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outsource_order_detail" ADD CONSTRAINT "outsource_order_detail_production_step_id_production_step_id_fk" FOREIGN KEY ("production_step_id") REFERENCES "public"."production_step"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outsource_order_detail_order_idx" ON "outsource_order_detail" USING btree ("outsource_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outsource_order_detail_plan_idx" ON "outsource_order_detail" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outsource_order_detail_product_idx" ON "outsource_order_detail" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outsource_order_detail_step_idx" ON "outsource_order_detail" USING btree ("production_step_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outsource_order_detail_status_idx" ON "outsource_order_detail" USING btree ("status");