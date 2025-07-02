/**
 * UserSync Validation Schemas
 * Following TypeScript Type Safety Standards and TDD implementation
 * Enhanced with 400 fix for null/undefined handling
 */

import { z } from 'zod';

// ✅ CRITICAL: Handle null/undefined like 400 fix pattern
export const user_syncListParamsSchema = z.object({
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
      val && ['createdAt', 'updatedAt', 'user_syncName', 'user_syncCode'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),

  showAll: z.boolean().optional().default(false),
});

// ✅ Form validation with business rules and input sanitization
export const userSyncFormSchema = z.object({
  userId: z.string()
    .trim()
    .min(1, 'User ID is required')
    .max(50, 'User ID must be 50 characters or less'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or less'),
  fullName: z.string()
    .trim()
    .max(255, 'Full name must be 255 characters or less')
    .optional(),
  role: z.string()
    .trim()
    .max(50, 'Role must be 50 characters or less')
    .optional(),
  organizationRole: z.string()
    .trim()
    .max(50, 'Organization role must be 50 characters or less')
    .optional(),
  isActive: z.boolean().optional(),
});

// ✅ Create user_sync schema (same as form + validation)
export const createUserSyncSchema = userSyncFormSchema;

// ✅ Update user_sync schema (all fields optional but at least one required)
export const updateUserSyncSchema = z.object({
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or less')
    .optional(),
  fullName: z.string()
    .trim()
    .max(255, 'Full name must be 255 characters or less')
    .optional(),
  avatarUrl: z.string()
    .trim()
    .url('Invalid avatar URL')
    .max(255, 'Avatar URL must be 255 characters or less')
    .optional(),
  role: z.string()
    .trim()
    .max(50, 'Role must be 50 characters or less')
    .optional(),
  organizationRole: z.string()
    .trim()
    .max(50, 'Organization role must be 50 characters or less')
    .optional(),
  isActive: z.boolean().optional(),
}).refine(
  data => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided',
  },
);

// ✅ UserSync ID validation (for route parameters)
export const user_syncIdSchema = z.object({
  id: z.string().min(1, 'UserSync ID is required'),
});

// ✅ Type exports from schemas
export type UserSyncListParams = z.infer<typeof user_syncListParamsSchema>;
export type UserSyncFormData = z.infer<typeof userSyncFormSchema>;
export type CreateUserSyncRequest = z.infer<typeof createUserSyncSchema>;
export type UpdateUserSyncRequest = z.infer<typeof updateUserSyncSchema>;
export type UserSyncIdRequest = z.infer<typeof user_syncIdSchema>;

// ✅ Validation helper functions following established patterns
export function validateUserSyncListParams(data: unknown): UserSyncListParams {
  return user_syncListParamsSchema.parse(data);
}

export function validateUserSyncForm(data: unknown): z.infer<typeof userSyncFormSchema> {
  return userSyncFormSchema.parse(data);
}

export function validateCreateUserSync(data: unknown): z.infer<typeof createUserSyncSchema> {
  return createUserSyncSchema.parse(data);
}

export function validateUpdateUserSync(data: unknown): z.infer<typeof updateUserSyncSchema> {
  return updateUserSyncSchema.parse(data);
}

export function validateUserSyncId(data: unknown): UserSyncIdRequest {
  return user_syncIdSchema.parse(data);
}

// ✅ UserSync export validation schema (extends list params but removes pagination)
export const user_syncExportParamsSchema = z.object({
  // ✅ Same search validation as list params
  search: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),

  // ✅ Same sort validation as list params
  sortBy: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['createdAt', 'updatedAt', 'user_syncName', 'user_syncCode'].includes(val) ? val : 'createdAt',
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc',
    ),
});

// ✅ Type export from export schema
export type UserSyncExportParams = z.infer<typeof user_syncExportParamsSchema>;

// ✅ Export validation helper function
export function validateUserSyncExportParams(data: unknown): UserSyncExportParams {
  return user_syncExportParamsSchema.parse(data);
}

// ✅ Import-specific validation that reuses existing schemas
export const importUserSyncRowSchema = z.object({
  userId: userSyncFormSchema.shape.userId,
  email: userSyncFormSchema.shape.email,
  fullName: userSyncFormSchema.shape.fullName.optional(),
  role: userSyncFormSchema.shape.role.optional(),
  organizationRole: userSyncFormSchema.shape.organizationRole.optional(),
  isActive: userSyncFormSchema.shape.isActive.optional(),
  rowNumber: z.number().int().positive(),
});

export type ImportUserSyncRow = z.infer<typeof importUserSyncRowSchema>;

export function validateImportUserSyncRow(data: unknown): ImportUserSyncRow {
  return importUserSyncRowSchema.parse(data);
}
