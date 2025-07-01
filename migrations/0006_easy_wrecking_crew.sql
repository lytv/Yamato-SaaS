CREATE TABLE IF NOT EXISTS "product_sub" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"product_id" integer NOT NULL,
	"product_code" text NOT NULL,
	"product_sub_code" text NOT NULL,
	"product_sub_detail" text NOT NULL,
	"sub_category" text NOT NULL,
	"color_code" text,
	"barcode" text,
	"description" text,
	"note" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"task_code" text NOT NULL,
	"task_name" text NOT NULL,
	"description" text,
	"priority" text,
	"status" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_sub" ADD CONSTRAINT "product_sub_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_sub_code_owner_idx" ON "product_sub" USING btree ("product_sub_code","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_sub_product_idx" ON "product_sub" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_sub_category_idx" ON "product_sub" USING btree ("sub_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_sub_color_idx" ON "product_sub" USING btree ("color_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "task_code_owner_idx" ON "task" USING btree ("task_code","owner_id");