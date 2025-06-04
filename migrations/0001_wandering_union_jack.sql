CREATE TABLE IF NOT EXISTS "product" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"product_code" text NOT NULL,
	"product_name" text NOT NULL,
	"notes" text,
	"category" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_code_owner_idx" ON "product" USING btree ("product_code","owner_id");