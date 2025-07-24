import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
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

// This file defines the enhanced structure of your database tables using the Drizzle ORM.
// Enhanced for Production Planning & Process Management System

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// ============================================================================
// EXISTING TABLES (Enhanced)
// ============================================================================

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

// Enhanced Product table with family support
export const productSchema = pgTable('product', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  productCode: text('product_code').notNull(),
  productName: text('product_name').notNull(),
  notes: text('notes'),
  category: text('category'),

  // Enhanced fields
  productFamily: text('product_family'),
  variantCount: integer('variant_count').default(0),
  status: text('status').default('active'),
  launchDate: date('launch_date'),
  discontinueDate: date('discontinue_date'),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    productCodeOwnerIdx: uniqueIndex('product_code_owner_idx').on(
      table.productCode,
      table.ownerId,
    ),
    productFamilyIdx: index('product_family_idx').on(table.productFamily),
    productStatusIdx: index('product_status_idx').on(table.status),
  };
});

export const productionStepSchema = pgTable('production_step', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  stepCode: text('step_code').notNull(),
  stepName: text('step_name').notNull(),
  filmSequence: text('film_sequence'),
  stepGroup: text('step_group'),
  notes: text('notes'),
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
  ownerId: text('owner_id').notNull(),

  productId: integer('product_id')
    .references(() => productSchema.id, { onDelete: 'cascade' })
    .notNull(),
  productionStepId: integer('production_step_id')
    .references(() => productionStepSchema.id, { onDelete: 'cascade' })
    .notNull(),

  sequenceNumber: integer('sequence_number').notNull(),
  factoryPrice: decimal('factory_price', { precision: 10, scale: 2 }),
  calculatedPrice: decimal('calculated_price', { precision: 10, scale: 2 }),
  quantityLimit1: integer('quantity_limit_1'),
  quantityLimit2: integer('quantity_limit_2'),
  isFinalStep: boolean('is_final_step').default(false),
  isVtStep: boolean('is_vt_step').default(false),
  isParkingStep: boolean('is_parking_step').default(false),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, table => ({
  productStepOwnerIdx: uniqueIndex('product_step_owner_idx').on(
    table.productId,
    table.productionStepId,
    table.ownerId,
  ),
  productSequenceIdx: index('product_sequence_idx').on(
    table.productId,
    table.sequenceNumber,
  ),
}));

// ============================================================================
// NEW TABLES - Production Planning & Process Management
// ============================================================================

// 1. PLAN - Monthly Production Plans (T.6, T.7, T.8, T.9)
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

// 2. PLAN_DETAIL - Location-based Production Allocation
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

// 3. PRODUCT_SUB - Product Variants & Sub-Products
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
  designPattern: text('design_pattern'), // CÔNG, SUIREN KIMONO
  embroideryType: text('embroidery_type'), // THÊU/KHÔNG THÊU

  // Display & Ordering
  displayOrder: integer('display_order'),
  subSequence: integer('sub_sequence'), // 01, 02, 03... (from sub_code)

  // Pricing & Costing
  basePrice: decimal('base_price', { precision: 10, scale: 2 }),
  additionalCost: decimal('additional_cost', { precision: 10, scale: 2 }),
  complexityFactor: decimal('complexity_factor', { precision: 3, scale: 2 }).default('1.0'),

  // Production Info
  productionTimeFactor: decimal('production_time_factor', { precision: 3, scale: 2 }).default('1.0'),
  requiresSpecialProcess: boolean('requires_special_process').default(false),
  specialRequirements: text('special_requirements'),

  // Status & Lifecycle
  status: text('status').default('active'), // active/discontinued/planned
  launchDate: date('launch_date'),
  discontinueDate: date('discontinue_date'),

  // SKU & Inventory
  skuCode: text('sku_code'),
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
    productSubStatusIdx: index('product_sub_status_idx').on(table.status),
    productSubSkuIdx: uniqueIndex('product_sub_sku_idx').on(table.skuCode)
      .where(sql`sku_code IS NOT NULL`),
  };
});

