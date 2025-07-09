/**
 * OutsourceOrderReceipt-related TypeScript types and interfaces
 * Enhanced version with proper error handling, type safety and relationships support
 * Generated based on existing pattern from outsourceOrderDetail types
 */

import type { outsourceOrderReceiptSchema } from '@/models/Schema';
import type { OutsourceOrderDetail } from '@/types/outsourceOrderDetail';
import type { UserSync } from '@/types/userSync';

// Infer the OutsourceOrderReceiptDb type from Drizzle schema
export type OutsourceOrderReceiptDb = typeof outsourceOrderReceiptSchema.$inferSelect;

// Client-side OutsourceOrderReceipt type with proper date handling
export type OutsourceOrderReceipt = Omit<OutsourceOrderReceiptDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// OutsourceOrderReceipt with relations
export type OutsourceOrderReceiptWithRelations = OutsourceOrderReceipt & {
  // Relations types
  outsourceOrderDetail?: Pick<OutsourceOrderDetail, 'id' | 'planCode' | 'planName' | 'productCode' | 'productName' | 'stepCode' | 'stepName' | 'orderedQuantity' | 'completedQuantity'>;
  receivedByUser?: Pick<UserSync, 'id' | 'fullName'>;
  inspectedByUser?: Pick<UserSync, 'id' | 'fullName'>;
  deliveredByUser?: Pick<UserSync, 'id' | 'fullName'>;
};

// Form data type for React Hook Form
export type OutsourceOrderReceiptFormData = {
  outsourceOrderDetailId: number;
  receiptNumber: string;
  receiptTitle?: string;
  receiptQuantity: number;
  receiptDate: Date | string;
  plannedReceiptDate?: Date | string;
  qualityStatus?: string;
  qualityScore?: number;
  defectQuantity?: number;
  reworkQuantity?: number;
  qualityNotes?: string;
  receivedByUserId: string;
  inspectedByUserId?: string;
  deliveredByUserId?: string;
  batchNumber?: string;
  storageLocation?: string;
  warehouseCode?: string;
  actualUnitCost?: number;
  totalCost?: number;
  notes?: string;
  attachments?: string;
  status?: string;
  isPartialReceipt?: boolean;
};

// Input types for CRUD operations with proper validation
export type CreateOutsourceOrderReceiptInput = {
  ownerId: string;
  outsourceOrderDetailId: number;
  receiptNumber: string;
  receiptTitle?: string;
  receiptQuantity: number;
  receiptDate: Date;
  plannedReceiptDate?: Date;
  qualityStatus?: string;
  qualityScore?: number;
  defectQuantity?: number;
  reworkQuantity?: number;
  qualityNotes?: string;
  receivedByUserId: string;
  inspectedByUserId?: string;
  deliveredByUserId?: string;
  batchNumber?: string;
  storageLocation?: string;
  warehouseCode?: string;
  actualUnitCost?: number;
  totalCost?: number;
  notes?: string;
  attachments?: string;
  status?: string;
  isPartialReceipt?: boolean;
};

export type UpdateOutsourceOrderReceiptInput = {
  outsourceOrderDetailId?: number;
  receiptNumber?: string;
  receiptTitle?: string;
  receiptQuantity?: number;
  receiptDate?: Date | string;
  plannedReceiptDate?: Date | string;
  qualityStatus?: string;
  qualityScore?: number;
  defectQuantity?: number;
  reworkQuantity?: number;
  qualityNotes?: string;
  receivedByUserId?: string;
  inspectedByUserId?: string;
  deliveredByUserId?: string;
  batchNumber?: string;
  storageLocation?: string;
  warehouseCode?: string;
  actualUnitCost?: number;
  totalCost?: number;
  notes?: string;
  attachments?: string;
  status?: string;
  isPartialReceipt?: boolean;
};

