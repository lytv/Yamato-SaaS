/**
 * Satellite Progress Validation Schemas
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Using Zod for runtime type validation
 */

import { z } from 'zod';

// ✅ Individual field validations
const productCodeValidation = z
  .string()
  .min(1, 'Product code is required')
  .max(50, 'Product code must be less than 50 characters')
  .regex(/^[\w.-]+$/, 'Product code can contain letters, numbers, dots, underscores, and hyphens');

const planCodeValidation = z
  .string()
  .min(1, 'Plan code is required')
  .max(50, 'Plan code must be less than 50 characters');

const searchValidation = z
  .string()
  .max(255, 'Search term must be less than 255 characters')
  .optional();

const paginationValidation = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

const sortValidation = z.object({
  sortBy: z.string().default('product_code'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ✅ Core satellite progress item validation
export const satelliteProgressItemSchema = z.object({
  product_code: productCodeValidation,
  product_name: z.string().min(1, 'Product name is required'),
  plan_code: planCodeValidation,
  plan_name: z.string().min(1, 'Plan name is required'),
  assigned_user_name: z.string().min(1, 'Assigned user name is required'),
  planned_quantity: z.number().int().min(0, 'Planned quantity must be non-negative'),
  total_completed: z.number().int().min(0, 'Total completed must be non-negative'),
  completion_rate: z.number().min(0).max(100, 'Completion rate must be between 0 and 100'),
}).catchall(z.union([z.string(), z.number(), z.null()]).optional());

// ✅ Filter validation schema
export const satelliteProgressFiltersSchema = z.object({
  search: searchValidation,
  plan_code: z.string().optional(),
  product_code: z.string().optional(),
  assigned_user_id: z.string().optional(),
  ...paginationValidation.shape,
  ...sortValidation.shape,
});

// ✅ Filters with owner validation
export const satelliteProgressFiltersWithOwnerSchema = satelliteProgressFiltersSchema.extend({
  ownerId: z.string().min(1, 'Owner ID is required'),
});

// ✅ Filter options validation
export const satelliteProgressFilterOptionsSchema = z.object({
  plans: z.array(z.object({
    code: z.string(),
    name: z.string(),
  })),
  products: z.array(z.object({
    code: z.string(),
    name: z.string(),
  })),
  users: z.array(z.object({
    user_id: z.string(),
    user_name: z.string(),
  })),
  steps: z.array(z.object({
    code: z.string(),
    name: z.string(),
  })),
});

// ✅ Summary statistics validation
export const satelliteProgressSummarySchema = z.object({
  total_records: z.number().int().min(0),
  total_planned: z.number().int().min(0),
  total_completed: z.number().int().min(0),
  average_completion_rate: z.number().min(0).max(100),
  users_count: z.number().int().min(0),
  plans_count: z.number().int().min(0),
});

// ✅ Pagination validation
export const satelliteProgressPaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  hasMore: z.boolean(),
});

// ✅ API response validation
export const satelliteProgressResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(satelliteProgressItemSchema),
  summary: satelliteProgressSummarySchema,
  pagination: satelliteProgressPaginationSchema,
  message: z.string().optional(),
});

export const satelliteProgressFilterOptionsResponseSchema = z.object({
  success: z.literal(true),
  data: satelliteProgressFilterOptionsSchema,
  message: z.string().optional(),
});

export const satelliteProgressErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string(),
  details: z.unknown().optional(),
  validationErrors: z.record(z.array(z.string())).optional(),
});

// ✅ Export parameters validation
export const satelliteProgressExportParamsSchema = satelliteProgressFiltersWithOwnerSchema.extend({
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  includeHeaders: z.boolean().default(true),
  filename: z.string().optional(),
});

// ✅ Export response validation
export const satelliteProgressExportResponseSchema = z.object({
  success: z.literal(true),
  filename: z.string(),
  downloadUrl: z.string().url(),
  recordCount: z.number().int().min(0),
  message: z.string().optional(),
});

