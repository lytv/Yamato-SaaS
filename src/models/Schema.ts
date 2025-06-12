import {
  bigint,
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    stripeSubscriptionCurrentPeriodEnd: bigint(
      'stripe_subscription_current_period_end',
      { mode: 'number' },
    ),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(
        table.stripeCustomerId,
      ),
    };
  },
);

export const todoSchema = pgTable('todo', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const productSchema = pgTable('product', {
  id: serial('id').primaryKey(), // STT - Số thứ tự tự động tăng
  ownerId: text('owner_id').notNull(), // Chủ sở hữu
  productCode: text('product_code').notNull(), // Mã Hàng
  productName: text('product_name').notNull(), // Tên Hàng
  notes: text('notes'), // Ghi Chú (có thể để trống)
  category: text('category'), // Phân Nhóm (có thể để trống)
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    // Index để tìm kiếm nhanh theo mã hàng và owner
    productCodeOwnerIdx: uniqueIndex('product_code_owner_idx').on(
      table.productCode,
      table.ownerId,
    ),
  };
});

export const productionStepSchema = pgTable('production_step', {
  id: serial('id').primaryKey(), // STT - Auto-incrementing
  ownerId: text('owner_id').notNull(), // Multi-tenancy
  stepCode: text('step_code').notNull(), // Mã Công Đoạn
  stepName: text('step_name').notNull(), // Tên Công Đoạn
  filmSequence: text('film_sequence'), // Phim Tát - optional
  stepGroup: text('step_group'), // Phân Nhóm - optional
  notes: text('notes'), // Ghi chú - optional
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    stepCodeOwnerIdx: uniqueIndex('step_code_owner_idx').on(
      table.stepCode,
      table.ownerId,
    ),
  };
});

export const productionStepDetailSchema = pgTable('production_step_detail', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(), // Multi-tenancy

  // Foreign Key Relationships
  productId: integer('product_id')
    .references(() => productSchema.id, { onDelete: 'cascade' })
    .notNull(),
  productionStepId: integer('production_step_id')
    .references(() => productionStepSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Workflow Management
  sequenceNumber: integer('sequence_number').notNull(), // Order of steps (stt)

  // Pricing Information
  factoryPrice: decimal('factory_price', { precision: 10, scale: 2 }), // don_gia_xuong
  calculatedPrice: decimal('calculated_price', { precision: 10, scale: 2 }), // don_gia_ve_tinh

  // Capacity Limits
  quantityLimit1: integer('quantity_limit_1'), // so_luong_gio_han_01
  quantityLimit2: integer('quantity_limit_2'), // so_luong_gio_han_02

  // Special Step Flags
  isFinalStep: boolean('is_final_step').default(false), // cong_doan_cuoi
  isVtStep: boolean('is_vt_step').default(false), // cong_doan_vt
  isParkingStep: boolean('is_parking_step').default(false), // cong_doan_parking

  // Standard Timestamps
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, table => ({
  // Unique constraint: One product can have one specific production step only once
  productStepOwnerIdx: uniqueIndex('product_step_owner_idx').on(
    table.productId,
    table.productionStepId,
    table.ownerId,
  ),

  // Index for efficient sequence-based queries
  productSequenceIdx: index('product_sequence_idx').on(
    table.productId,
    table.sequenceNumber,
  ),
}));
