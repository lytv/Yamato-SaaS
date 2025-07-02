/**
 * Process Validation Schemas
 * Following TypeScript Type Safety Standards and TDD implementation
 * Enhanced with 400 fix for null/undefined handling
 */

import { z } from 'zod';

// ✅ CRITICAL: Handle null/undefined like 400 fix pattern
export const processListParamsSchema = z.object({
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
      val && ['createdAt', 'updatedAt', 'processName', 'processCode'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),

  showAll: z.boolean().optional().default(false),
});

// ✅ Form validation with business rules and input sanitization
export const processFormSchema = z.object({
  processCode: z.string()
    .trim() // ✅ Remove whitespace
    .min(1, 'Process code is required')
    .max(50, 'Process code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Process code can only contain letters, numbers, underscores and dashes'), // ✅ Whitelist

  processName: z.string()
    .trim()
    .min(1, 'Process name is required')
    .max(200, 'Process name must be 200 characters or less'),

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

// ✅ Create process schema (same as form + validation)
export const createProcessSchema = processFormSchema;

// ✅ Update process schema (all fields optional but at least one required)
export const updateProcessSchema = z.object({
  processCode: z.string()
    .trim()
    .min(1, 'Process code is required')
    .max(50, 'Process code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Process code can only contain letters, numbers, underscores and dashes')
    .optional(),

  processName: z.string()
    .trim()
    .min(1, 'Process name is required')
    .max(200, 'Process name must be 200 characters or less')
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
  data => data.processCode !== undefined || data.processName !== undefined || data.category !== undefined || data.notes !== undefined,
  {
    message: 'At least one field must be provided',
  },
);

// ✅ Process ID validation (for route parameters)
export const processIdSchema = z.object({
  id: z.coerce.number().int().positive('Process ID must be a positive integer'),
});

// ✅ Type exports from schemas
export type ProcessListParams = z.infer<typeof processListParamsSchema>;
export type ProcessFormData = z.infer<typeof processFormSchema>;
export type CreateProcessRequest = z.infer<typeof createProcessSchema>;
export type UpdateProcessRequest = z.infer<typeof updateProcessSchema>;
export type ProcessIdRequest = z.infer<typeof processIdSchema>;

// ✅ Validation helper functions following established patterns
export function validateProcessListParams(data: unknown): ProcessListParams {
  return processListParamsSchema.parse(data);
}

export function validateProcessForm(data: unknown): ProcessFormData {
  return processFormSchema.parse(data);
}

export function validateCreateProcess(data: unknown): CreateProcessRequest {
  return createProcessSchema.parse(data);
}

export function validateUpdateProcess(data: unknown): UpdateProcessRequest {
  return updateProcessSchema.parse(data);
}

export function validateProcessId(data: unknown): ProcessIdRequest {
  return processIdSchema.parse(data);
}

// ✅ Process export validation schema (extends list params but removes pagination)
export const processExportParamsSchema = z.object({
  // ✅ Same search validation as list params
  search: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),

  // ✅ Same sort validation as list params
  sortBy: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['createdAt', 'updatedAt', 'processName', 'processCode'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),
});

// ✅ Type export from export schema
export type ProcessExportParams = z.infer<typeof processExportParamsSchema>;

// ✅ Export validation helper function
export function validateProcessExportParams(data: unknown): ProcessExportParams {
  return processExportParamsSchema.parse(data);
}

// ✅ Import-specific validation that reuses existing schemas
export const importProcessRowSchema = z.object({
  processCode: processFormSchema.shape.processCode,
  processName: processFormSchema.shape.processName,
  category: processFormSchema.shape.category.optional(),
  notes: processFormSchema.shape.notes.optional(),
  rowNumber: z.number().int().positive(),
});

export type ImportProcessRow = z.infer<typeof importProcessRowSchema>;

export function validateImportProcessRow(data: unknown): ImportProcessRow {
  return importProcessRowSchema.parse(data);
}