// Relation options for dropdowns and selectors
export type OutsourceOrderReceiptRelationOptions = {
  readonly outsourceOrderDetails: readonly Pick<OutsourceOrderDetail, 'id' | 'planCode' | 'planName' | 'productCode' | 'productName' | 'stepCode' | 'stepName' | 'orderedQuantity' | 'completedQuantity'>[];
  readonly users: readonly Pick<UserSync, 'userId' | 'fullName'>[];
};

// Enhanced relation options with search and pagination
export type OutsourceOrderReceiptRelationSearchOptions = {
  readonly query?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly outsourceOrderDetailId?: number;
};

export type OutsourceOrderReceiptRelationSearchResult<T = any> = {
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
export type OutsourceOrderReceiptResponse = {
  readonly success: true;
  readonly data: OutsourceOrderReceiptWithRelations;
  readonly message?: string;
};

export type OutsourceOrderReceiptsResponse = {
  readonly success: true;
  readonly data: readonly OutsourceOrderReceiptWithRelations[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

export type OutsourceOrderReceiptErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// List parameters
export type OutsourceOrderReceiptListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'receiptDate' | 'receiptNumber';
  readonly sortOrder?: 'asc' | 'desc';
  readonly showAll?: boolean;
  readonly includeRelations?: boolean;
  readonly outsourceOrderDetailId?: number;
  readonly qualityStatus?: string;
  readonly status?: string;
  readonly receivedByUserId?: string;
  readonly batchNumber?: string;
};

export type OutsourceOrderReceiptListParamsWithOwner = OutsourceOrderReceiptListParams & {
  readonly ownerId: string;
};

// Export parameters for Excel functionality
export type OutsourceOrderReceiptExportParams = OutsourceOrderReceiptListParams & {
  readonly format?: 'xlsx' | 'csv';
  readonly includeHeaders?: boolean;
  readonly filename?: string;
};

// Import validation result
export type ImportOutsourceOrderReceiptResult = {
  readonly success: boolean;
  readonly imported: number;
  readonly failed: number;
  readonly errors: readonly string[];
  readonly outsourceOrderReceipts: readonly OutsourceOrderReceipt[];
  readonly duplicates?: readonly string[];
  readonly warnings?: readonly string[];
};

// Statistics type
export type OutsourceOrderReceiptStats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly byQualityStatus?: Record<string, number>;
  readonly byStatus?: Record<string, number>;
  readonly byDetailItem?: Record<string, number>;
  readonly totalReceiptQuantity?: number;
  readonly totalDefectQuantity?: number;
  readonly totalReworkQuantity?: number;
  readonly averageQualityScore?: number;
  readonly defectRate?: number;
  readonly totalCost?: number;
  readonly trends?: {
    readonly daily: Record<string, number>;
    readonly weekly: Record<string, number>;
    readonly monthly: Record<string, number>;
  };
};

export type OutsourceOrderReceiptStatsResponse = {
  readonly success: true;
  readonly data: OutsourceOrderReceiptStats;
};

// Filter state
export type OutsourceOrderReceiptFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'receiptDate' | 'receiptNumber';
  sortOrder: 'asc' | 'desc';
  outsourceOrderDetailId?: number;
  qualityStatus?: string;
  status?: string;
  receivedByUserId?: string;
  batchNumber?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  relations?: Record<string, any>;
};

// Advanced filter options
export type OutsourceOrderReceiptFilterOptions = {
  readonly qualityStatuses: readonly string[];
  readonly statuses: readonly string[];
  readonly outsourceOrderDetails: readonly Pick<OutsourceOrderDetail, 'id' | 'planCode' | 'planName' | 'productCode' | 'productName' | 'stepCode' | 'stepName'>[];
  readonly users: readonly Pick<UserSync, 'userId' | 'fullName'>[];
  readonly datePresets: readonly {
    readonly label: string;
    readonly value: string;
    readonly start: Date;
    readonly end: Date;
  }[];
};
