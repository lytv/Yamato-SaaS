/**
 * Todo validation schemas using Zod
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { z } from 'zod';

// Base todo validation schemas
export const CreateTodoSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
});

export const UpdateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters').optional(),
}).refine(
  data => data.title !== undefined || data.message !== undefined,
  {
    message: 'At least one field (title or message) must be provided',
  },
);

export const TodoIdSchema = z.object({
  id: z.coerce.number().int().positive('Todo ID must be a positive integer'),
});

export const TodoListParamsSchema = z.object({
  page: z.union([z.string(), z.number(), z.undefined(), z.null()]).transform((val) => {
    if (val === undefined || val === null) {
      return 1;
    }
    const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
    return Number.isNaN(num) ? 1 : num;
  }).pipe(z.number().int().min(1, 'Page must be at least 1')),

  limit: z.union([z.string(), z.number(), z.undefined(), z.null()]).transform((val) => {
    if (val === undefined || val === null) {
      return 10;
    }
    const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
    return Number.isNaN(num) ? 10 : num;
  }).pipe(z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100')),

  search: z.union([z.string(), z.undefined(), z.null()]).transform(val => val || undefined).optional(),

  sortBy: z.union([z.enum(['createdAt', 'updatedAt', 'title']), z.undefined(), z.null()]).transform(val =>
    val && ['createdAt', 'updatedAt', 'title'].includes(val) ? val : 'createdAt',
  ),

  sortOrder: z.union([z.enum(['asc', 'desc']), z.undefined(), z.null()]).transform(val =>
    val && ['asc', 'desc'].includes(val) ? val : 'desc',
  ),
});

// Form validation schemas (for frontend)
export const TodoFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
});

// API request validation schemas
export const CreateTodoRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
});

export const UpdateTodoRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters').optional(),
}).refine(
  data => data.title !== undefined || data.message !== undefined,
  {
    message: 'At least one field (title or message) must be provided',
  },
);

// Type exports for use in API routes
export type CreateTodoRequest = z.infer<typeof CreateTodoRequestSchema>;
export type UpdateTodoRequest = z.infer<typeof UpdateTodoRequestSchema>;
export type TodoListParams = z.infer<typeof TodoListParamsSchema>;
export type TodoFormData = z.infer<typeof TodoFormSchema>;

// Validation helper functions
export function validateCreateTodo(data: unknown): CreateTodoRequest {
  return CreateTodoRequestSchema.parse(data);
}

export function validateUpdateTodo(data: unknown): UpdateTodoRequest {
  return UpdateTodoRequestSchema.parse(data);
}

export function validateTodoId(data: unknown): { id: number } {
  return TodoIdSchema.parse(data);
}

export function validateTodoListParams(data: unknown): TodoListParams {
  return TodoListParamsSchema.parse(data);
}

export function validateTodoForm(data: unknown): TodoFormData {
  return TodoFormSchema.parse(data);
}
