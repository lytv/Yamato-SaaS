/**
 * ProductSub-related TypeScript types and interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on productsubSchema from Drizzle ORM
 */

import type { productSubSchema } from '@/models/Schema';

// ✅ Infer the ProductSubDb type from Drizzle schema (server-side with Date objects)
export type ProductSubDb = typeof productSubSchema.$inferSelect;

// ✅ Client-side ProductSub type (dates are strings when received from API)
export type ProductSub = Omit<ProductSubDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// ✅ Pagination options (reusable type)
export type PaginationOptions = {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
};

// ✅ ProductSub list parameters for components (NO ownerId - added in API layer)
export type ProductSubListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'productsubName' | 'productsubCode';
  readonly sortOrder?: 'asc' | 'desc';
  readonly showAll?: boolean;
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type ProductSubListParamsWithOwner = ProductSubListParams & {
  readonly ownerId: string;
};

// ✅ Form data for React Hook Form (no readonly for form mutations)
export type ProductSubFormData = {
  productId: number;
  productsubCode: string;
  productsubName: string;
  category?: string;
  notes?: string;
};

// ✅ Input types for CRUD operations
export type CreateProductSubInput = {
  readonly ownerId: string;
  productId: number;
  productsubCode: string;
  productsubName: string;
  category?: string;
  notes?: string;
};

export type UpdateProductSubInput = {
  productId?: number;
  productsubCode?: string;
  productsubName?: string;
  category?: string;
  notes?: string;
};

// ✅ API Response types following established patterns
export type ProductSubResponse = {
  readonly success: true;
  readonly data: ProductSub;
  readonly message?: string;
};

export type ProductSubsResponse = {
  readonly success: true;
  readonly data: readonly ProductSub[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

export type ProductSubErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// ✅ ProductSub statistics for dashboard
export type ProductSubStats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly categories: readonly {
    readonly name: string;
    readonly count: number;
  }[];
};

export type ProductSubStatsResponse = {
  readonly success: true;
  readonly data: ProductSubStats;
};

// ✅ Filter state for productsub list components
export type ProductSubFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'productsubName' | 'productsubCode';
  sortOrder: 'asc' | 'desc';
};

// ✅ Multi-tenancy owner types (reusing from todo pattern)
export type OwnerType = 'user' | 'organization';

export type ProductSubOwner = {
  readonly id: string;
  readonly type: OwnerType;
};

export type { ProductSubExportParams } from '@/libs/validations/productsub';
