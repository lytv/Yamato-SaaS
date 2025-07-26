import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ================================
// SALARY CALCULATION MANAGEMENT SYSTEM SCHEMA (from schema_salary.txt)
// ================================
import { employeeSalaryEntryRelations, employeeSalaryEntrySchema } from './Schema/employeeSalaryEntry';

export * from './Schema/outsourceOrder';

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
  retailPrice: decimal('retail_price', { precision: 10, scale: 2 }), // don_gia_ban_le

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

// ======================
// PLAN - Monthly Production Plans (T.6, T.7, T.8, T.9)
export const planSchema = pgTable('plan', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),

  // Plan Identity
  planCode: text('plan_code').notNull(), // T.6, T.7, T.8, T.9
  planName: text('plan_name').notNull(), // 06.2025, 07.2025, 08.2025, 09.2025
  planYear: integer('plan_year').notNull(), // 2025
  planMonth: integer('plan_month').notNull(), // 6, 7, 8, 9

  // Quantities & Targets
  totalTargetQuantity: integer('total_target_quantity'), // 6675, 6125
  totalActualQuantity: integer('total_actual_quantity').default(0),

  // Status & Scheduling
  status: text('status').default('draft'), // draft/active/completed/cancelled
  planStartDate: date('plan_start_date'),
  planEndDate: date('plan_end_date'),

  // Approval & Notes
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at', { mode: 'date' }),
  note: text('note'),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    planCodeOwnerIdx: uniqueIndex('plan_code_owner_idx').on(
      table.planCode,
      table.ownerId,
    ),
    planMonthYearIdx: index('plan_month_year_idx').on(
      table.planYear,
      table.planMonth,
    ),
    planStatusIdx: index('plan_status_idx').on(table.status),

    // Check constraints
    planMonthValidCheck: check('plan_month_valid', sql`plan_month >= 1 AND plan_month <= 12`),
  };
});

// ======================
// PLAN_DETAIL - Location-based Production Allocation
export const planDetailSchema = pgTable('plan_detail', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),

  // Foreign Keys
  planId: integer('plan_id')
    .references(() => planSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Location & Resource Allocation
  locationCode: text('location_code').notNull(), // K04, K01, K31 or 2, 7, 4, 10, 5
  locationType: text('location_type'), // alpha/numeric

  // Product Reference
  productCode: text('product_code').notNull(), // NHA01, NHA02A
  productSubCode: text('product_sub_code').notNull(), // NHA_01_CM, NHA_02_CO

  // Quantity Planning
  plannedQuantity: integer('planned_quantity').notNull(),
  actualQuantity: integer('actual_quantity').default(0),

  // Scheduling
  plannedStartDate: date('planned_start_date'),
  plannedEndDate: date('planned_end_date'),
  actualStartDate: date('actual_start_date'),
  actualEndDate: date('actual_end_date'),

  // Status & Priority
  status: text('status').default('planned'), // planned/in_progress/completed/cancelled
  priority: integer('priority').default(5), // 1=highest, 10=lowest
  note: text('note'),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    planDetailUniqueIdx: uniqueIndex('plan_detail_unique_idx').on(
      table.planId,
      table.locationCode,
      table.productSubCode,
      table.ownerId,
    ),
    planDetailLocationIdx: index('plan_detail_location_idx').on(table.locationCode),
    planDetailProductIdx: index('plan_detail_product_idx').on(table.productCode),
    planDetailStatusIdx: index('plan_detail_status_idx').on(table.status),
  };
});

export const processSchema = pgTable('process', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),

  // Process Identity
  processCode: text('process_code').notNull(), // CAT, MAY, THEU, DONG_GOI
  processName: text('process_name').notNull(), // Cắt, May, Thêu, Đóng gói

  // Process Classification
  processCategory: text('process_category'), // production/quality/packaging
  processType: text('process_type'), // manual/machine/hybrid
  department: text('department'), // Department responsible

  // Documentation
  description: text('description'),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    processCodeOwnerIdx: uniqueIndex('process_code_owner_idx').on(
      table.processCode,
      table.ownerId,
    ),
    processCategoryIdx: index('process_category_idx').on(table.processCategory),
  };
});

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

