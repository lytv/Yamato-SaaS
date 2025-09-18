/**
 * OutsourceOrderDetail-related TypeScript types and interfaces
 * Enhanced version with proper error handling, type safety and relationships support
 * Generated based on existing pattern from outsourceOrder types
 */

import type { outsourceOrderDetailSchema } from '@/models/Schema';
import type { OutsourceOrder } from '@/types/outsourceOrder';

// Infer the OutsourceOrderDetailDb type from Drizzle schema
export type OutsourceOrderDetailDb = typeof outsourceOrderDetailSchema.$inferSelect;

// Client-side OutsourceOrderDetail type with proper date handling
export type OutsourceOrderDetail = Omit<OutsourceOrderDetailDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// OutsourceOrderDetail with relations
export type OutsourceOrderDetailWithRelations = OutsourceOrderDetail & {
  // Relations types
  outsourceOrder?: Pick<OutsourceOrder, 'id' | 'orderCode' | 'orderTitle' | 'status' | 'assignedToUserId' | 'orderDate' | 'createdByUserId'> & {
    assignedToUser?: { fullName?: string | null; shortcut?: string | null };
  };
  plan?: { id: number; planCode: string; planName: string };
  product?: { id: number; productCode: string; productName: string; category: string | null };
  productionStep?: { id: number; stepCode: string; stepName: string; filmSequence: string | null };
  workTable?: { locationCode: string; tableName: string };
  productSub?: { productSubCode: string; productSubDetail: string; productCode: string };
};

// Form data type for React Hook Form
export type OutsourceOrderDetailFormData = {
  outsourceOrderId: number;
  planId: number;
  productId: number;
  productionStepId: number;
  planCode: string;
  planName: string;
  productCode: string;
  productName: string;
  stepCode: string;
  stepName: string;
  locationCode?: string;
  productSubCode?: string;
  orderedQuantity: number;
  completedQuantity?: number;
  expectedCompletionDate: Date | string;
  actualCompletionDate?: Date | string;
  status?: string;
  sequenceNumber?: number;
  unitPrice?: number;
  totalPrice?: number;
  itemNotes?: string;
};

// Input types for CRUD operations with proper validation
export type CreateOutsourceOrderDetailInput = {
  ownerId: string;
  outsourceOrderId: number;
  planId: number;
  productId: number;
  productionStepId: number;
  planCode: string;
  planName: string;
  productCode: string;
  productName: string;
  stepCode: string;
  stepName: string;
  locationCode?: string;
  productSubCode?: string;
  orderedQuantity: number;
  expectedCompletionDate: Date;
  completedQuantity?: number;
  actualCompletionDate?: Date;
  status?: string;
  sequenceNumber?: number;
  unitPrice?: number;
  totalPrice?: number;
  itemNotes?: string;
};

export type UpdateOutsourceOrderDetailInput = {
  outsourceOrderId?: number;
  planId?: number;
  productId?: number;
  productionStepId?: number;
  planCode?: string;
  planName?: string;
  productCode?: string;
  productName?: string;
  stepCode?: string;
  stepName?: string;
  locationCode?: string;
  productSubCode?: string;
  orderedQuantity?: number;
  completedQuantity?: number;
  expectedCompletionDate?: Date | string;
  actualCompletionDate?: Date | string;
  status?: string;
  sequenceNumber?: number;
  unitPrice?: number;
  totalPrice?: number;
  itemNotes?: string;
};

// Relation options for dropdowns and selectors
export type OutsourceOrderDetailRelationOptions = {
  readonly assignedUsers: readonly { id: string; fullName: string; shortcut: string | null }[];
  readonly outsourceOrders: readonly Pick<OutsourceOrder, 'id' | 'orderCode' | 'orderTitle'>[];
  readonly plans: readonly { id: number; planCode: string; planName: string }[];
  readonly products: readonly { id: number; productCode: string; productName: string; category: string | null }[];
  readonly productionSteps: readonly { id: number; stepCode: string; stepName: string; filmSequence: string | null }[];
  readonly workTables: readonly { locationCode: string; tableName: string }[];
  readonly productSubs: readonly { productSubCode: string; productSubDetail: string; productCode: string }[];
};

