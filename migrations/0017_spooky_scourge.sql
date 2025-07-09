CREATE TABLE IF NOT EXISTS "outsource_order_receipt" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"outsource_order_detail_id" integer NOT NULL,
	"receipt_number" text NOT NULL,
	"receipt_title" text,
	"receipt_quantity" integer NOT NULL,
	"receipt_date" date NOT NULL,
	"planned_receipt_date" date,
	"quality_status" text DEFAULT 'pending',
	"quality_score" integer,
	"defect_quantity" integer DEFAULT 0,
	"rework_quantity" integer DEFAULT 0,
	"quality_notes" text,
	"received_by_user_id" text NOT NULL,
	"inspected_by_user_id" text,
	"delivered_by_user_id" text,
	"batch_number" text,
	"storage_location" text,
	"warehouse_code" text,
	"actual_unit_cost" numeric(10, 2),
	"total_cost" numeric(12, 2),
	"notes" text,
	"attachments" text,
	"status" text DEFAULT 'received',
	"is_partial_receipt" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "receipt_quantity_valid" CHECK (receipt_quantity > 0),
	CONSTRAINT "defect_quantity_valid" CHECK (defect_quantity >= 0 AND defect_quantity <= receipt_quantity),
	CONSTRAINT "rework_quantity_valid" CHECK (rework_quantity >= 0 AND rework_quantity <= receipt_quantity),
	CONSTRAINT "quality_score_valid" CHECK (quality_score IS NULL OR (quality_score >= 1 AND quality_score <= 10))
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outsource_order_receipt" ADD CONSTRAINT "outsource_order_receipt_outsource_order_detail_id_outsource_order_detail_id_fk" FOREIGN KEY ("outsource_order_detail_id") REFERENCES "public"."outsource_order_detail"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipt_detail_idx" ON "outsource_order_receipt" USING btree ("outsource_order_detail_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipt_date_idx" ON "outsource_order_receipt" USING btree ("receipt_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "receipt_number_owner_idx" ON "outsource_order_receipt" USING btree ("receipt_number","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipt_user_idx" ON "outsource_order_receipt" USING btree ("received_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipt_quality_idx" ON "outsource_order_receipt" USING btree ("quality_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipt_status_idx" ON "outsource_order_receipt" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipt_batch_idx" ON "outsource_order_receipt" USING btree ("batch_number");