export const userSyncSchema = pgTable('user_sync', {
  userId: text('user_id').primaryKey(), // ID từ Clerk
  ownerId: text('owner_id').notNull(), // Multi-tenancy
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  role: text('role').default('member'), // Vai trò của user (admin, member, viewer, ...)
  organizationRole: text('organization_role'), // Vai trò trong tổ chức (nếu có)
  shortcut: text('shortcut'),
  isActive: boolean('is_active').default(true), // Trạng thái hoạt động
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const outsourceOrderSchema = pgTable('outsource_order', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(), // Multi-tenancy

  // Order Identity
  orderCode: text('order_code').notNull(), // GGC001, GGC002 (Giao Gia Công)
  orderTitle: text('order_title'), // Tiêu đề phiếu (optional)

  // People Involved
  createdByUserId: text('created_by_user_id').notNull(), // Người lập phiếu (current user)
  assignedToUserId: text('assigned_to_user_id').notNull(), // Người nhận phiếu (from user_sync)

  // Dates
  orderDate: date('order_date').notNull(), // Ngày giao phiếu (default today)
  expectedCompletionDate: date('expected_completion_date'), // Ngày dự kiến hoàn thành tổng thể
  actualCompletionDate: date('actual_completion_date'), // Ngày hoàn thành thực tế

  // Status & Management
  status: text('status').default('draft'), // draft/sent/in_progress/completed/cancelled
  priority: integer('priority').default(5), // 1=highest, 10=lowest

  // Financial (optional)
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }), // Tổng giá trị
  currency: text('currency').default('VND'), // Đơn vị tiền tệ

  // Documentation
  notes: text('notes'), // Ghi chú
  attachment: text('attachment'), // Link file đính kèm
  
  // Pricing Configuration
  applyRetailPrice: integer('apply_retail_price').notNull().default(2), // 2=normal price, 3=retail price

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    orderCodeOwnerIdx: uniqueIndex('order_code_owner_idx').on(
      table.orderCode,
      table.ownerId,
    ),
    statusIdx: index('outsource_order_status_idx').on(table.status),
    assignedUserIdx: index('outsource_order_assigned_user_idx').on(table.assignedToUserId),
    orderDateIdx: index('outsource_order_date_idx').on(table.orderDate),
    createdByUserIdx: index('outsource_order_created_by_idx').on(table.createdByUserId),
  };
});

export const outsourceOrderRelations = relations(outsourceOrderSchema, ({ one }) => ({
  createdByUser: one(userSyncSchema, {
    fields: [outsourceOrderSchema.createdByUserId],
    references: [userSyncSchema.userId],
  }),
  assignedToUser: one(userSyncSchema, {
    fields: [outsourceOrderSchema.assignedToUserId],
    references: [userSyncSchema.userId],
  }),
}));

export const outsourceOrderDetailSchema = pgTable('outsource_order_detail', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  outsourceOrderId: integer('outsource_order_id')
    .references(() => outsourceOrderSchema.id, { onDelete: 'cascade' })
    .notNull(),
  planId: integer('plan_id')
    .references(() => planSchema.id, { onDelete: 'restrict' })
    .notNull(),
  productId: integer('product_id')
    .references(() => productSchema.id, { onDelete: 'restrict' })
    .notNull(),
  productionStepId: integer('production_step_id')
    .references(() => productionStepSchema.id, { onDelete: 'restrict' })
    .notNull(),
  planCode: text('plan_code').notNull(),
  planName: text('plan_name').notNull(),
  productCode: text('product_code').notNull(),
  productName: text('product_name').notNull(),
  stepCode: text('step_code').notNull(),
  stepName: text('step_name').notNull(),
  orderedQuantity: integer('ordered_quantity').notNull(),
  completedQuantity: integer('completed_quantity').default(0),
  expectedCompletionDate: date('expected_completion_date').notNull(),
  actualCompletionDate: date('actual_completion_date'),
  status: text('status').default('pending'),
  sequenceNumber: integer('sequence_number'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }),
  itemNotes: text('item_notes'),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    orderDetailOrderIdx: index('outsource_order_detail_order_idx').on(table.outsourceOrderId),
    orderDetailPlanIdx: index('outsource_order_detail_plan_idx').on(table.planId),
    orderDetailProductIdx: index('outsource_order_detail_product_idx').on(table.productId),
    orderDetailStepIdx: index('outsource_order_detail_step_idx').on(table.productionStepId),
    orderDetailStatusIdx: index('outsource_order_detail_status_idx').on(table.status),
  };
});

