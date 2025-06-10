CREATE TABLE IF NOT EXISTS "production_step" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"step_code" text NOT NULL,
	"step_name" text NOT NULL,
	"film_sequence" text,
	"step_group" text,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "step_code_owner_idx" ON "production_step" USING btree ("step_code","owner_id");