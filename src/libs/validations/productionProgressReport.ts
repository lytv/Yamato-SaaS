/**
 * Production Progress Report Validation Schemas
 * Following TypeScript Type Safety Standards and TDD practices
 * Based on sp_production_progress_report stored procedure
 */

import { z } from 'zod';

import type {
  ProductionProgressReportFilters,
  ProductionProgressReportItem,
  ProductionProgressReportSummary,
} from '@/types/productionProgressReport';

// ✅ Base validation schemas for stored procedure results
export const ProductionProgressReportItemSchema = z.object({
  report_type: z.enum(['EMPLOYEE_SUMMARY', 'OUTSOURCE_DETAIL'], {
    required_error: 'Report type is required',
    invalid_type_error: 'Report type must be either EMPLOYEE_SUMMARY or OUTSOURCE_DETAIL',
  }),
  entity_id: z.string().min(1, 'Entity ID cannot be empty'),
  entity_name: z.string().min(1, 'Entity name cannot be empty'),
  plan_code: z.string().min(1, 'Plan code cannot be empty'),
  product_code: z.string().min(1, 'Product code cannot be empty'),
  product_name: z.string().min(1, 'Product name cannot be empty'),
  step_code: z.string().min(1, 'Step code cannot be empty'),
  step_name: z.string().min(1, 'Step name cannot be empty'),
  total_planned: z.number().int().min(0, 'Total planned must be non-negative'),
  total_actual: z.number().int().min(0, 'Total actual must be non-negative'),
  total_assigned: z.number().int().min(0, 'Total assigned must be non-negative'),
  total_received: z.number().int().min(0, 'Total received must be non-negative'),
  total_defect: z.number().int().min(0, 'Total defect must be non-negative'),
  total_made: z.number().int().min(0, 'Total made must be non-negative'),
  completion_rate: z.number().min(0, 'Completion rate must be non-negative'),
  remaining_quantity: z.number().int('Remaining quantity must be an integer'),
});

export const ProductionProgressReportSummarySchema = z.object({
  total_records: z.number().int().min(0, 'Total records cannot be negative'),
  total_entities: z.number().int().min(0, 'Total entities cannot be negative'),
  total_planned: z.number().int().min(0, 'Total planned cannot be negative'),
  total_actual: z.number().int().min(0, 'Total actual cannot be negative'),
  total_assigned: z.number().int().min(0, 'Total assigned cannot be negative'),
  total_received: z.number().int().min(0, 'Total received cannot be negative'),
  total_defect: z.number().int().min(0, 'Total defect cannot be negative'),
  total_made: z.number().int().min(0, 'Total made cannot be negative'),
  average_completion_rate: z.number().min(0, 'Average completion rate cannot be negative'),
  employee_count: z.number().int().min(0, 'Employee count cannot be negative'),
  outsource_count: z.number().int().min(0, 'Outsource count cannot be negative'),
});

