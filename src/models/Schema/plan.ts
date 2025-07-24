import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const planSchema = pgTable('plan', {
  id: serial('id').primaryKey(),
  planName: varchar('plan_name', { length: 100 }),
});
