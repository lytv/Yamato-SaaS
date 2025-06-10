/**
 * ProductionStep-related TypeScript types and interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on productionStepSchema from Drizzle ORM
 */

import type { productionStepSchema } from '@/models/Schema';

// ✅ Infer the ProductionStepDb type from Drizzle schema (server-side with Date objects)
export type ProductionStepDb = typeof productionStepSchema.$inferSelect;

// ✅ Client-side ProductionStep type (dates are strings when received from API)
export type ProductionStep = Omit<ProductionStepDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// ✅ Pagination options (reusable type)
export type PaginationOptions = {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
};

// ✅ ProductionStep list parameters for components (NO ownerId - added in API layer)
export type ProductionStepListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'stepName' | 'stepCode' | 'filmSequence';
  readonly sortOrder?: 'asc' | 'desc';
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type ProductionStepListParamsWithOwner = ProductionStepListParams & {
  readonly ownerId: string;
};

// ✅ Form data for React Hook Form (no readonly for form mutations)
export type ProductionStepFormData = {
  stepCode: string;
  stepName: string;
  filmSequence?: string;
  stepGroup?: string;
  notes?: string;
};

// ✅ Input types for CRUD operations
export type CreateProductionStepInput = {
  readonly ownerId: string;
  stepCode: string;
  stepName: string;
  filmSequence?: string;
  stepGroup?: string;
  notes?: string;
};

export type UpdateProductionStepInput = {
  stepCode?: string;
  stepName?: string;
  filmSequence?: string;
  stepGroup?: string;
  notes?: string;
};

// ✅ API Response types following established patterns
export type ProductionStepResponse = {
  readonly success: true;
  readonly data: ProductionStep;
  readonly message?: string;
};

export type ProductionStepsResponse = {
  readonly success: true;
  readonly data: readonly ProductionStep[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

export type ProductionStepErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// ✅ ProductionStep statistics for dashboard
export type ProductionStepStats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly stepGroups: readonly {
    readonly name: string;
    readonly count: number;
  }[];
};

export type ProductionStepStatsResponse = {
  readonly success: true;
  readonly data: ProductionStepStats;
};

// ✅ Filter state for productionStep list components
export type ProductionStepFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'stepName' | 'stepCode' | 'filmSequence';
  sortOrder: 'asc' | 'desc';
};

// ✅ Multi-tenancy owner types (reusing from todo pattern)
export type OwnerType = 'user' | 'organization';

export type ProductionStepOwner = {
  readonly id: string;
  readonly type: OwnerType;
};
