/**
 * Note Validation Schemas
 * Zod schemas for validating note data throughout the application
 */

import { z } from 'zod';

// Base note validation schemas
export const CreateNoteSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be less than 10000 characters'),
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
});

export const UpdateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be less than 10000 characters').optional(),
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
}).refine(
  data => data.title !== undefined || data.content !== undefined || data.category !== undefined,
  { message: 'At least one field must be provided' },
);

export const NoteIdSchema = z.object({
  id: z.coerce.number().int().positive('Note ID must be a positive integer'),
});

// List parameters with robust null/undefined handling
export const NoteListParamsSchema = z.object({
  page: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return 1;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 1 : num;
    })
    .pipe(z.number().int().min(1, 'Page must be at least 1')),

  limit: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return 10;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 10 : num;
    })
    .pipe(z.number().int().min(1).max(100, 'Limit cannot exceed 100')),

  search: z.union([z.string(), z.undefined(), z.null()])
    .transform(val => val || undefined).optional(),

  sortBy: z.union([z.enum(['createdAt', 'updatedAt', 'title']), z.undefined(), z.null()])
    .transform(val => val && ['createdAt', 'updatedAt', 'title'].includes(val) ? val : 'createdAt'),

  sortOrder: z.union([z.enum(['asc', 'desc']), z.undefined(), z.null()])
    .transform(val => val && ['asc', 'desc'].includes(val) ? val : 'desc'),
});

// API request schemas
export const CreateNoteRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required').max(10000),
  category: z.string().max(100).optional(),
});

// Form validation schema
export const NoteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required').max(10000),
  category: z.string().max(100).optional(),
});

// Type exports
export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;
export type UpdateNoteRequest = z.infer<typeof UpdateNoteSchema>;
export type NoteListParams = z.infer<typeof NoteListParamsSchema>;
export type NoteFormData = z.infer<typeof NoteFormSchema>;

// Validation helpers
export function validateCreateNote(data: unknown): CreateNoteRequest {
  return CreateNoteRequestSchema.parse(data);
}

export function validateUpdateNote(data: unknown): UpdateNoteRequest {
  return UpdateNoteSchema.parse(data);
}

export function validateNoteId(data: unknown): { id: number } {
  return NoteIdSchema.parse(data);
}

export function validateNoteListParams(data: unknown): NoteListParams {
  return NoteListParamsSchema.parse(data);
}