// Enhanced relation options with search and pagination
export type OutsourceOrderDetailRelationSearchOptions = {
  readonly query?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly outsourceOrderId?: number;
};

export type OutsourceOrderDetailRelationSearchResult<T = any> = {
  readonly success: true;
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

// API Response types
export type OutsourceOrderDetailResponse = {
  readonly success: true;
  readonly data: OutsourceOrderDetailWithRelations;
  readonly message?: string;
};

export type OutsourceOrderDetailsResponse = {
  readonly success: true;
  readonly data: readonly OutsourceOrderDetailWithRelations[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

export type OutsourceOrderDetailErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// List parameters
export type OutsourceOrderDetailListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'sequenceNumber' | 'expectedCompletionDate';
  readonly sortOrder?: 'asc' | 'desc';
  readonly showAll?: boolean;
  readonly includeRelations?: boolean;
  readonly outsourceOrderId?: number;
  readonly status?: string;
  readonly planId?: number;
  readonly productId?: number;
  readonly productionStepId?: number;
  readonly assignedToUserId?: string;
  readonly orderStartDate?: string;
  readonly orderEndDate?: string;
};

export type OutsourceOrderDetailListParamsWithOwner = OutsourceOrderDetailListParams & {
  readonly ownerId: string;
};

// Export parameters for Excel functionality
export type OutsourceOrderDetailExportParams = OutsourceOrderDetailListParams & {
  readonly format?: 'xlsx' | 'csv';
  readonly includeHeaders?: boolean;
  readonly filename?: string;
};

// Import validation result
export type ImportOutsourceOrderDetailResult = {
  readonly success: boolean;
  readonly imported: number;
  readonly failed: number;
  readonly errors: readonly string[];
  readonly outsourceOrderDetails: readonly OutsourceOrderDetail[];
  readonly duplicates?: readonly string[];
  readonly warnings?: readonly string[];
};

// Statistics type
export type OutsourceOrderDetailStats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly byStatus?: Record<string, number>;
  readonly byOutsourceOrder?: Record<string, number>;
  readonly totalOrderedQuantity?: number;
  readonly totalCompletedQuantity?: number;
  readonly totalValue?: number;
  readonly completionRate?: number;
  readonly trends?: {
    readonly daily: Record<string, number>;
    readonly weekly: Record<string, number>;
    readonly monthly: Record<string, number>;
  };
};

export type OutsourceOrderDetailStatsResponse = {
  readonly success: true;
  readonly data: OutsourceOrderDetailStats;
};

// Filter state for OutsourceOrderDetail
export type OutsourceOrderDetailFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'sequenceNumber' | 'expectedCompletionDate';
  sortOrder: 'asc' | 'desc';
  outsourceOrderId?: number;
  status?: string;
  // Enhanced filters for UI
  assignedToUserId?: string;
  planId?: number;
  productId?: number;
  productionStepId?: number;
  // Quick search fields for dropdown filters
  assignedUserSearch?: string; // Search by shortcut in assigned users
  productSearch?: string; // Search by category in products
  productionStepSearch?: string; // Search by sequence in production steps
  // Separate date fields for UI
  startDate?: Date;
  endDate?: Date;
  // Keep for backward compatibility and API calls
  orderDateRange?: {
    start: Date;
    end: Date;
  };
  relations?: Record<string, any>;
};

// Advanced filter options
export type OutsourceOrderDetailFilterOptions = {
  readonly statuses: readonly string[];
  readonly outsourceOrders: readonly Pick<OutsourceOrder, 'id' | 'orderCode' | 'orderTitle'>[];
  readonly assignedUsers: readonly { id: string; fullName: string }[];
  readonly plans: readonly { id: number; planCode: string; planName: string }[];
  readonly products: readonly { id: number; productCode: string; productName: string; category: string | null }[];
  readonly productionSteps: readonly { id: number; stepCode: string; stepName: string; filmSequence: string | null }[];
  readonly datePresets: readonly {
    readonly label: string;
    readonly value: string;
    readonly start: Date;
    readonly end: Date;
  }[];
};
