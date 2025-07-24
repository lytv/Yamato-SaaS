/**
 * Employee Delivery Receipt Inventory Validation Schemas
 * Following TypeScript Type Safety Standards and TDD implementation
 * Enhanced with 400 fix for null/undefined handling
 */

import { z } from 'zod';

// ✅ CRITICAL: Handle null/undefined like 400 fix pattern
export const employeeDeliveryReceiptInventoryListParamsSchema = z.object({
  // ✅ Robust page validation (from 400 fix - uses Number.isNaN not isNaN)
  page: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val: string | number | undefined | null) => {
      if (val === undefined || val === null) {
        return 1;
      }
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) || num < 1 ? 1 : num; // ✅ Handle page < 1
    })
    .pipe(z.number().int().min(1, 'Page must be at least 1')),

  // ✅ Robust limit validation with proper bounds
  limit: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val: string | number | undefined | null) => {
      if (val === undefined || val === null) {
        return 20;
      }
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 20 : Math.min(Math.max(num, 1), 100);
    })
    .pipe(z.number().int().min(1).max(100)),

  // ✅ Search validation with sanitization
  search: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),

  // ✅ Plan code validation
  plan_code: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(50).optional()),

  // ✅ Product code validation
  product_code: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(50).optional()),

  // ✅ Production step code validation
  production_step_code: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(50).optional()),

  // ✅ Employee ID validation
  employee_id: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(100).optional()),

  // ✅ Sort validation with strict types and defaults
  sortBy: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => {
      const validSortFields = [
        'employee_id',
        'employee_name',
        'plan_code',
        'product_code',
        'product_name',
        'step_code',
        'step_name',
        'total_assigned',
        'total_received',
        'total_defect',
        'total_rework',
        'current_inventory',
        'completion_rate',
      ];
      return val && validSortFields.includes(val) ? val : 'employee_name';
    }),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'asc',
    ),
});

// ✅ Export parameters validation schema
export const employeeDeliveryReceiptInventoryExportParamsSchema = z.object({
  // ✅ Same search validation as list params
  search: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),

  // ✅ Same filter validations as list params
  plan_code: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(50).optional()),

  product_code: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(50).optional()),

  production_step_code: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(50).optional()),

  employee_id: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(100).optional()),

  // ✅ Same sort validation as list params
  sortBy: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => {
      const validSortFields = [
        'employee_id',
        'employee_name',
        'plan_code',
        'product_code',
        'product_name',
        'step_code',
        'step_name',
        'total_assigned',
        'total_received',
        'total_defect',
        'total_rework',
        'current_inventory',
        'completion_rate',
      ];
      return val && validSortFields.includes(val) ? val : 'employee_name';
    }),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'asc',
    ),

  // ✅ Export format validation
  format: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['xlsx', 'csv'].includes(val) ? val : 'xlsx',
    ),

  // ✅ Include headers option
  includeHeaders: z.boolean().optional().default(true),

  // ✅ Custom filename validation
  filename: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),
});

// ✅ Stored procedure result validation schema
export const employeeDeliveryReceiptInventoryItemSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID cannot be empty'),
  employee_name: z.string().min(1, 'Employee name cannot be empty'),
  plan_code: z.string().min(1, 'Plan code cannot be empty'),
  product_code: z.string().min(1, 'Product code cannot be empty'),
  product_name: z.string().min(1, 'Product name cannot be empty'),
  step_code: z.string().min(1, 'Step code cannot be empty'),
  step_name: z.string().min(1, 'Step name cannot be empty'),
  total_assigned: z.number().int().min(0, 'Total assigned must be non-negative'),
  total_received: z.number().int().min(0, 'Total received must be non-negative'),
  total_defect: z.number().int().min(0, 'Total defect must be non-negative'),
  total_rework: z.number().int().min(0, 'Total rework must be non-negative'),
  current_inventory: z.number().int(), // Can be negative
  completion_rate: z.number().min(0, 'Completion rate must be non-negative'),
});

