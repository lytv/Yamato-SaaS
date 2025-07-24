-- Add product_id column to employee_salary_entry table
-- Migration: Add Product support to EmployeeSalaryEntry

-- Add product_id column
ALTER TABLE "employee_salary_entry" ADD COLUMN "product_id" integer;

-- Add foreign key constraint to product table
ALTER TABLE "employee_salary_entry" ADD CONSTRAINT "employee_salary_entry_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE cascade;

-- Create index for performance
CREATE INDEX "productIdIdx" ON "employee_salary_entry" ("product_id");

-- Create composite index for product and date queries
CREATE INDEX "productDateIdx" ON "employee_salary_entry" ("product_id", "work_date");

-- Update unique constraint to include product_id
DROP INDEX IF EXISTS "employeeWorkUniqueIdx";
CREATE UNIQUE INDEX "employeeWorkUniqueIdx" ON "employee_salary_entry" ("user_id", "production_step_detail_id", "plan_id", "product_id", "work_date", "owner_id");
