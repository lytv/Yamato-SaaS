CREATE UNIQUE INDEX IF NOT EXISTS "employeeWorkUniqueIdx" ON "employee_salary_entry" USING btree ("user_id","production_step_detail_id","plan_id","work_date","owner_id");
CREATE INDEX IF NOT EXISTS "employeeIdIdx" ON "employee_salary_entry" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "planIdIdx" ON "employee_salary_entry" USING btree ("plan_id");
CREATE INDEX IF NOT EXISTS "workDateIdx" ON "employee_salary_entry" USING btree ("work_date");
CREATE INDEX IF NOT EXISTS "statusIdx" ON "employee_salary_entry" USING btree ("status");
CREATE INDEX IF NOT EXISTS "entryDateIdx" ON "employee_salary_entry" USING btree ("entry_date");
CREATE INDEX IF NOT EXISTS "userPlanIdx" ON "employee_salary_entry" USING btree ("user_id","plan_id");
CREATE INDEX IF NOT EXISTS "planDateIdx" ON "employee_salary_entry" USING btree ("plan_id","work_date"); 