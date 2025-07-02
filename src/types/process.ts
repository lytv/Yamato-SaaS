/**
 * Process-related TypeScript types and interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on processSchema from Drizzle ORM
 */

import type { processSchema } from '@/models/Schema';

// ✅ Infer the ProcessDb type from Drizzle schema (server-side with Date objects)
export type ProcessDb = typeof processSchema.$inferSelect;

// ✅ Client-side Process type (dates are strings when received from API)
export type Process = Omit<ProcessDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// ✅ Pagination options (reusable type)
export type PaginationOptions = {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
};

// ✅ Process list parameters for components (NO ownerId - added in API layer)
export type ProcessListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'processName' | 'processCode' | 'processCategory' | 'processType' | 'department';
  readonly sortOrder?: 'asc' | 'desc';
  readonly showAll?: boolean;
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type ProcessListParamsWithOwner = ProcessListParams & {
  readonly ownerId: string;
};

// ✅ Form data for React Hook Form (no readonly for form mutations)
export type ProcessFormData = {
  processCode: string;
  processName: string;
  processCategory?: string;
  description?: string;
};

// ✅ Input types for CRUD operations
export type CreateProcessInput = {
  readonly ownerId: string;
  processCode: string;
  processName: string;
  processCategory?: string;
  description?: string;
};

export type UpdateProcessInput = {
  processCode?: string;
  processName?: string;
  processCategory?: string;
  description?: string;
};

// ✅ API Response types following established patterns
export type ProcessResponse = {
  readonly success: true;
  readonly data: Process;
  readonly message?: string;
};

export type ProcesssResponse = {
  readonly success: true;
  readonly data: readonly Process[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

export type ProcessErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// ✅ Process statistics for dashboard
export type ProcessStats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly categories: readonly {
    readonly name: string;
    readonly count: number;
  }[];
};

export type ProcessStatsResponse = {
  readonly success: true;
  readonly data: ProcessStats;
};

// ✅ Filter state for process list components
export type ProcessFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'processName' | 'processCode';
  sortOrder: 'asc' | 'desc';
};

// ✅ Multi-tenancy owner types (reusing from todo pattern)
export type OwnerType = 'user' | 'organization';

export type ProcessOwner = {
  readonly id: string;
  readonly type: OwnerType;
};
