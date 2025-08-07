/**
 * UserSync-related TypeScript types and interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on userSyncSchema from Drizzle ORM
 */

import type { userSyncSchema } from '@/models/Schema';

// ✅ Infer the UserSyncDb type from Drizzle schema (server-side with Date objects)
export type UserSyncDb = typeof userSyncSchema.$inferSelect;

// ✅ Client-side UserSync type (dates are strings when received from API)
export type UserSync = Omit<UserSyncDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// ✅ Pagination options (reusable type)
export type PaginationOptions = {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
};

// ✅ UserSync list parameters for components (NO ownerId - added in API layer)
export type UserSyncListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'userId' | 'fullName' | 'role' | 'isActive';
  readonly sortOrder?: 'asc' | 'desc';
  readonly showAll?: boolean;
  readonly shortcut?: string;  // Exact filter for shortcut
  readonly fullName?: string;  // Exact filter for fullName
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type UserSyncListParamsWithOwner = UserSyncListParams & {
  readonly ownerId: string;
};

// ✅ Form data for React Hook Form (no readonly for form mutations)
export type UserSyncFormData = {
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role?: string;
  organizationRole?: string;
  shortcut?: string;
  isActive?: boolean;
};

// ✅ Input types for CRUD operations
export type CreateUserSyncInput = {
  readonly ownerId: string;
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role?: string;
  organizationRole?: string;
  shortcut?: string;
  isActive?: boolean;
};

export type UpdateUserSyncInput = {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  role?: string;
  organizationRole?: string;
  shortcut?: string;
  isActive?: boolean;
};

// ✅ API Response types following established patterns
export type UserSyncResponse = {
  readonly success: true;
  readonly data: UserSync;
  readonly message?: string;
};

export type UserSyncsResponse = {
  readonly success: true;
  readonly data: readonly UserSync[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

export type UserSyncErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// ✅ UserSync statistics for dashboard
export type UserSyncStats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly roles: readonly {
    readonly name: string;
    readonly count: number;
  }[];
};

export type UserSyncStatsResponse = {
  readonly success: true;
  readonly data: UserSyncStats;
};

// ✅ Filter state for user_sync list components
export type UserSyncFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'email' | 'userId' | 'fullName' | 'role' | 'isActive';
  sortOrder: 'asc' | 'desc';
  shortcut: string;  // Exact filter for shortcut
  fullName: string;  // Exact filter for fullName
};

// ✅ Multi-tenancy owner types (reusing from todo pattern)
export type OwnerType = 'user' | 'organization';

export type UserSyncOwner = {
  readonly id: string;
  readonly type: OwnerType;
};
