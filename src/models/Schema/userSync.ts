import { boolean, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const userSyncSchema = pgTable('user_sync', {
  id: serial('id').primaryKey(),
  ownerId: varchar('owner_id', { length: 50 }).notNull(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  role: varchar('role', { length: 50 }),
  organizationRole: varchar('organization_role', { length: 50 }),
  shortcut: text('shortcut'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
