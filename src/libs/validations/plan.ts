/**
 * Plan Validation Schemas
 * Following TypeScript Type Safety Standards and TDD implementation
 * Enhanced with 400 fix for null/undefined handling
 */

import { z } from 'zod';

// ✅ CRITICAL: Handle null/undefined like 400 fix pattern
export const planListParamsSchema = z.object({
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
      val && ['createdAt', 'updatedAt', 'planName', 'planCode'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),

  showAll: z.boolean().optional().default(false),
});

// ✅ Form validation with business rules and input sanitization
export const planFormSchema = z.object({
  planCode: z.string()
    .trim() // ✅ Remove whitespace
    .min(1, 'Plan code is required')
    .max(50, 'Plan code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Plan code can only contain letters, numbers, underscores and dashes'), // ✅ Whitelist

  planName: z.string()
    .trim()
    .min(1, 'Plan name is required')
    .max(200, 'Plan name must be 200 characters or less'),

  planYear: z.number()
    .int()
    .min(2020, 'Plan year must be 2020 or later')
    .max(2030, 'Plan year must be 2030 or earlier'),

  planMonth: z.number()
    .int()
    .min(1, 'Plan month must be between 1 and 12')
    .max(12, 'Plan month must be between 1 and 12'),

  totalTargetQuantity: z.number()
    .int()
    .min(0, 'Total target quantity must be non-negative')
    .optional(),

  totalActualQuantity: z.number()
    .int()
    .min(0, 'Total actual quantity must be non-negative')
    .optional(),

  status: z.string()
    .trim()
    .max(50, 'Status must be 50 characters or less')
    .optional(),

  planStartDate: z.union([z.string(), z.date()])
    .optional(),

  planEndDate: z.union([z.string(), z.date()])
    .optional(),

  approvedBy: z.string()
    .trim()
    .max(100, 'Approved by must be 100 characters or less')
    .optional(),

  approvedAt: z.union([z.string(), z.date()])
    .optional(),

  note: z.string()
    .trim()
    .max(1000, 'Note must be 1000 characters or less')
    .optional()
    .or(z.literal('')), // ✅ Allow empty string
});

// ✅ Create plan schema (same as form + validation)
export const createPlanSchema = planFormSchema;

// ✅ Update plan schema (all fields optional but at least one required)
export const updatePlanSchema = z.object({
  planCode: z.string()
    .trim()
    .min(1, 'Plan code is required')
    .max(50, 'Plan code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Plan code can only contain letters, numbers, underscores and dashes')
    .optional(),

  planName: z.string()
    .trim()
    .min(1, 'Plan name is required')
    .max(200, 'Plan name must be 200 characters or less')
    .optional(),

  planYear: z.number()
    .int()
    .min(2020, 'Plan year must be 2020 or later')
    .max(2030, 'Plan year must be 2030 or earlier')
    .optional(),

  planMonth: z.number()
    .int()
    .min(1, 'Plan month must be between 1 and 12')
    .max(12, 'Plan month must be between 1 and 12')
    .optional(),

  totalTargetQuantity: z.number()
    .int()
    .min(0, 'Total target quantity must be non-negative')
    .optional(),

  totalActualQuantity: z.number()
    .int()
    .min(0, 'Total actual quantity must be non-negative')
    .optional(),

  status: z.string()
    .trim()
    .max(50, 'Status must be 50 characters or less')
    .optional(),

  planStartDate: z.union([z.string(), z.date()])
    .optional(),

  planEndDate: z.union([z.string(), z.date()])
    .optional(),

  approvedBy: z.string()
    .trim()
    .max(100, 'Approved by must be 100 characters or less')
    .optional(),

  approvedAt: z.union([z.string(), z.date()])
    .optional(),

  note: z.string()
    .trim()
    .max(1000, 'Note must be 1000 characters or less')
    .optional(),
}).refine(
  data => data.planCode !== undefined || data.planName !== undefined || data.planYear !== undefined
    || data.planMonth !== undefined || data.totalTargetQuantity !== undefined
    || data.totalActualQuantity !== undefined || data.status !== undefined
    || data.planStartDate !== undefined || data.planEndDate !== undefined
    || data.approvedBy !== undefined || data.approvedAt !== undefined || data.note !== undefined,
  {
    message: 'At least one field must be provided',
  },
);

// ✅ Plan ID validation (for route parameters)
export const planIdSchema = z.object({
  id: z.coerce.number().int().positive('Plan ID must be a positive integer'),
});

// ✅ Type exports from schemas
export type PlanListParams = z.infer<typeof planListParamsSchema>;
export type PlanFormData = z.infer<typeof planFormSchema>;
export type CreatePlanRequest = z.infer<typeof createPlanSchema>;
export type UpdatePlanRequest = z.infer<typeof updatePlanSchema>;
export type PlanIdRequest = z.infer<typeof planIdSchema>;

// ✅ Validation helper functions following established patterns
export function validatePlanListParams(data: unknown): PlanListParams {
  return planListParamsSchema.parse(data);
}

export function validatePlanForm(data: unknown): PlanFormData {
  return planFormSchema.parse(data);
}

export function validateCreatePlan(data: unknown): CreatePlanRequest {
  return createPlanSchema.parse(data);
}

export function validateUpdatePlan(data: unknown): UpdatePlanRequest {
  return updatePlanSchema.parse(data);
}

export function validatePlanId(data: unknown): PlanIdRequest {
  return planIdSchema.parse(data);
}

// ✅ Plan export validation schema (extends list params but removes pagination)
export const planExportParamsSchema = z.object({
  // ✅ Same search validation as list params
  search: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),

  // ✅ Same sort validation as list params
  sortBy: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['createdAt', 'updatedAt', 'planName', 'planCode'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),
});

// ✅ Type export from export schema
export type PlanExportParams = z.infer<typeof planExportParamsSchema>;

// ✅ Export validation helper function
export function validatePlanExportParams(data: unknown): PlanExportParams {
  return planExportParamsSchema.parse(data);
}

// ✅ Import-specific validation that reuses existing schemas
export const importPlanRowSchema = z.object({
  planCode: planFormSchema.shape.planCode,
  planName: planFormSchema.shape.planName,
  planYear: planFormSchema.shape.planYear,
  planMonth: planFormSchema.shape.planMonth,
  totalTargetQuantity: planFormSchema.shape.totalTargetQuantity.optional(),
  totalActualQuantity: planFormSchema.shape.totalActualQuantity.optional(),
  status: planFormSchema.shape.status.optional(),
  planStartDate: planFormSchema.shape.planStartDate.optional(),
  planEndDate: planFormSchema.shape.planEndDate.optional(),
  approvedBy: planFormSchema.shape.approvedBy.optional(),
  approvedAt: planFormSchema.shape.approvedAt.optional(),
  note: planFormSchema.shape.note.optional(),
  rowNumber: z.number().int().positive(),
});

export type ImportPlanRow = z.infer<typeof importPlanRowSchema>;

export function validateImportPlanRow(data: unknown): ImportPlanRow {
  return importPlanRowSchema.parse(data);
}