// ✅ Filter state validation (for React forms)
export const satelliteProgressFilterStateSchema = z.object({
  search: z.string().default(''),
  plan_code: z.string().default(''),
  product_code: z.string().default(''),
  assigned_user_id: z.string().default(''),
  sortBy: z.string().default('product_code'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ✅ Dynamic step column validation
export const dynamicStepColumnSchema = z.object({
  stepIndex: z.number().int().min(0),
  stepCode: z.string().min(1),
  stepName: z.string().min(1),
  quantity: z.number().int().min(0),
});

// ✅ Table column configuration validation
export const satelliteProgressColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  sortable: z.boolean(),
  width: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  format: z.enum(['number', 'percentage', 'text']).optional(),
  stepIndex: z.number().int().min(0).optional(),
});

// ✅ Validation utility functions
export function validateSatelliteProgressItem(data: unknown) {
  try {
    return satelliteProgressItemSchema.parse(data);
  } catch (error) {
    console.error('Satellite progress item validation failed:', error);
    throw new Error('Invalid satellite progress item data');
  }
}

export function validateSatelliteProgressFilters(data: unknown) {
  try {
    return satelliteProgressFiltersSchema.parse(data);
  } catch (error) {
    console.error('Satellite progress filters validation failed:', error);
    throw new Error('Invalid satellite progress filters');
  }
}

export function validateSatelliteProgressFiltersWithOwner(data: unknown) {
  try {
    return satelliteProgressFiltersWithOwnerSchema.parse(data);
  } catch (error) {
    console.error('Satellite progress filters with owner validation failed:', error);
    throw new Error('Invalid satellite progress filters with owner');
  }
}

export function validateSatelliteProgressFilterOptions(data: unknown) {
  try {
    return satelliteProgressFilterOptionsSchema.parse(data);
  } catch (error) {
    console.error('Satellite progress filter options validation failed:', error);
    throw new Error('Invalid satellite progress filter options');
  }
}

export function validateSatelliteProgressSummary(data: unknown) {
  try {
    return satelliteProgressSummarySchema.parse(data);
  } catch (error) {
    console.error('Satellite progress summary validation failed:', error);
    throw new Error('Invalid satellite progress summary');
  }
}

export function validateSatelliteProgressResponse(data: unknown) {
  try {
    return satelliteProgressResponseSchema.parse(data);
  } catch (error) {
    console.error('Satellite progress response validation failed:', error);
    throw new Error('Invalid satellite progress response');
  }
}

export function validateSatelliteProgressExportParams(data: unknown) {
  try {
    return satelliteProgressExportParamsSchema.parse(data);
  } catch (error) {
    console.error('Satellite progress export params validation failed:', error);
    throw new Error('Invalid satellite progress export parameters');
  }
}

// ✅ Type guards
export function isSatelliteProgressItem(data: unknown): data is z.infer<typeof satelliteProgressItemSchema> {
  try {
    satelliteProgressItemSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isSatelliteProgressFilters(data: unknown): data is z.infer<typeof satelliteProgressFiltersSchema> {
  try {
    satelliteProgressFiltersSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

// ✅ Default values
export const DEFAULT_SATELLITE_PROGRESS_FILTERS = satelliteProgressFiltersSchema.parse({});
export const DEFAULT_SATELLITE_PROGRESS_FILTER_STATE = satelliteProgressFilterStateSchema.parse({});

// ✅ Validation error helpers
export function getSatelliteProgressValidationErrors(error: z.ZodError) {
  return error.errors.reduce((acc, err) => {
    const field = err.path.join('.');
    if (!acc[field]) {
      acc[field] = [];
    }
    acc[field].push(err.message);
    return acc;
  }, {} as Record<string, string[]>);
}

export function formatSatelliteProgressValidationError(error: z.ZodError): string {
  return error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
}
