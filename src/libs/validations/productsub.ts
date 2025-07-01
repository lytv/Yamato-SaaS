/**
 * ProductSub Validation Schemas
 * Following TypeScript Type Safety Standards and TDD implementation
 * Enhanced with 400 fix for null/undefined handling
 */

import { z } from 'zod';

// ✅ CRITICAL: Handle null/undefined like 400 fix pattern
export const productsubListParamsSchema = z.object({
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
        return 10;
      }
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 10 : Math.min(Math.max(num, 1), 100);
    })
    .pipe(z.number().int().min(1).max(100)),

  // ✅ Search validation with sanitization
  search: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),

  // ✅ Sort validation with strict types and defaults
  sortBy: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['createdAt', 'updatedAt', 'productsubName', 'productsubCode'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),

  showAll: z.boolean().optional().default(false),
});

// ✅ Form validation with business rules and input sanitization
export const productsubFormSchema = z.object({
  productId: z.number().int().positive('Product is required'),
  productsubCode: z.string()
    .trim() // ✅ Remove whitespace
    .min(1, 'ProductSub code is required')
    .max(50, 'ProductSub code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'ProductSub code can only contain letters, numbers, underscores and dashes'), // ✅ Whitelist

  productsubName: z.string()
    .trim()
    .min(1, 'ProductSub name is required')
    .max(200, 'ProductSub name must be 200 characters or less'),

  category: z.string()
    .trim()
    .max(100, 'Category must be 100 characters or less')
    .optional()
    .or(z.literal('')), // ✅ Allow empty string

  notes: z.string()
    .trim()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .or(z.literal('')), // ✅ Allow empty string
});

// ✅ Create productsub schema (same as form + validation)
export const createProductSubSchema = productsubFormSchema;

// ✅ Update productsub schema (all fields optional but at least one required)
export const updateProductSubSchema = z.object({
  productsubCode: z.string()
    .trim()
    .min(1, 'ProductSub code is required')
    .max(50, 'ProductSub code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'ProductSub code can only contain letters, numbers, underscores and dashes')
    .optional(),

  productsubName: z.string()
    .trim()
    .min(1, 'ProductSub name is required')
    .max(200, 'ProductSub name must be 200 characters or less')
    .optional(),

  category: z.string()
    .trim()
    .max(100, 'Category must be 100 characters or less')
    .optional(),

  notes: z.string()
    .trim()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional(),

  productId: z.number().int().positive('Product is required').optional(),
}).refine(
  data => data.productsubCode !== undefined || data.productsubName !== undefined || data.category !== undefined || data.notes !== undefined || data.productId !== undefined,
  {
    message: 'At least one field must be provided',
  },
);

// ✅ ProductSub ID validation (for route parameters)
export const productsubIdSchema = z.object({
  id: z.coerce.number().int().positive('ProductSub ID must be a positive integer'),
});

// ✅ Type exports from schemas
export type ProductSubListParams = z.infer<typeof productsubListParamsSchema>;
export type ProductSubFormData = z.infer<typeof productsubFormSchema>;
export type CreateProductSubRequest = z.infer<typeof createProductSubSchema>;
export type UpdateProductSubRequest = z.infer<typeof updateProductSubSchema>;
export type ProductSubIdRequest = z.infer<typeof productsubIdSchema>;

// ✅ Validation helper functions following established patterns
export function validateProductSubListParams(data: unknown): ProductSubListParams {
  return productsubListParamsSchema.parse(data);
}

export function validateProductSubForm(data: unknown): ProductSubFormData {
  return productsubFormSchema.parse(data);
}

export function validateCreateProductSub(data: unknown): CreateProductSubRequest {
  return createProductSubSchema.parse(data);
}

export function validateUpdateProductSub(data: unknown): UpdateProductSubRequest {
  return updateProductSubSchema.parse(data);
}

export function validateProductSubId(data: unknown): ProductSubIdRequest {
  return productsubIdSchema.parse(data);
}

// ✅ ProductSub export validation schema (extends list params but removes pagination)
export const productsubExportParamsSchema = z.object({
  // ✅ Same search validation as list params
  search: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),

  // ✅ Same sort validation as list params
  sortBy: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['createdAt', 'updatedAt', 'productsubName', 'productsubCode'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),
});

// ✅ Type export from export schema
export type ProductSubExportParams = z.infer<typeof productsubExportParamsSchema>;

// ✅ Export validation helper function
export function validateProductSubExportParams(data: unknown): ProductSubExportParams {
  return productsubExportParamsSchema.parse(data);
}

// ✅ Import-specific validation that reuses existing schemas
export const importProductSubRowSchema = z.object({
  productsubCode: productsubFormSchema.shape.productsubCode,
  productsubName: productsubFormSchema.shape.productsubName,
  category: productsubFormSchema.shape.category.optional(),
  notes: productsubFormSchema.shape.notes.optional(),
  rowNumber: z.number().int().positive(),
});

export type ImportProductSubRow = z.infer<typeof importProductSubRowSchema>;

export function validateImportProductSubRow(data: unknown): ImportProductSubRow {
  return importProductSubRowSchema.parse(data);
}
