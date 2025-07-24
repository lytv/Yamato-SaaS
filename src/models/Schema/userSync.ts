import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const userSyncSchema = pgTable('user_sync', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  fullName: varchar('full_name', { length: 100 }),
});
