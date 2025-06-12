/**
 * ProductionStepDetail Validation Schemas
 * Following TypeScript Type Safety Standards and TDD implementation
 * Enhanced with null/undefined handling pattern
 */

import { z } from 'zod';

// ✅ CRITICAL: Handle null/undefined like existing pattern
export const productionStepDetailListParamsSchema = z.object({
  // ✅ Robust page validation
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
      val && ['createdAt', 'updatedAt', 'sequenceNumber', 'factoryPrice', 'calculatedPrice'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),

  // ✅ Product filter validation
  productId: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val: string | number | undefined | null) => {
      if (val === undefined || val === null) {
        return undefined;
      }
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) || num < 1 ? undefined : num;
    })
    .pipe(z.number().int().positive().optional()),

  // ✅ Production step filter validation
  productionStepId: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val: string | number | undefined | null) => {
      if (val === undefined || val === null) {
        return undefined;
      }
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) || num < 1 ? undefined : num;
    })
    .pipe(z.number().int().positive().optional()),
});

// ✅ Price validation helper
const priceSchema = z.string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid decimal number with up to 2 decimal places')
  .optional();

// ✅ Form validation with business rules and input sanitization
export const productionStepDetailFormSchema = z.object({
  productId: z.number()
    .int()
    .positive('Product ID must be a positive integer'),

  productionStepId: z.number()
    .int()
    .positive('Production Step ID must be a positive integer'),

  sequenceNumber: z.number()
    .int()
    .positive('Sequence number must be a positive integer'),

  factoryPrice: priceSchema,

  calculatedPrice: priceSchema,

  quantityLimit1: z.number()
    .int()
    .min(0, 'Quantity limit 1 must be non-negative')
    .optional(),

  quantityLimit2: z.number()
    .int()
    .min(0, 'Quantity limit 2 must be non-negative')
    .optional(),

  isFinalStep: z.boolean(),

  isVtStep: z.boolean(),

  isParkingStep: z.boolean(),
});

// ✅ Create production step detail schema (same as form + validation)
export const createProductionStepDetailSchema = productionStepDetailFormSchema;

// ✅ Update production step detail schema (all fields optional but at least one required)
export const updateProductionStepDetailSchema = z.object({
  sequenceNumber: z.number()
    .int()
    .positive('Sequence number must be a positive integer')
    .optional(),

  factoryPrice: priceSchema,

  calculatedPrice: priceSchema,

  quantityLimit1: z.number()
    .int()
    .min(0, 'Quantity limit 1 must be non-negative')
    .optional(),

  quantityLimit2: z.number()
    .int()
    .min(0, 'Quantity limit 2 must be non-negative')
    .optional(),

  isFinalStep: z.boolean().optional(),

  isVtStep: z.boolean().optional(),

  isParkingStep: z.boolean().optional(),
}).refine(
  data => data.sequenceNumber !== undefined
    || data.factoryPrice !== undefined
    || data.calculatedPrice !== undefined
    || data.quantityLimit1 !== undefined
    || data.quantityLimit2 !== undefined
    || data.isFinalStep !== undefined
    || data.isVtStep !== undefined
    || data.isParkingStep !== undefined,
  {
    message: 'At least one field must be provided',
  },
);

// ✅ Production step detail ID validation (for route parameters)
export const productionStepDetailIdSchema = z.object({
  id: z.coerce.number().int().positive('Production Step Detail ID must be a positive integer'),
});

// ✅ Type exports from schemas
export type ProductionStepDetailListParams = z.infer<typeof productionStepDetailListParamsSchema>;
export type ProductionStepDetailFormData = z.infer<typeof productionStepDetailFormSchema>;
export type CreateProductionStepDetailRequest = z.infer<typeof createProductionStepDetailSchema>;
export type UpdateProductionStepDetailRequest = z.infer<typeof updateProductionStepDetailSchema>;
export type ProductionStepDetailIdRequest = z.infer<typeof productionStepDetailIdSchema>;

// ✅ Validation helper functions following established patterns
export function validateProductionStepDetailListParams(data: unknown): ProductionStepDetailListParams {
  return productionStepDetailListParamsSchema.parse(data);
}

export function validateProductionStepDetailForm(data: unknown): ProductionStepDetailFormData {
  return productionStepDetailFormSchema.parse(data);
}

export function validateCreateProductionStepDetail(data: unknown): CreateProductionStepDetailRequest {
  return createProductionStepDetailSchema.parse(data);
}

export function validateUpdateProductionStepDetail(data: unknown): UpdateProductionStepDetailRequest {
  return updateProductionStepDetailSchema.parse(data);
}

export function validateProductionStepDetailId(data: unknown): ProductionStepDetailIdRequest {
  return productionStepDetailIdSchema.parse(data);
}
