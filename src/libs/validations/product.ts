/**
 * Product Validation Schemas
 * Following TypeScript Type Safety Standards and TDD implementation
 * Enhanced with 400 fix for null/undefined handling
 */

import { z } from 'zod';

// ✅ CRITICAL: Handle null/undefined like 400 fix pattern
export const productListParamsSchema = z.object({
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
      val && ['createdAt', 'updatedAt', 'productName', 'productCode'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),
});

// ✅ Form validation with business rules and input sanitization
export const productFormSchema = z.object({
  productCode: z.string()
    .trim() // ✅ Remove whitespace
    .min(1, 'Product code is required')
    .max(50, 'Product code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Product code can only contain letters, numbers, underscores and dashes'), // ✅ Whitelist

  productName: z.string()
    .trim()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be 200 characters or less'),

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

// ✅ Create product schema (same as form + validation)
export const createProductSchema = productFormSchema;

// ✅ Update product schema (all fields optional but at least one required)
export const updateProductSchema = z.object({
  productCode: z.string()
    .trim()
    .min(1, 'Product code is required')
    .max(50, 'Product code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Product code can only contain letters, numbers, underscores and dashes')
    .optional(),

  productName: z.string()
    .trim()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be 200 characters or less')
    .optional(),

  category: z.string()
    .trim()
    .max(100, 'Category must be 100 characters or less')
    .optional(),

  notes: z.string()
    .trim()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional(),
}).refine(
  data => data.productCode !== undefined || data.productName !== undefined || data.category !== undefined || data.notes !== undefined,
  {
    message: 'At least one field must be provided',
  },
);

// ✅ Product ID validation (for route parameters)
export const productIdSchema = z.object({
  id: z.coerce.number().int().positive('Product ID must be a positive integer'),
});

// ✅ Type exports from schemas
export type ProductListParams = z.infer<typeof productListParamsSchema>;
export type ProductFormData = z.infer<typeof productFormSchema>;
export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductSchema>;
export type ProductIdRequest = z.infer<typeof productIdSchema>;

// ✅ Validation helper functions following established patterns
export function validateProductListParams(data: unknown): ProductListParams {
  return productListParamsSchema.parse(data);
}

export function validateProductForm(data: unknown): ProductFormData {
  return productFormSchema.parse(data);
}

export function validateCreateProduct(data: unknown): CreateProductRequest {
  return createProductSchema.parse(data);
}

export function validateUpdateProduct(data: unknown): UpdateProductRequest {
  return updateProductSchema.parse(data);
}

export function validateProductId(data: unknown): ProductIdRequest {
  return productIdSchema.parse(data);
}

// ✅ Product export validation schema (extends list params but removes pagination)
export const productExportParamsSchema = z.object({
  // ✅ Same search validation as list params
  search: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),

  // ✅ Same sort validation as list params
  sortBy: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['createdAt', 'updatedAt', 'productName', 'productCode'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),
});

// ✅ Type export from export schema
export type ProductExportParams = z.infer<typeof productExportParamsSchema>;

// ✅ Export validation helper function
export function validateProductExportParams(data: unknown): ProductExportParams {
  return productExportParamsSchema.parse(data);
}