// ======================
// EMPLOYEE_SALARY_ENTRY - Bảng nhập lương theo sản lượng nhân viên
// ======================
export { employeeSalaryEntryRelations, employeeSalaryEntrySchema };

// ======================
// OUTSOURCE_ORDER_RECEIPT - Biên nhận từng lần nhận lại của outsource order detail
// ======================
export const outsourceOrderReceiptSchema = pgTable('outsource_order_receipt', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(), // Multi-tenancy

  // Foreign Key to Order Detail
  outsourceOrderDetailId: integer('outsource_order_detail_id')
    .references(() => outsourceOrderDetailSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Receipt Identity
  receiptNumber: text('receipt_number').notNull(), // REC001, REC002... (auto-generated)
  receiptTitle: text('receipt_title'), // Tiêu đề phiếu nhận (optional)

  // Receipt Information
  receiptQuantity: integer('receipt_quantity').notNull(), // Số lượng nhận lại trong lần này
  receiptDate: date('receipt_date').notNull(), // Ngày nhận lại
  plannedReceiptDate: date('planned_receipt_date'), // Ngày dự kiến nhận (nếu có)

  // Quality Control
  qualityStatus: text('quality_status').default('pending'), // pending/passed/failed/partial/needs_rework
  qualityScore: integer('quality_score'), // Điểm chất lượng 1-10
  defectQuantity: integer('defect_quantity').default(0), // Số lượng lỗi
  reworkQuantity: integer('rework_quantity').default(0), // Số lượng cần làm lại
  qualityNotes: text('quality_notes'), // Ghi chú về chất lượng

  // People Involved
  receivedByUserId: text('received_by_user_id').notNull(), // Người nhận lại (from user_sync)
  inspectedByUserId: text('inspected_by_user_id'), // Người kiểm tra chất lượng
  deliveredByUserId: text('delivered_by_user_id'), // Người giao hàng (contractor)

  // Location & Storage
  batchNumber: text('batch_number'), // Số lô/batch
  storageLocation: text('storage_location'), // Vị trí lưu kho
  warehouseCode: text('warehouse_code'), // Mã kho

  // Financial (if needed)
  actualUnitCost: decimal('actual_unit_cost', { precision: 10, scale: 2 }), // Đơn giá thực tế
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }), // Tổng chi phí cho lần nhận này

  // Documentation
  notes: text('notes'), // Ghi chú chung
  attachments: text('attachments'), // Link file đính kèm (ảnh, PDF)

  // Status & Workflow
  status: text('status').default('received'), // received/inspected/stored/processed
  isPartialReceipt: boolean('is_partial_receipt').default(true), // Nhận một phần hay toàn bộ

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => {
  return {
    // Indexes for performance
    receiptDetailIdx: index('receipt_detail_idx').on(table.outsourceOrderDetailId),
    receiptDateIdx: index('receipt_date_idx').on(table.receiptDate),
    receiptNumberOwnerIdx: uniqueIndex('receipt_number_owner_idx').on(
      table.receiptNumber,
      table.ownerId,
    ),
    receiptUserIdx: index('receipt_user_idx').on(table.receivedByUserId),
    receiptQualityIdx: index('receipt_quality_idx').on(table.qualityStatus),
    receiptStatusIdx: index('receipt_status_idx').on(table.status),
    receiptBatchIdx: index('receipt_batch_idx').on(table.batchNumber),

    // Check constraints
    receiptQuantityValidCheck: check('receipt_quantity_valid', sql`receipt_quantity > 0`),
    defectQuantityValidCheck: check('defect_quantity_valid', sql`defect_quantity >= 0 AND defect_quantity <= receipt_quantity`),
    reworkQuantityValidCheck: check('rework_quantity_valid', sql`rework_quantity >= 0 AND rework_quantity <= receipt_quantity`),
    qualityScoreValidCheck: check('quality_score_valid', sql`quality_score IS NULL OR (quality_score >= 1 AND quality_score <= 10)`),
  };
});