// 4. PROCESS - Main Production Processes (CAT, MAY, THEU, etc.)
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

  // Workflow & Sequencing
  sequenceOrder: integer('sequence_order'), // Order in production workflow
  isParallelAllowed: boolean('is_parallel_allowed').default(false),
  prerequisiteProcesses: text('prerequisite_processes').array(), // Required previous processes

  // Time & Capacity Management
  standardTimePerUnit: integer('standard_time_per_unit'), // Standard minutes per unit
  setupTime: integer('setup_time'), // Setup time in minutes
  defaultCapacityPerDay: integer('default_capacity_per_day'),

  // Quality & Standards
  qualityCheckRequired: boolean('quality_check_required').default(true),
  qualityStandards: text('quality_standards'),
  defectTolerancePercent: decimal('defect_tolerance_percent', { precision: 5, scale: 2 }),

  // Status & Configuration
  status: text('status').default('active'), // active/inactive/deprecated
  isOutsourceable: boolean('is_outsourceable').default(false),

  // Documentation
  description: text('description'),
  sopDocumentUrl: text('sop_document_url'), // Standard Operating Procedure
  trainingRequired: text('training_required'),

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
    processSequenceIdx: index('process_sequence_idx').on(table.sequenceOrder),
    processStatusIdx: index('process_status_idx').on(table.status),
    processCategoryIdx: index('process_category_idx').on(table.processCategory),
  };
});

// 5. PROCESS_SUB - Sub-Processes (CHÍNH, VẢI LÓT, etc.)
export const processSubSchema = pgTable('process_sub', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),

  // Foreign Key
  processId: integer('process_id')
    .references(() => processSchema.id, { onDelete: 'cascade' })
    .notNull(),
  processCode: text('process_code').notNull(), // Redundant for performance

  // Sub-Process Identity
  processSubCode: text('process_sub_code').notNull(), // chinh, vailot
  processSubName: text('process_sub_name').notNull(), // CHÍNH, VẢI LÓT

  // Sub-Process Classification
  subCategory: text('sub_category'), // main/auxiliary/support
  subType: text('sub_type'), // primary_material/secondary_material

  // Material & Resource Requirements
  materialType: text('material_type'), // fabric_main/fabric_lining/thread
  materialConsumptionFactor: decimal('material_consumption_factor', { precision: 8, scale: 4 }),
  toolRequirements: text('tool_requirements').array(),

  // Time & Complexity
  timeFactor: decimal('time_factor', { precision: 3, scale: 2 }).default('1.0'),
  complexityLevel: integer('complexity_level').default(1), // 1=simple, 5=complex
  skillLevelRequired: integer('skill_level_required').default(1), // 1=basic, 5=expert

  // Sequencing within Process
  subSequence: integer('sub_sequence'), // Order within parent process
  isOptional: boolean('is_optional').default(false),
  dependsOnSubCode: text('depends_on_sub_code'), // Dependency on other sub-process

  // Quality & Standards
  hasQualityCheckpoint: boolean('has_quality_checkpoint').default(false),
  qualityCriteria: text('quality_criteria'),

  // Costing Factors
  laborCostFactor: decimal('labor_cost_factor', { precision: 3, scale: 2 }).default('1.0'),
  materialCostFactor: decimal('material_cost_factor', { precision: 3, scale: 2 }).default('1.0'),
  overheadCostFactor: decimal('overhead_cost_factor', { precision: 3, scale: 2 }).default('1.0'),

  // Status & Automation
  status: text('status').default('active'),
  isAutomated: boolean('is_automated').default(false),

  // Documentation
  description: text('description'),
  specialInstructions: text('special_instructions'),
  note: text('note'),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    processSubCodeOwnerIdx: uniqueIndex('process_sub_code_owner_idx').on(
      table.processSubCode,
      table.ownerId,
    ),
    processSubProcessIdx: index('process_sub_process_idx').on(table.processId),
    processSubSequenceIdx: index('process_sub_sequence_idx').on(table.subSequence),
    processSubCategoryIdx: index('process_sub_category_idx').on(table.subCategory),
    processSubCompositeIdx: uniqueIndex('process_sub_composite_idx').on(
      table.processCode,
      table.processSubCode,
      table.ownerId,
    ),
  };
});

// 6. WORK_TABLE - Work Stations & Resources
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

