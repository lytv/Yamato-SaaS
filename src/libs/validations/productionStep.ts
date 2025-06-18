/**
 * ProductionStep Validation Schemas
 * Following TypeScript Type Safety Standards and TDD implementation
 * Enhanced with 400 fix for null/undefined handling
 */

import { z } from 'zod';

// ✅ CRITICAL: Handle null/undefined like 400 fix pattern
export const productionStepListParamsSchema = z.object({
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
      val && ['createdAt', 'updatedAt', 'stepName', 'stepCode', 'filmSequence'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),
});

// ✅ Form validation with business rules and input sanitization
export const productionStepFormSchema = z.object({
  stepCode: z.string()
    .trim() // ✅ Remove whitespace
    .min(1, 'Step code is required')
    .max(50, 'Step code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Step code can only contain letters, numbers, underscores and dashes'), // ✅ Whitelist

  stepName: z.string()
    .trim()
    .min(1, 'Step name is required')
    .max(200, 'Step name must be 200 characters or less'),

  filmSequence: z.string()
    .trim()
    .max(50, 'Film sequence must be 50 characters or less')
    .optional()
    .or(z.literal('')), // ✅ Allow empty string

  stepGroup: z.string()
    .trim()
    .max(100, 'Step group must be 100 characters or less')
    .optional()
    .or(z.literal('')), // ✅ Allow empty string

  notes: z.string()
    .trim()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .or(z.literal('')), // ✅ Allow empty string
});

// ✅ Create productionStep schema (same as form + validation)
export const createProductionStepSchema = productionStepFormSchema;

// ✅ Update productionStep schema (all fields optional but at least one required)
export const updateProductionStepSchema = z.object({
  stepCode: z.string()
    .trim()
    .min(1, 'Step code is required')
    .max(50, 'Step code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Step code can only contain letters, numbers, underscores and dashes')
    .optional(),

  stepName: z.string()
    .trim()
    .min(1, 'Step name is required')
    .max(200, 'Step name must be 200 characters or less')
    .optional(),

  filmSequence: z.string()
    .trim()
    .max(50, 'Film sequence must be 50 characters or less')
    .optional(),

  stepGroup: z.string()
    .trim()
    .max(100, 'Step group must be 100 characters or less')
    .optional(),

  notes: z.string()
    .trim()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional(),
}).refine(
  data => data.stepCode !== undefined
    || data.stepName !== undefined
    || data.filmSequence !== undefined
    || data.stepGroup !== undefined
    || data.notes !== undefined,
  {
    message: 'At least one field must be provided',
  },
);

// ✅ ProductionStep ID validation (for route parameters)
export const productionStepIdSchema = z.object({
  id: z.coerce.number().int().positive('Production step ID must be a positive integer'),
});

// ✅ Type exports from schemas
export type ProductionStepListParams = z.infer<typeof productionStepListParamsSchema>;
export type ProductionStepFormData = z.infer<typeof productionStepFormSchema>;
export type CreateProductionStepRequest = z.infer<typeof createProductionStepSchema>;
export type UpdateProductionStepRequest = z.infer<typeof updateProductionStepSchema>;
export type ProductionStepIdRequest = z.infer<typeof productionStepIdSchema>;

// ✅ Validation helper functions following established patterns
export function validateProductionStepListParams(data: unknown): ProductionStepListParams {
  return productionStepListParamsSchema.parse(data);
}

export function validateProductionStepForm(data: unknown): ProductionStepFormData {
  return productionStepFormSchema.parse(data);
}

export function validateCreateProductionStep(data: unknown): CreateProductionStepRequest {
  return createProductionStepSchema.parse(data);
}

export function validateUpdateProductionStep(data: unknown): UpdateProductionStepRequest {
  return updateProductionStepSchema.parse(data);
}

export function validateProductionStepId(data: unknown): ProductionStepIdRequest {
  return productionStepIdSchema.parse(data);
}

// ✅ ProductionStep export validation schema (extends list params but removes pagination)
export const productionStepExportParamsSchema = z.object({
  // ✅ Same search validation as list params
  search: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),

  // ✅ Same sort validation as list params
  sortBy: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['createdAt', 'updatedAt', 'stepName', 'stepCode', 'filmSequence'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),
});

// ✅ Type export from export schema
export type ProductionStepExportParams = z.infer<typeof productionStepExportParamsSchema>;

// ✅ Export validation helper function
export function validateProductionStepExportParams(data: unknown): ProductionStepExportParams {
  return productionStepExportParamsSchema.parse(data);
}

// ✅ ProductionStep import validation schema
export const importProductionStepRowSchema = z.object({
  stepCode: z.string()
    .trim()
    .min(1, 'Step code is required')
    .max(50, 'Step code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Step code can only contain letters, numbers, underscores and dashes'),

  stepName: z.string()
    .trim()
    .min(1, 'Step name is required')
    .max(200, 'Step name must be 200 characters or less'),

  filmSequence: z.string()
    .trim()
    .max(50, 'Film sequence must be 50 characters or less')
    .optional()
    .or(z.literal('')),

  stepGroup: z.string()
    .trim()
    .max(100, 'Step group must be 100 characters or less')
    .optional()
    .or(z.literal('')),

  notes: z.string()
    .trim()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .or(z.literal('')),

  rowNumber: z.number(),
});

// ✅ Type export from import schema
export type ImportProductionStepRow = z.infer<typeof importProductionStepRowSchema>;

// ✅ Import validation helper function
export function validateImportProductionStepRow(data: unknown): ImportProductionStepRow {
  return importProductionStepRowSchema.parse(data);
}
