import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const productionStepDetailSchema = pgTable('production_step_detail', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
});