// Relations for outsourceOrderReceiptSchema
export const outsourceOrderReceiptRelations = relations(outsourceOrderReceiptSchema, ({ one }) => ({
  outsourceOrderDetail: one(outsourceOrderDetailSchema, {
    fields: [outsourceOrderReceiptSchema.outsourceOrderDetailId],
    references: [outsourceOrderDetailSchema.id],
  }),
  receivedByUser: one(userSyncSchema, {
    fields: [outsourceOrderReceiptSchema.receivedByUserId],
    references: [userSyncSchema.userId],
  }),
  inspectedByUser: one(userSyncSchema, {
    fields: [outsourceOrderReceiptSchema.inspectedByUserId],
    references: [userSyncSchema.userId],
  }),
  deliveredByUser: one(userSyncSchema, {
    fields: [outsourceOrderReceiptSchema.deliveredByUserId],
    references: [userSyncSchema.userId],
  }),
}));

// Calculation Batches - Bảng chủ quản lý các đợt tính toán lương
export const calculationBatches = pgTable('calculation_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  defaultStartDate: timestamp('default_start_date', { withTimezone: true }).notNull(),
  defaultEndDate: timestamp('default_end_date', { withTimezone: true }).notNull(),
  status: text('status', {
    enum: ['draft', 'calculating', 'calculated', 'finalized', 'cancelled'],
  }).notNull().default('draft'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  finalizedBy: uuid('finalized_by'),
  totalUsers: integer('total_users').default(0),
  totalEmployeeSalary: decimal('total_employee_salary', { precision: 15, scale: 2 }).default('0'),
  totalOutsourceAmount: decimal('total_outsource_amount', { precision: 15, scale: 2 }).default('0'),
  grandTotal: decimal('grand_total', { precision: 15, scale: 2 }).default('0'),
  autoCalculateOnCreate: boolean('auto_calculate_on_create').default(false),
  allowUserPeriodOverride: boolean('allow_user_period_override').default(true),
  incrementalMode: boolean('incremental_mode').default(false),
  lastFullCalculation: timestamp('last_full_calculation', { withTimezone: true }),
  affectedUsersCount: integer('affected_users_count').default(0),
  notes: text('notes'),
  metadata: jsonb('metadata'),
}, table => ({
  nameIdx: index('calc_batches_name_idx').on(table.name),
  statusIdx: index('calc_batches_status_idx').on(table.status),
  dateRangeIdx: index('calc_batches_date_range_idx').on(table.defaultStartDate, table.defaultEndDate),
  createdByIdx: index('calc_batches_created_by_idx').on(table.createdBy),
}));

// User Calculation Periods - Quản lý thời gian tính toán riêng cho từng user
export const userCalculationPeriods = pgTable('user_calculation_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').notNull().references(() => calculationBatches.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  customStartDate: timestamp('custom_start_date', { withTimezone: true }),
  customEndDate: timestamp('custom_end_date', { withTimezone: true }),
  status: text('status', {
    enum: ['pending', 'calculating', 'calculated', 'excluded', 'error'],
  }).notNull().default('pending'),
  isCustomPeriod: boolean('is_custom_period').notNull().default(false),
  excludeFromCalculation: boolean('exclude_from_calculation').notNull().default(false),
  calculationProgress: integer('calculation_progress').default(0),
  lastErrorMessage: text('last_error_message'),
  retryCount: integer('retry_count').default(0),
  estimatedCompletionTime: timestamp('estimated_completion_time', { withTimezone: true }),
  notes: text('notes'),
  reasonForCustomPeriod: text('reason_for_custom_period'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  lastCalculatedAt: timestamp('last_calculated_at', { withTimezone: true }),
  calculationError: text('calculation_error'),
}, table => ({
  batchUserIdx: index('user_calc_periods_batch_user_idx').on(table.batchId, table.userId),
  batchIdx: index('user_calc_periods_batch_idx').on(table.batchId),
  userIdx: index('user_calc_periods_user_idx').on(table.userId),
  statusIdx: index('user_calc_periods_status_idx').on(table.status),
  uniqueBatchUser: index('user_calc_periods_unique_batch_user').on(table.batchId, table.userId),
}));