// ✅ Summary statistics validation schema
export const employeeDeliveryReceiptInventorySummarySchema = z.object({
  total_records: z.number().int().min(0, 'Total records must be non-negative'),
  total_employees: z.number().int().min(0, 'Total employees must be non-negative'),
  total_assigned: z.number().int().min(0, 'Total assigned must be non-negative'),
  total_received: z.number().int().min(0, 'Total received must be non-negative'),
  total_defect: z.number().int().min(0, 'Total defect must be non-negative'),
  total_rework: z.number().int().min(0, 'Total rework must be non-negative'),
  total_inventory: z.number().int(), // Can be negative
  average_completion_rate: z.number().min(0, 'Average completion rate must be non-negative'),
});

// ✅ Pagination validation schema
export const employeeDeliveryReceiptInventoryPaginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1'),
  limit: z.number().int().min(1).max(100, 'Limit must be between 1 and 100'),
  total: z.number().int().min(0, 'Total must be non-negative'),
  hasMore: z.boolean(),
});

// ✅ Filter options validation schema
export const employeeDeliveryReceiptInventoryFilterOptionsSchema = z.object({
  plans: z.array(z.object({
    code: z.string().min(1, 'Plan code cannot be empty'),
    name: z.string().min(1, 'Plan name cannot be empty'),
  })),
  products: z.array(z.object({
    code: z.string().min(1, 'Product code cannot be empty'),
    name: z.string().min(1, 'Product name cannot be empty'),
  })),
  productionSteps: z.array(z.object({
    code: z.string().min(1, 'Production step code cannot be empty'),
    name: z.string().min(1, 'Production step name cannot be empty'),
  })),
  employees: z.array(z.object({
    id: z.string().min(1, 'Employee ID cannot be empty'),
    name: z.string().min(1, 'Employee name cannot be empty'),
  })),
});

// ✅ API Response validation schemas
export const employeeDeliveryReceiptInventoryResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(employeeDeliveryReceiptInventoryItemSchema),
  summary: employeeDeliveryReceiptInventorySummarySchema,
  pagination: employeeDeliveryReceiptInventoryPaginationSchema,
  message: z.string().optional(),
});

export const employeeDeliveryReceiptInventoryFilterOptionsResponseSchema = z.object({
  success: z.literal(true),
  data: employeeDeliveryReceiptInventoryFilterOptionsSchema,
  message: z.string().optional(),
});

export const employeeDeliveryReceiptInventoryExportResponseSchema = z.object({
  success: z.literal(true),
  filename: z.string().min(1, 'Filename cannot be empty'),
  downloadUrl: z.string().url('Download URL must be a valid URL'),
  recordCount: z.number().int().min(0, 'Record count must be non-negative'),
  message: z.string().optional(),
});

export const employeeDeliveryReceiptInventoryErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().min(1, 'Error message cannot be empty'),
  code: z.string().min(1, 'Error code cannot be empty'),
  details: z.unknown().optional(),
  validationErrors: z.record(z.array(z.string())).optional(),
});

// ✅ Type exports from schemas
export type EmployeeDeliveryReceiptInventoryListParams = z.infer<typeof employeeDeliveryReceiptInventoryListParamsSchema>;
export type EmployeeDeliveryReceiptInventoryExportParams = z.infer<typeof employeeDeliveryReceiptInventoryExportParamsSchema>;
export type EmployeeDeliveryReceiptInventoryItem = z.infer<typeof employeeDeliveryReceiptInventoryItemSchema>;
export type EmployeeDeliveryReceiptInventorySummary = z.infer<typeof employeeDeliveryReceiptInventorySummarySchema>;
export type EmployeeDeliveryReceiptInventoryPagination = z.infer<typeof employeeDeliveryReceiptInventoryPaginationSchema>;
export type EmployeeDeliveryReceiptInventoryFilterOptions = z.infer<typeof employeeDeliveryReceiptInventoryFilterOptionsSchema>;
export type EmployeeDeliveryReceiptInventoryResponse = z.infer<typeof employeeDeliveryReceiptInventoryResponseSchema>;
export type EmployeeDeliveryReceiptInventoryFilterOptionsResponse = z.infer<typeof employeeDeliveryReceiptInventoryFilterOptionsResponseSchema>;
export type EmployeeDeliveryReceiptInventoryExportResponse = z.infer<typeof employeeDeliveryReceiptInventoryExportResponseSchema>;
export type EmployeeDeliveryReceiptInventoryErrorResponse = z.infer<typeof employeeDeliveryReceiptInventoryErrorResponseSchema>;

