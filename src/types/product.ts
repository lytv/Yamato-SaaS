/**
 * Product-related TypeScript types and interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on productSchema from Drizzle ORM
 */

import type { productSchema } from '@/models/Schema';

// ✅ Infer the ProductDb type from Drizzle schema (server-side with Date objects)
export type ProductDb = typeof productSchema.$inferSelect;

// ✅ Client-side Product type (dates are strings when received from API)
export type Product = Omit<ProductDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// ✅ Pagination options (reusable type)
export type PaginationOptions = {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
};

// ✅ Product list parameters for components (NO ownerId - added in API layer)
export type ProductListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'productName' | 'productCode';
  readonly sortOrder?: 'asc' | 'desc';
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type ProductListParamsWithOwner = ProductListParams & {
  readonly ownerId: string;
};

// ✅ Form data for React Hook Form (no readonly for form mutations)
export type ProductFormData = {
  productCode: string;
  productName: string;
  category?: string;
  notes?: string;
};

// ✅ Input types for CRUD operations
export type CreateProductInput = {
  readonly ownerId: string;
  productCode: string;
  productName: string;
  category?: string;
  notes?: string;
};

export type UpdateProductInput = {
  productCode?: string;
  productName?: string;
  category?: string;
  notes?: string;
};

// ✅ API Response types following established patterns
export type ProductResponse = {
  readonly success: true;
  readonly data: Product;
  readonly message?: string;
};

export type ProductsResponse = {
  readonly success: true;
  readonly data: readonly Product[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

export type ProductErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// ✅ Product statistics for dashboard
export type ProductStats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly categories: readonly {
    readonly name: string;
    readonly count: number;
  }[];
};

export type ProductStatsResponse = {
  readonly success: true;
  readonly data: ProductStats;
};

// ✅ Filter state for product list components
export type ProductFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'productName' | 'productCode';
  sortOrder: 'asc' | 'desc';
};

// ✅ Multi-tenancy owner types (reusing from todo pattern)
export type OwnerType = 'user' | 'organization';

export type ProductOwner = {
  readonly id: string;
  readonly type: OwnerType;
};