// ✅ API request validation schemas
export const ProductionProgressReportListParamsSchema = z.object({
  search: z.string().optional(),
  plan_code: z.string().optional(),
  product_code: z.string().optional(),
  production_step_code: z.string().optional(),
  report_type: z.enum(['ALL', 'EMPLOYEE_SUMMARY', 'OUTSOURCE_DETAIL']).optional().default('ALL'),
  page: z.string().optional().transform((val) => {
    if (val === undefined || val === '') return 1;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }),
  limit: z.string().optional().transform((val) => {
    if (val === undefined || val === '') return 20;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 ? 20 : Math.min(parsed, 100);
  }),
  sortBy: z.string().optional().default('plan_code'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const ProductionProgressReportExportParamsSchema = z.object({
  search: z.string().optional(),
  plan_code: z.string().optional(),
  product_code: z.string().optional(),
  production_step_code: z.string().optional(),
  report_type: z.enum(['ALL', 'EMPLOYEE_SUMMARY', 'OUTSOURCE_DETAIL']).optional().default('ALL'),
  format: z.enum(['xlsx', 'csv']).optional().default('xlsx'),
  includeHeaders: z.boolean().optional().default(true),
  filename: z.string().optional(),
});

// ✅ Type exports for strict type checking
export type ValidatedProductionProgressReportItem = z.infer<typeof ProductionProgressReportItemSchema>;
export type ValidatedProductionProgressReportSummary = z.infer<typeof ProductionProgressReportSummarySchema>;
export type ValidatedProductionProgressReportListParams = z.infer<typeof ProductionProgressReportListParamsSchema>;
export type ValidatedProductionProgressReportExportParams = z.infer<typeof ProductionProgressReportExportParamsSchema>;

// ✅ Validation helper functions with explicit error handling
export function validateProductionProgressReportItem(row: unknown): ProductionProgressReportItem {
  try {
    return ProductionProgressReportItemSchema.parse(row);
  } catch (error) {
    throw new Error(`Invalid production progress report item: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateProductionProgressReportSummary(summary: unknown): ProductionProgressReportSummary {
  try {
    return ProductionProgressReportSummarySchema.parse(summary);
  } catch (error) {
    throw new Error(`Invalid production progress report summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateProductionProgressReportListParams(params: unknown): ValidatedProductionProgressReportListParams {
  try {
    return ProductionProgressReportListParamsSchema.parse(params);
  } catch (error) {
    throw new Error(`Invalid production progress report list parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateProductionProgressReportExportParams(params: unknown): ValidatedProductionProgressReportExportParams {
  try {
    return ProductionProgressReportExportParamsSchema.parse(params);
  } catch (error) {
    throw new Error(`Invalid production progress report export parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ✅ Additional validation helpers
export function validateReportType(type: unknown): 'EMPLOYEE_SUMMARY' | 'OUTSOURCE_DETAIL' | 'ALL' {
  const validTypes = ['EMPLOYEE_SUMMARY', 'OUTSOURCE_DETAIL', 'ALL'] as const;
  if (typeof type === 'string' && validTypes.includes(type as any)) {
    return type as 'EMPLOYEE_SUMMARY' | 'OUTSOURCE_DETAIL' | 'ALL';
  }
  return 'ALL';
}

export function validateSortField(field: unknown): keyof ProductionProgressReportItem {
  const validFields: (keyof ProductionProgressReportItem)[] = [
    'report_type',
    'entity_name',
    'plan_code',
    'product_code',
    'step_code',
    'total_planned',
    'total_actual',
    'total_assigned',
    'total_received',
    'total_defect',
    'total_made',
    'completion_rate',
    'remaining_quantity',
  ];
  
  if (typeof field === 'string' && validFields.includes(field as keyof ProductionProgressReportItem)) {
    return field as keyof ProductionProgressReportItem;
  }
  return 'plan_code';
}

export function validateSortOrder(order: unknown): 'asc' | 'desc' {
  if (order === 'desc') return 'desc';
  return 'asc';
}

// ✅ Filter validation for form inputs
export function validateProductionProgressReportFilters(filters: unknown): ProductionProgressReportFilters {
  try {
    const schema = z.object({
      search: z.string().optional(),
      plan_code: z.string().optional(),
      product_code: z.string().optional(),
      production_step_code: z.string().optional(),
      report_type: z.enum(['ALL', 'EMPLOYEE_SUMMARY', 'OUTSOURCE_DETAIL']).optional(),
      page: z.number().int().min(1).optional(),
      limit: z.number().int().min(1).max(100).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    });

    return schema.parse(filters);
  } catch (error) {
    throw new Error(`Invalid production progress report filters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ✅ Completion rate validation and categorization
export function validateCompletionRate(rate: number): {
  value: number;
  category: 'excellent' | 'good' | 'average' | 'poor';
} {
  const validatedRate = Math.max(0, rate);
  
  let category: 'excellent' | 'good' | 'average' | 'poor';
  if (validatedRate >= 100) {
    category = 'excellent';
  } else if (validatedRate >= 80) {
    category = 'good';
  } else if (validatedRate >= 50) {
    category = 'average';
  } else {
    category = 'poor';
  }

  return {
    value: Math.round(validatedRate * 100) / 100,
    category,
  };
}

// ✅ Entity ID validation (for both employees and outsource partners)
export function validateEntityId(id: unknown): string {
  if (typeof id === 'string' && id.trim().length > 0) {
    return id.trim();
  }
  throw new Error('Entity ID must be a non-empty string');
}

// ✅ Plan/Product/Step code validation
export function validateCode(code: unknown, type: 'plan' | 'product' | 'step'): string | undefined {
  if (code === null || code === undefined || code === '') {
    return undefined;
  }
  if (typeof code === 'string' && code.trim().length > 0) {
    return code.trim();
  }
  throw new Error(`${type} code must be a non-empty string or undefined`);
}