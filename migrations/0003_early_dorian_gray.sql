CREATE TABLE IF NOT EXISTS "production_step_detail" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"product_id" integer NOT NULL,
	"production_step_id" integer NOT NULL,
	"sequence_number" integer NOT NULL,
	"factory_price" numeric(10, 2),
	"calculated_price" numeric(10, 2),
	"quantity_limit_1" integer,
	"quantity_limit_2" integer,
	"is_final_step" boolean DEFAULT false,
	"is_vt_step" boolean DEFAULT false,
	"is_parking_step" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_step_detail" ADD CONSTRAINT "production_step_detail_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_step_detail" ADD CONSTRAINT "production_step_detail_production_step_id_production_step_id_fk" FOREIGN KEY ("production_step_id") REFERENCES "public"."production_step"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_step_owner_idx" ON "production_step_detail" USING btree ("product_id","production_step_id","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_sequence_idx" ON "production_step_detail" USING btree ("product_id","sequence_number");