// Calculation Results - Lưu kết quả tính toán cho từng user trong mỗi batch
export const calculationResults = pgTable('calculation_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').notNull().references(() => calculationBatches.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  employeeSalaryTotal: decimal('employee_salary_total', { precision: 15, scale: 2 }).notNull().default('0'),
  outsourceTotal: decimal('outsource_total', { precision: 15, scale: 2 }).notNull().default('0'),
  grandTotal: decimal('grand_total', { precision: 15, scale: 2 }).notNull().default('0'),
  actualStartDate: timestamp('actual_start_date', { withTimezone: true }).notNull(),
  actualEndDate: timestamp('actual_end_date', { withTimezone: true }).notNull(),
  totalProductionSteps: integer('total_production_steps').default(0),
  totalEmployeeEntries: integer('total_employee_entries').default(0),
  totalOutsourceEntries: integer('total_outsource_entries').default(0),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  calculationDurationMs: integer('calculation_duration_ms'),
  hasValidationErrors: boolean('has_validation_errors').default(false),
  validationErrors: jsonb('validation_errors'),
  sourceDataHash: text('source_data_hash'),
  sourceDataVersion: text('source_data_version'),
  dataChangeDetectionEnabled: boolean('data_change_detection_enabled').default(true),
  dataHash: text('data_hash'),
  notes: text('notes'),
}, table => ({
  batchUserIdx: index('calc_results_batch_user_idx').on(table.batchId, table.userId),
  batchIdx: index('calc_results_batch_idx').on(table.batchId),
  userIdx: index('calc_results_user_idx').on(table.userId),
  calculatedAtIdx: index('calc_results_calculated_at_idx').on(table.calculatedAt),
  uniqueBatchUserResult: index('calc_results_unique_batch_user').on(table.batchId, table.userId),
}));

// Calculation Details - Chi tiết breakdown của calculation results
export const calculationDetails = pgTable('calculation_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  resultId: uuid('result_id').notNull().references(() => calculationResults.id, { onDelete: 'cascade' }),
  productionStepId: uuid('production_step_id').notNull(),
  employeeSalaryQuantity: decimal('employee_salary_quantity', { precision: 15, scale: 4 }).default('0'),
  employeeSalaryUnitPrice: decimal('employee_salary_unit_price', { precision: 15, scale: 4 }).default('0'),
  employeeSalaryAmount: decimal('employee_salary_amount', { precision: 15, scale: 2 }).default('0'),
  outsourceQuantity: decimal('outsource_quantity', { precision: 15, scale: 4 }).default('0'),
  outsourceUnitPrice: decimal('outsource_unit_price', { precision: 15, scale: 4 }).default('0'),
  outsourceAmount: decimal('outsource_amount', { precision: 15, scale: 2 }).default('0'),
  stepName: text('step_name'),
  stepDescription: text('step_description'),
  sourceEmployeeEntryIds: jsonb('source_employee_entry_ids'),
  sourceOutsourceReceiptIds: jsonb('source_outsource_receipt_ids'),
  dataVolumeProcessed: integer('data_volume_processed'),
  calculationComplexityScore: integer('calculation_complexity_score'),
  optimizationSuggestions: jsonb('optimization_suggestions'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  resultIdx: index('calc_details_result_idx').on(table.resultId),
  stepIdx: index('calc_details_step_idx').on(table.productionStepId),
  resultStepIdx: index('calc_details_result_step_idx').on(table.resultId, table.productionStepId),
}));