// ✅ Validation helper functions following established patterns
export function validateEmployeeDeliveryReceiptInventoryListParams(data: unknown): EmployeeDeliveryReceiptInventoryListParams {
  try {
    return employeeDeliveryReceiptInventoryListParamsSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid employee delivery receipt inventory list parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateEmployeeDeliveryReceiptInventoryExportParams(data: unknown): EmployeeDeliveryReceiptInventoryExportParams {
  try {
    return employeeDeliveryReceiptInventoryExportParamsSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid employee delivery receipt inventory export parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateEmployeeDeliveryReceiptInventoryItem(data: unknown): EmployeeDeliveryReceiptInventoryItem {
  try {
    return employeeDeliveryReceiptInventoryItemSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid employee delivery receipt inventory item: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateEmployeeDeliveryReceiptInventorySummary(data: unknown): EmployeeDeliveryReceiptInventorySummary {
  try {
    return employeeDeliveryReceiptInventorySummarySchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid employee delivery receipt inventory summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateEmployeeDeliveryReceiptInventoryFilterOptions(data: unknown): EmployeeDeliveryReceiptInventoryFilterOptions {
  try {
    return employeeDeliveryReceiptInventoryFilterOptionsSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid employee delivery receipt inventory filter options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateEmployeeDeliveryReceiptInventoryResponse(data: unknown): EmployeeDeliveryReceiptInventoryResponse {
  try {
    return employeeDeliveryReceiptInventoryResponseSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid employee delivery receipt inventory response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateEmployeeDeliveryReceiptInventoryFilterOptionsResponse(data: unknown): EmployeeDeliveryReceiptInventoryFilterOptionsResponse {
  try {
    return employeeDeliveryReceiptInventoryFilterOptionsResponseSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid employee delivery receipt inventory filter options response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateEmployeeDeliveryReceiptInventoryExportResponse(data: unknown): EmployeeDeliveryReceiptInventoryExportResponse {
  try {
    return employeeDeliveryReceiptInventoryExportResponseSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid employee delivery receipt inventory export response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ✅ Stored procedure parameter validation
export const employeeDeliveryReceiptInventoryStoredProcParamsSchema = z.object({
  p_plan_code: z.union([z.string(), z.null()]).optional(),
  p_product_code: z.union([z.string(), z.null()]).optional(),
  p_production_step_code: z.union([z.string(), z.null()]).optional(),
  p_employee_id: z.union([z.string(), z.null()]).optional(),
});

export type EmployeeDeliveryReceiptInventoryStoredProcParams = z.infer<typeof employeeDeliveryReceiptInventoryStoredProcParamsSchema>;

export function validateEmployeeDeliveryReceiptInventoryStoredProcParams(data: unknown): EmployeeDeliveryReceiptInventoryStoredProcParams {
  try {
    return employeeDeliveryReceiptInventoryStoredProcParamsSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid stored procedure parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ✅ Filter state validation for React components (mutable for form handling)
export const employeeDeliveryReceiptInventoryFilterStateSchema = z.object({
  search: z.string().default(''),
  plan_code: z.string().default(''),
  product_code: z.string().default(''),
  production_step_code: z.string().default(''),
  employee_id: z.string().default(''),
  sortBy: z.string().default('employee_name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type EmployeeDeliveryReceiptInventoryFilterState = z.infer<typeof employeeDeliveryReceiptInventoryFilterStateSchema>;

export function validateEmployeeDeliveryReceiptInventoryFilterState(data: unknown): EmployeeDeliveryReceiptInventoryFilterState {
  try {
    return employeeDeliveryReceiptInventoryFilterStateSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid filter state: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
