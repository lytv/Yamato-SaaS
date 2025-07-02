CREATE TABLE IF NOT EXISTS "process" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"process_code" text NOT NULL,
	"process_name" text NOT NULL,
	"process_category" text,
	"process_type" text,
	"department" text,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "process_code_owner_idx" ON "process" USING btree ("process_code","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "process_category_idx" ON "process" USING btree ("process_category");