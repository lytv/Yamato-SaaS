/**
 * Plan-related TypeScript types and interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on planSchema from Drizzle ORM
 */

import type { planSchema } from '@/models/Schema';

// ✅ Infer the PlanDb type from Drizzle schema (server-side with Date objects)
export type PlanDb = typeof planSchema.$inferSelect;

// ✅ Client-side Plan type (dates are strings when received from API)
export type Plan = Omit<PlanDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// ✅ Pagination options (reusable type)
export type PaginationOptions = {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
};

// ✅ Plan list parameters for components (NO ownerId - added in API layer)
export type PlanListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'planName' | 'planCode';
  readonly sortOrder?: 'asc' | 'desc';
  readonly showAll?: boolean;
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type PlanListParamsWithOwner = PlanListParams & {
  readonly ownerId: string;
};

// ✅ Form data for React Hook Form (no readonly for form mutations)
export type PlanFormData = {
  planCode: string;
  planName: string;
  planYear: number;
  planMonth: number;
  totalTargetQuantity?: number;
  totalActualQuantity?: number;
  status?: string;
  planStartDate?: Date | string;
  planEndDate?: Date | string;
  approvedBy?: string;
  approvedAt?: Date | string;
  note?: string;
};

// ✅ Input types for CRUD operations
export type CreatePlanInput = {
  readonly ownerId: string;
  planCode: string;
  planName: string;
  planYear: number;
  planMonth: number;
  totalTargetQuantity?: number;
  totalActualQuantity?: number;
  status?: string;
  planStartDate?: Date | string;
  planEndDate?: Date | string;
  approvedBy?: string;
  approvedAt?: Date | string;
  note?: string;
};

export type UpdatePlanInput = {
  planCode?: string;
  planName?: string;
  planYear?: number;
  planMonth?: number;
  totalTargetQuantity?: number;
  totalActualQuantity?: number;
  status?: string;
  planStartDate?: Date | string;
  planEndDate?: Date | string;
  approvedBy?: string;
  approvedAt?: Date | string;
  note?: string;
};

// ✅ API Response types following established patterns
export type PlanResponse = {
  readonly success: true;
  readonly data: Plan;
  readonly message?: string;
};

export type PlansResponse = {
  readonly success: true;
  readonly data: readonly Plan[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

export type PlanErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// ✅ Plan statistics for dashboard
export type PlanStats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly categories: readonly {
    readonly name: string;
    readonly count: number;
  }[];
};

export type PlanStatsResponse = {
  readonly success: true;
  readonly data: PlanStats;
};

// ✅ Filter state for plan list components
export type PlanFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'planName' | 'planCode';
  sortOrder: 'asc' | 'desc';
};

// ✅ Multi-tenancy owner types (reusing from todo pattern)
export type OwnerType = 'user' | 'organization';

export type PlanOwner = {
  readonly id: string;
  readonly type: OwnerType;
};
