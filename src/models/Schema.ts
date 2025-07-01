import {
  bigint,
  boolean,
  date,
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

export const noteSchema = pgTable('note', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category'),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const taskSchema = pgTable('task', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  taskCode: text('task_code').notNull(),
  taskName: text('task_name').notNull(),
  description: text('description'),
  priority: text('priority'),
  status: text('status'),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    // Unique index for task code per owner
    taskCodeOwnerIdx: uniqueIndex('task_code_owner_idx').on(
      table.taskCode,
      table.ownerId,
    ),
  };
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

export const workTableSchema = pgTable('work_table', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  // Table Identity
  tableCode: text('table_code').notNull(), // "1", "2", "K04", "K01"
  tableName: text('table_name'), // Display name or category
  tableDetail: text('table_detail'), // "Bàn 1", "Bàn 2"
  // Table Classification
  tableType: text('table_type'), // cutting/sewing/embroidery/packing
  tableCategory: integer('table_category'), // 1,2,3,4... (from original TABLE_NAME)
  // Capacity & Specifications
  capacityPerDay: integer('capacity_per_day'),
  capacityPerHour: integer('capacity_per_hour'),
  tableSizeLength: decimal('table_size_length', { precision: 8, scale: 2 }),
  tableSizeWidth: decimal('table_size_width', { precision: 8, scale: 2 }),
  // Location & Assignment
  locationCode: text('location_code'), // Physical location
  department: text('department'), // Production department
  assignedOperator: text('assigned_operator'), // Current operator
  supervisor: text('supervisor'), // Responsible supervisor
  // Operational Status
  status: text('status').default('active'), // active/maintenance/offline/repair
  availabilitySchedule: text('availability_schedule'), // Working hours/shifts
  lastMaintenanceDate: date('last_maintenance_date'),
  nextMaintenanceDate: date('next_maintenance_date'),
  // Equipment Details
  equipmentModel: text('equipment_model'),
  installationDate: date('installation_date'),
  warrantyExpiryDate: date('warranty_expiry_date'),
  // Performance Metrics
  utilizationRate: decimal('utilization_rate', { precision: 5, scale: 2 }),
  efficiencyRating: decimal('efficiency_rating', { precision: 5, scale: 2 }),
  totalProcessedUnits: integer('total_processed_units').default(0),
  // Configuration & Notes
  specialCapabilities: text('special_capabilities'),
  limitations: text('limitations'),
  note: text('note'),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    workTableCodeOwnerIdx: uniqueIndex('work_table_code_owner_idx').on(
      table.tableCode,
      table.ownerId,
    ),
    workTableTypeIdx: index('work_table_type_idx').on(table.tableType),
    workTableStatusIdx: index('work_table_status_idx').on(table.status),
    workTableCategoryIdx: index('work_table_category_idx').on(table.tableCategory),
    workTableLocationIdx: index('work_table_location_idx').on(table.locationCode),
  };
});

export const productSubSchema = pgTable('product_sub', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),

  // Foreign Key
  productId: integer('product_id')
    .references(() => productSchema.id, { onDelete: 'cascade' })
    .notNull(),
  productCode: text('product_code').notNull(), // Redundant for performance

  // Sub-Product Identity
  productSubCode: text('product_sub_code').notNull(), // NHA_01_CM, NHA_02_CO
  productSubDetail: text('product_sub_detail').notNull(), // CÔNG MÀU, SUIREN KIMONO - TÍM

  // Classification & Categorization
  subCategory: text('sub_category').notNull(), // CM, CO
  colorCode: text('color_code'), // MÀU, BẠC, TRẮNG, TÍM, HỒNG

  // SKU & Inventory
  barcode: text('barcode'),

  // Documentation
  description: text('description'),
  note: text('note'),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    productSubCodeOwnerIdx: uniqueIndex('product_sub_code_owner_idx').on(
      table.productSubCode,
      table.ownerId,
    ),
    productSubProductIdx: index('product_sub_product_idx').on(table.productId),
    productSubCategoryIdx: index('product_sub_category_idx').on(table.subCategory),
    productSubColorIdx: index('product_sub_color_idx').on(table.colorCode),
    // Đã loại bỏ các index liên quan đến các trường bị xóa
  };
});
