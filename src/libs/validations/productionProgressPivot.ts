/**
 * Production Progress Pivot Validation Schemas
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 */

import { z } from 'zod';

import type {
  ProductionProgressPivotFilters,
  ProductionProgressPivotItem,
  ProductionProgressPivotSummary,
} from '@/types/productionProgressPivot';

// ✅ Helper function to create dynamic step validation schema
const createDynamicStepSchema = () => {
  const baseSchema = {
    product_code: z.string(),
    product_name: z.string(),
    plan_code: z.string(),
    plan_name: z.string(),
    planned_quantity: z.number().int().min(0),
    total_completed: z.number().int().min(0),
    completion_rate: z.number().min(0),
  };

  // Add dynamic step fields (up to 150 steps for maximum flexibility)
  for (let i = 1; i <= 150; i++) {
    (baseSchema as any)[`step_code_${i}`] = z.string().nullable();
    (baseSchema as any)[`step_name_${i}`] = z.string().nullable();
    (baseSchema as any)[`step_quantity_${i}`] = z.number().int().min(0);
  }

  return z.object(baseSchema);
};

// ✅ Validation schema for pivot item from stored procedure (now supports up to 20 dynamic steps)
export const productionProgressPivotItemSchema = createDynamicStepSchema();

// ✅ Summary validation schema
export const productionProgressPivotSummarySchema = z.object({
  total_records: z.number().int().min(0),
  total_planned: z.number().int().min(0),
  total_completed: z.number().int().min(0),
  average_completion_rate: z.number().min(0),
  products_count: z.number().int().min(0),
  plans_count: z.number().int().min(0),
});

// ✅ List parameters validation schema
export const productionProgressPivotListParamsSchema = z.object({
  search: z.string().optional(),
  product_code: z.string().optional(),
  plan_code: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform(val => (val ? Number.parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1).default(1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? Number.parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100).default(20)),
  sortBy: z.string().optional().default('product_code'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// ✅ Export parameters validation schema
export const productionProgressPivotExportParamsSchema = z.object({
  search: z.string().optional(),
  product_code: z.string().optional(),
  plan_code: z.string().optional(),
  format: z.enum(['xlsx', 'csv']).optional().default('xlsx'),
  includeHeaders: z.boolean().optional().default(true),
  filename: z.string().optional(),
});

// ✅ Validation functions with error handling
export function validateProductionProgressPivotItem(data: unknown): ProductionProgressPivotItem {
  try {
    return productionProgressPivotItemSchema.parse(data);
  } catch (error) {
    console.error('Validation error for ProductionProgressPivotItem:', error);
    throw new Error('Invalid production progress pivot item data');
  }
}

export function validateProductionProgressPivotSummary(data: unknown): ProductionProgressPivotSummary {
  try {
    return productionProgressPivotSummarySchema.parse(data);
  } catch (error) {
    console.error('Validation error for ProductionProgressPivotSummary:', error);
    throw new Error('Invalid production progress pivot summary data');
  }
}

export function validateProductionProgressPivotListParams(data: unknown): ProductionProgressPivotFilters {
  try {
    return productionProgressPivotListParamsSchema.parse(data);
  } catch (error) {
    console.error('Validation error for ProductionProgressPivotListParams:', error);
    throw error; // Re-throw to be handled by API route
  }
}

export function validateProductionProgressPivotExportParams(data: unknown) {
  try {
    return productionProgressPivotExportParamsSchema.parse(data);
  } catch (error) {
    console.error('Validation error for ProductionProgressPivotExportParams:', error);
    throw error; // Re-throw to be handled by API route
  }
}
