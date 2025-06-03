/**
 * Stored Procedure Validation Schemas
 * Validates data returned from PostgreSQL stored procedures
 * Following TypeScript Type Safety Standards and TDD practices
 */

import { z } from 'zod';

// Base validation schemas for stored procedure results
export const StoredProcedureTodoSchema = z.object({
  id: z.number().int().positive('Todo ID must be a positive integer'),
  owner_id: z.string().min(1, 'Owner ID cannot be empty'),
  title: z.string().min(1, 'Title cannot be empty'),
  message: z.string().min(1, 'Message cannot be empty'),
  created_at: z.date(),
  updated_at: z.date(),
});

export const StoredProcedureStatsSchema = z.object({
  total: z.number().int().min(0, 'Total count cannot be negative'),
  today: z.number().int().min(0, 'Today count cannot be negative'),
  this_week: z.number().int().min(0, 'This week count cannot be negative'),
  this_month: z.number().int().min(0, 'This month count cannot be negative'),
});

export const StoredProcedurePaginatedSchema = z.object({
  id: z.number().int().positive('Todo ID must be a positive integer'),
  owner_id: z.string().min(1, 'Owner ID cannot be empty'),
  title: z.string().min(1, 'Title cannot be empty'),
  message: z.string().min(1, 'Message cannot be empty'),
  created_at: z.date(),
  updated_at: z.date(),
  total_count: z.number().int().min(0, 'Total count cannot be negative'),
});

// Type exports for strict type checking
export type StoredProcedureTodo = z.infer<typeof StoredProcedureTodoSchema>;
export type StoredProcedureStats = z.infer<typeof StoredProcedureStatsSchema>;
export type StoredProcedurePaginated = z.infer<typeof StoredProcedurePaginatedSchema>;

// Validation helper functions with explicit error handling
export function validateStoredProcedureTodo(row: unknown): StoredProcedureTodo {
  try {
    return StoredProcedureTodoSchema.parse(row);
  } catch (error) {
    throw new Error(`Invalid stored procedure todo result: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateStoredProcedureStats(row: unknown): StoredProcedureStats {
  try {
    return StoredProcedureStatsSchema.parse(row);
  } catch (error) {
    throw new Error(`Invalid stored procedure stats result: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateStoredProcedurePaginated(row: unknown): StoredProcedurePaginated {
  try {
    return StoredProcedurePaginatedSchema.parse(row);
  } catch (error) {
    throw new Error(`Invalid stored procedure paginated result: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
