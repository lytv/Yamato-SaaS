ALTER TABLE "employee_salary_entry" ALTER COLUMN "owner_id" SET DATA TYPE varchar(50);
ALTER TABLE "employee_salary_entry" ALTER COLUMN "actual_quantity" DROP DEFAULT;
ALTER TABLE "employee_salary_entry" ALTER COLUMN "planned_quantity" DROP DEFAULT;
ALTER TABLE "employee_salary_entry" ALTER COLUMN "limit_quantity" DROP DEFAULT;
ALTER TABLE "employee_salary_entry" ALTER COLUMN "previous_entered_quantity" DROP DEFAULT;
ALTER TABLE "employee_salary_entry" ALTER COLUMN "status" DROP DEFAULT; 