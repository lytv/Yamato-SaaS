/**
 * ProductionStepDetail-related TypeScript types and interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on productionStepDetailSchema from Drizzle ORM
 */

import type { productionStepDetailSchema } from '@/models/Schema';

// ✅ Infer the ProductionStepDetailDb type from Drizzle schema (server-side with Date objects)
export type ProductionStepDetailDb = typeof productionStepDetailSchema.$inferSelect;

// ✅ Client-side ProductionStepDetail type (dates are strings when received from API)
export type ProductionStepDetail = Omit<ProductionStepDetailDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// ✅ Pagination options (reusable type)
export type PaginationOptions = {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
};

// ✅ ProductionStepDetail list parameters for components (NO ownerId - added in API layer)
export type ProductionStepDetailListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'sequenceNumber' | 'factoryPrice' | 'calculatedPrice';
  readonly sortOrder?: 'asc' | 'desc';
  readonly productId?: number; // Filter by specific product
  readonly productionStepId?: number; // Filter by specific production step
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type ProductionStepDetailListParamsWithOwner = ProductionStepDetailListParams & {
  readonly ownerId: string;
};

// ✅ Form data for React Hook Form (no readonly for form mutations)
export type ProductionStepDetailFormData = {
  productId: number;
  productionStepId: number;
  sequenceNumber: number;
  factoryPrice?: string;
  calculatedPrice?: string;
  quantityLimit1?: number;
  quantityLimit2?: number;
  isFinalStep: boolean;
  isVtStep: boolean;
  isParkingStep: boolean;
};

// ✅ Input types for CRUD operations
export type CreateProductionStepDetailInput = {
  readonly ownerId: string;
  productId: number;
  productionStepId: number;
  sequenceNumber: number;
  factoryPrice?: string;
  calculatedPrice?: string;
  quantityLimit1?: number;
  quantityLimit2?: number;
  isFinalStep?: boolean;
  isVtStep?: boolean;
  isParkingStep?: boolean;
};

export type UpdateProductionStepDetailInput = {
  sequenceNumber?: number;
  factoryPrice?: string;
  calculatedPrice?: string;
  quantityLimit1?: number;
  quantityLimit2?: number;
  isFinalStep?: boolean;
  isVtStep?: boolean;
  isParkingStep?: boolean;
};

// ✅ API Response types following established patterns
export type ProductionStepDetailResponse = {
  readonly success: true;
  readonly data: ProductionStepDetail;
  readonly message?: string;
};

export type ProductionStepDetailsResponse = {
  readonly success: true;
  readonly data: readonly ProductionStepDetail[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

export type ProductionStepDetailErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// ✅ ProductionStepDetail statistics for dashboard
export type ProductionStepDetailStats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly byProduct: readonly {
    readonly productName: string;
    readonly count: number;
  }[];
  readonly byProductionStep: readonly {
    readonly stepName: string;
    readonly count: number;
  }[];
};

export type ProductionStepDetailStatsResponse = {
  readonly success: true;
  readonly data: ProductionStepDetailStats;
};

// ✅ Filter state for productionStepDetail list components
export type ProductionStepDetailFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'sequenceNumber' | 'factoryPrice' | 'calculatedPrice';
  sortOrder: 'asc' | 'desc';
  productId?: number;
  productionStepId?: number;
};

// ✅ Multi-tenancy owner types (reusing from existing pattern)
export type OwnerType = 'user' | 'organization';

export type ProductionStepDetailOwner = {
  readonly id: string;
  readonly type: OwnerType;
};

// ✅ Extended types with joined data for UI components
export type ProductionStepDetailWithRelations = ProductionStepDetail & {
  readonly product?: {
    readonly id: number;
    readonly productCode: string;
    readonly productName: string;
  };
  readonly productionStep?: {
    readonly id: number;
    readonly stepCode: string;
    readonly stepName: string;
  };
};

// ✅ Bulk operation types
export type BulkCreateProductionStepDetailInput = {
  readonly ownerId: string;
  readonly productId: number;
  readonly assignments: readonly {
    readonly productionStepId: number;
    readonly sequenceNumber: number;
    readonly factoryPrice?: string;
    readonly calculatedPrice?: string;
    readonly quantityLimit1?: number;
    readonly quantityLimit2?: number;
    readonly isFinalStep?: boolean;
    readonly isVtStep?: boolean;
    readonly isParkingStep?: boolean;
  }[];
};

export type BulkUpdateSequenceInput = {
  readonly ownerId: string;
  readonly productId: number;
  readonly updates: readonly {
    readonly id: number;
    readonly sequenceNumber: number;
  }[];
};
