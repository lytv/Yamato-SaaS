/**
 * Price Summary validation schemas and functions
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Using Zod for runtime validation
 */

import { z } from 'zod';

import type {
  PriceStepData,
  PriceSummaryExportParams,
  PriceSummaryFilterOptions,
  PriceSummaryFilters,
  PriceSummaryFiltersWithOwner,
  PriceSummaryItem,
  PriceSummarySummary,
  PriceType,
} from '@/types/priceSummary';

// ✅ Price type validation
export const priceTypeSchema = z.enum(['factory_price', 'calculated_price', 'retail_price']);

// ✅ Price step data validation
export const priceStepDataSchema = z.object({
  step_code: z.string().min(1, 'Step code is required'),
  step_name: z.string().min(1, 'Step name is required'),
  sequence_number: z.number().int().min(1, 'Sequence number must be positive'),
  price: z.number().min(0, 'Price must be non-negative'),
});

// ✅ Price summary item validation
export const priceSummaryItemSchema = z.object({
  product_code: z.string().min(1, 'Product code is required'),
  product_name: z.string().min(1, 'Product name is required'),
  step_data: z.record(z.string(), priceStepDataSchema),
  total_steps: z.number().int().min(0, 'Total steps must be non-negative'),
  total_price: z.number().min(0, 'Total price must be non-negative'),
  has_pricing: z.boolean(),
});

// ✅ Filter validation
export const priceSummaryFiltersSchema = z.object({
  search: z.string().optional(),
  product_code: z.string().optional(),
  price_type: priceTypeSchema.optional(),
  show_only_with_pricing: z.boolean().optional(),
  page: z.number().int().min(1, 'Page must be at least 1').optional(),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ✅ Filters with owner validation
export const priceSummaryFiltersWithOwnerSchema = priceSummaryFiltersSchema.extend({
  ownerId: z.string().min(1, 'Owner ID is required'),
});

// ✅ Filter options validation
export const priceSummaryFilterOptionsSchema = z.object({
  products: z.array(z.object({
    code: z.string(),
    name: z.string(),
  })),
  price_types: z.array(z.object({
    value: priceTypeSchema,
    label: z.string(),
    description: z.string(),
  })),
  steps: z.array(z.object({
    code: z.string(),
    name: z.string(),
  })),
});

// ✅ Summary validation
export const priceSummarySummarySchema = z.object({
  total_records: z.number().int().min(0),
  total_products: z.number().int().min(0),
  total_steps_with_pricing: z.number().int().min(0),
  average_price_per_product: z.number().min(0),
  highest_priced_product: z.string(),
  lowest_priced_product: z.string(),
});

// ✅ Export parameters validation
export const priceSummaryExportParamsSchema = priceSummaryFiltersSchema.extend({
  format: z.enum(['xlsx', 'csv']).optional(),
  includeHeaders: z.boolean().optional(),
  filename: z.string().optional(),
});

// ✅ Validation functions
export function validatePriceSummaryItem(data: unknown): PriceSummaryItem {
  try {
    return priceSummaryItemSchema.parse(data);
  } catch (error) {
    console.error('Price summary item validation failed:', error);
    throw new Error('Invalid price summary item data');
  }
}

export function validatePriceSummaryFilters(data: unknown): PriceSummaryFilters {
  try {
    return priceSummaryFiltersSchema.parse(data);
  } catch (error) {
    console.error('Price summary filters validation failed:', error);
    throw new Error('Invalid filter parameters');
  }
}

export function validatePriceSummaryFiltersWithOwner(data: unknown): PriceSummaryFiltersWithOwner {
  try {
    return priceSummaryFiltersWithOwnerSchema.parse(data);
  } catch (error) {
    console.error('Price summary filters with owner validation failed:', error);
    throw new Error('Invalid filter parameters or missing owner ID');
  }
}

export function validatePriceSummaryFilterOptions(data: unknown): PriceSummaryFilterOptions {
  try {
    return priceSummaryFilterOptionsSchema.parse(data);
  } catch (error) {
    console.error('Price summary filter options validation failed:', error);
    throw new Error('Invalid filter options data');
  }
}

export function validatePriceSummarySummary(data: unknown): PriceSummarySummary {
  try {
    return priceSummarySummarySchema.parse(data);
  } catch (error) {
    console.error('Price summary summary validation failed:', error);
    throw new Error('Invalid summary data');
  }
}

export function validatePriceStepData(data: unknown): PriceStepData {
  try {
    return priceStepDataSchema.parse(data);
  } catch (error) {
    console.error('Price step data validation failed:', error);
    throw new Error('Invalid price step data');
  }
}

export function validatePriceType(data: unknown): PriceType {
  try {
    return priceTypeSchema.parse(data);
  } catch (error) {
    console.error('Price type validation failed:', error);
    throw new Error('Invalid price type. Must be one of: factory_price, calculated_price, retail_price');
  }
}

export function validatePriceSummaryExportParams(data: unknown): PriceSummaryExportParams {
  try {
    return priceSummaryExportParamsSchema.parse(data);
  } catch (error) {
    console.error('Price summary export params validation failed:', error);
    throw new Error('Invalid export parameters');
  }
}

// ✅ Helper validation functions
export function isValidPriceType(value: string): value is PriceType {
  return ['factory_price', 'calculated_price', 'retail_price'].includes(value);
}

export function sanitizeSearchQuery(search?: string): string | undefined {
  if (!search || typeof search !== 'string') {
    return undefined;
  }
  const sanitized = search.trim();
  return sanitized.length > 0 ? sanitized : undefined;
}

export function normalizeSortOrder(order?: string): 'asc' | 'desc' {
  return order === 'desc' ? 'desc' : 'asc';
}

export function validatePageNumber(page?: number | string): number {
  const pageNum = typeof page === 'string' ? Number.parseInt(page, 10) : page;
  return !pageNum || Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
}

export function validatePageLimit(limit?: number | string): number {
  const limitNum = typeof limit === 'string' ? Number.parseInt(limit, 10) : limit;
  if (!limitNum || Number.isNaN(limitNum) || limitNum < 1) {
    return 20;
  }
  return Math.min(limitNum, 100); // Cap at 100
}

// ✅ Error handling helpers
export function createValidationError(field: string, message: string, code = 'VALIDATION_ERROR') {
  return {
    field,
    message,
    code,
  };
}

export function formatValidationErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  errors.errors.forEach((error) => {
    const field = error.path.join('.');
    if (!formatted[field]) {
      formatted[field] = [];
    }
    formatted[field].push(error.message);
  });

  return formatted;
}

// ✅ Type guards
export function isPriceSummaryItem(value: unknown): value is PriceSummaryItem {
  try {
    priceSummaryItemSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function isPriceSummaryFilters(value: unknown): value is PriceSummaryFilters {
  try {
    priceSummaryFiltersSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}