// Calculation Audit Log - Log mọi thao tác quan trọng
export const calculationAuditLog = pgTable('calculation_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id'),
  userId: uuid('user_id'),
  performedBy: uuid('performed_by').notNull(),
  action: text('action', {
    enum: [
      'batch_created',
      'batch_updated',
      'batch_deleted',
      'batch_calculation_started',
      'batch_calculation_completed',
      'batch_calculation_failed',
      'batch_finalized',
      'batch_cancelled',
      'user_period_created',
      'user_period_updated',
      'user_period_deleted',
      'result_calculated',
      'result_updated',
      'result_deleted',
      'system_maintenance',
      'data_migration',
    ],
  }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  description: text('description'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  requestId: text('request_id'),
  metadata: jsonb('metadata'),
}, table => ({
  timestampIdx: index('calc_audit_timestamp_idx').on(table.timestamp),
  batchIdx: index('calc_audit_batch_idx').on(table.batchId),
  userIdx: index('calc_audit_user_idx').on(table.userId),
  performedByIdx: index('calc_audit_performed_by_idx').on(table.performedBy),
  actionIdx: index('calc_audit_action_idx').on(table.action),
}));

// Batch Templates - Template cho tạo batch nhanh
export const batchTemplates = pgTable('batch_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  namingPattern: text('naming_pattern').notNull(),
  defaultPeriodDays: integer('default_period_days').default(30),
  autoCalculateOnCreate: boolean('auto_calculate_on_create').default(false),
  allowUserPeriodOverride: boolean('allow_user_period_override').default(true),
  defaultMetadata: jsonb('default_metadata'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
}, table => ({
  nameIdx: index('batch_templates_name_idx').on(table.name),
  createdByIdx: index('batch_templates_created_by_idx').on(table.createdBy),
}));

// Calculation Notifications - Hệ thống thông báo (ENHANCEMENT)
export const calculationNotifications = pgTable('calculation_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => calculationBatches.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  notificationType: text('notification_type', {
    enum: ['email', 'sms', 'in_app', 'system'],
  }).notNull(),
  priority: text('priority', {
    enum: ['low', 'medium', 'high', 'critical'],
  }).notNull().default('medium'),
  subject: text('subject'),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  status: text('status', {
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
  }).notNull().default('pending'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  failureReason: text('failure_reason'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
}, table => ({
  batchIdx: index('calc_notifications_batch_idx').on(table.batchId),
  userIdx: index('calc_notifications_user_idx').on(table.userId),
  statusIdx: index('calc_notifications_status_idx').on(table.status),
  typeIdx: index('calc_notifications_type_idx').on(table.notificationType),
  scheduledAtIdx: index('calc_notifications_scheduled_at_idx').on(table.scheduledAt),
}));

// ================================
// RELATIONSHIPS for Salary Calculation
// ================================

export const calculationBatchesRelations = relations(calculationBatches, ({ many }) => ({
  userPeriods: many(userCalculationPeriods),
  results: many(calculationResults),
  auditLogs: many(calculationAuditLog),
  notifications: many(calculationNotifications),
}));

export const userCalculationPeriodsRelations = relations(userCalculationPeriods, ({ one }) => ({
  batch: one(calculationBatches, {
    fields: [userCalculationPeriods.batchId],
    references: [calculationBatches.id],
  }),
}));

export const calculationResultsRelations = relations(calculationResults, ({ one, many }) => ({
  batch: one(calculationBatches, {
    fields: [calculationResults.batchId],
    references: [calculationBatches.id],
  }),
  details: many(calculationDetails),
}));

export const calculationDetailsRelations = relations(calculationDetails, ({ one }) => ({
  result: one(calculationResults, {
    fields: [calculationDetails.resultId],
    references: [calculationResults.id],
  }),
}));

export const calculationAuditLogRelations = relations(calculationAuditLog, ({ one }) => ({
  batch: one(calculationBatches, {
    fields: [calculationAuditLog.batchId],
    references: [calculationBatches.id],
  }),
}));

export const calculationNotificationsRelations = relations(calculationNotifications, ({ one }) => ({
  batch: one(calculationBatches, {
    fields: [calculationNotifications.batchId],
    references: [calculationBatches.id],
  }),
}));