// 7. PROCESS_EXECUTION - Actual Process Execution Tracking
export const processExecutionSchema = pgTable('process_execution', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),

  // Foreign Key References
  planDetailId: integer('plan_detail_id')
    .references(() => planDetailSchema.id, { onDelete: 'cascade' })
    .notNull(),
  processSubId: integer('process_sub_id')
    .references(() => processSubSchema.id, { onDelete: 'cascade' })
    .notNull(),
  workTableId: integer('work_table_id')
    .references(() => workTableSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Process Type Reference (for integration with existing system)
  processType: text('process_type').notNull(), // CAT, MAY, THEU (matches process.process_code)
  processSubName: text('process_sub_name').notNull(), // CHÍNH, VẢI LÓT (matches process_sub.process_sub_name)

  // Product Reference (redundant for performance)
  productCode: text('product_code').notNull(),
  productSubCode: text('product_sub_code').notNull(),
  productSubDetail: text('product_sub_detail'),

  // Resource Assignment
  tableNumber: text('table_number').notNull(), // Links to work_table.table_code
  operatorAssigned: text('operator_assigned'),

  // Quantity Management
  totalQuantity: integer('total_quantity'), // Total planned for this product variant
  plannedQuantity: integer('planned_quantity').notNull(), // Quantity for this specific execution
  actualQuantity: integer('actual_quantity').default(0),
  defectQuantity: integer('defect_quantity').default(0),
  reworkQuantity: integer('rework_quantity').default(0),

  // Scheduling
  plannedDate: date('planned_date'),
  actualStartDate: date('actual_start_date'),
  actualCompletionDate: date('actual_completion_date'),
  estimatedDuration: integer('estimated_duration'), // Minutes
  actualDuration: integer('actual_duration'), // Minutes

  // Status & Quality
  status: text('status').default('planned'), // planned/in_progress/completed/cancelled/on_hold
  qualityStatus: text('quality_status'), // passed/failed/pending/rework_required
  completionPercentage: decimal('completion_percentage', { precision: 5, scale: 2 }).default('0'),

  // Performance Metrics
  efficiencyRating: decimal('efficiency_rating', { precision: 3, scale: 2 }),
  qualityScore: decimal('quality_score', { precision: 3, scale: 2 }),

  // Issues & Notes
  issuesEncountered: text('issues_encountered'),
  solutionsApplied: text('solutions_applied'),
  note: text('note'),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    processExecutionPlanIdx: index('process_execution_plan_idx').on(table.planDetailId),
    processExecutionProcessIdx: index('process_execution_process_idx').on(table.processSubId),
    processExecutionTableIdx: index('process_execution_table_idx').on(table.workTableId),
    processExecutionDateIdx: index('process_execution_date_idx').on(table.plannedDate),
    processExecutionStatusIdx: index('process_execution_status_idx').on(table.status),
    processExecutionProductIdx: index('process_execution_product_idx').on(table.productSubCode),
    processExecutionTypeIdx: index('process_execution_type_idx').on(table.processType),

    // Composite index for common queries
    processExecutionCompositeIdx: index('process_execution_composite_idx').on(
      table.processType,
      table.productSubCode,
      table.plannedDate,
    ),
  };
});

// ============================================================================
// INTEGRATION HELPERS & TYPE EXPORTS
// ============================================================================

// Type exports for TypeScript
export type Organization = typeof organizationSchema.$inferSelect;
export type Todo = typeof todoSchema.$inferSelect;
export type Product = typeof productSchema.$inferSelect;
export type ProductionStep = typeof productionStepSchema.$inferSelect;
export type ProductionStepDetail = typeof productionStepDetailSchema.$inferSelect;

// New types
export type Plan = typeof planSchema.$inferSelect;
export type PlanDetail = typeof planDetailSchema.$inferSelect;
export type ProductSub = typeof productSubSchema.$inferSelect;
export type Process = typeof processSchema.$inferSelect;
export type ProcessSub = typeof processSubSchema.$inferSelect;
export type WorkTable = typeof workTableSchema.$inferSelect;
export type ProcessExecution = typeof processExecutionSchema.$inferSelect;

// Insert types
export type NewPlan = typeof planSchema.$inferInsert;
export type NewPlanDetail = typeof planDetailSchema.$inferInsert;
export type NewProductSub = typeof productSubSchema.$inferInsert;
export type NewProcess = typeof processSchema.$inferInsert;
export type NewProcessSub = typeof processSubSchema.$inferInsert;
export type NewWorkTable = typeof workTableSchema.$inferInsert;
export type NewProcessExecution = typeof processExecutionSchema.$inferInsert;
