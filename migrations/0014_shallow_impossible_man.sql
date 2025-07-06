DROP INDEX IF EXISTS "employeeWorkUniqueIdx";--> statement-breakpoint
ALTER TABLE "employee_salary_entry" ADD COLUMN "product_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_salary_entry" ADD CONSTRAINT "employee_salary_entry_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "productIdIdx" ON "employee_salary_entry" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "productDateIdx" ON "employee_salary_entry" USING btree ("product_id","work_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "employeeWorkUniqueIdx" ON "employee_salary_entry" USING btree ("user_id","production_step_detail_id","plan_id","product_id","work_date","owner_id");