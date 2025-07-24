/**
 * Employee Delivery Receipt Inventory TypeScript Types and Interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on sp_employee_delivery_receipt_inventory stored procedure
 */

// ✅ Core data type returned from stored procedure
export type EmployeeDeliveryReceiptInventoryItem = {
  readonly employee_id: string;
  readonly employee_name: string;
  readonly plan_code: string;
  readonly product_code: string;
  readonly product_name: string;
  readonly step_code: string;
  readonly step_name: string;
  readonly total_assigned: number;
  readonly total_received: number;
  readonly total_defect: number;
  readonly total_rework: number;
  readonly current_inventory: number;
  readonly completion_rate: number;
};

// ✅ Filter parameters for API requests
export type EmployeeDeliveryReceiptInventoryFilters = {
  readonly search?: string;
  readonly plan_code?: string;
  readonly product_code?: string;
  readonly production_step_code?: string;
  readonly employee_id?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: string;
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type EmployeeDeliveryReceiptInventoryFiltersWithOwner = EmployeeDeliveryReceiptInventoryFilters & {
  readonly ownerId: string;
};

// ✅ Filter options for dropdown components
export type EmployeeDeliveryReceiptInventoryFilterOptions = {
  readonly plans: readonly { readonly code: string; readonly name: string }[];
  readonly products: readonly { readonly code: string; readonly name: string }[];
  readonly productionSteps: readonly { readonly code: string; readonly name: string }[];
  readonly employees: readonly { readonly id: string; readonly name: string }[];
};

// ✅ Summary statistics
export type EmployeeDeliveryReceiptInventorySummary = {
  readonly total_records: number;
  readonly total_employees: number;
  readonly total_assigned: number;
  readonly total_received: number;
  readonly total_defect: number;
  readonly total_rework: number;
  readonly total_inventory: number;
  readonly average_completion_rate: number;
};

// ✅ Pagination information
export type EmployeeDeliveryReceiptInventoryPagination = {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly hasMore: boolean;
};

// ✅ API Response types following established patterns
export type EmployeeDeliveryReceiptInventoryResponse = {
  readonly success: true;
  readonly data: readonly EmployeeDeliveryReceiptInventoryItem[];
  readonly summary: EmployeeDeliveryReceiptInventorySummary;
  readonly pagination: EmployeeDeliveryReceiptInventoryPagination;
  readonly message?: string;
};

export type EmployeeDeliveryReceiptInventoryFilterOptionsResponse = {
  readonly success: true;
  readonly data: EmployeeDeliveryReceiptInventoryFilterOptions;
  readonly message?: string;
};

export type EmployeeDeliveryReceiptInventoryErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
  readonly validationErrors?: Record<string, string[]>;
};

// ✅ Export parameters
export type EmployeeDeliveryReceiptInventoryExportParams = EmployeeDeliveryReceiptInventoryFilters & {
  readonly format?: 'xlsx' | 'csv';
  readonly includeHeaders?: boolean;
  readonly filename?: string;
};

// ✅ Export response
export type EmployeeDeliveryReceiptInventoryExportResponse = {
  readonly success: true;
  readonly filename: string;
  readonly downloadUrl: string;
  readonly recordCount: number;
  readonly message?: string;
};

// ✅ Filter state for React components (mutable for form handling)
export type EmployeeDeliveryReceiptInventoryFilterState = {
  search: string;
  plan_code: string;
  product_code: string;
  production_step_code: string;
  employee_id: string;
  sortBy: keyof EmployeeDeliveryReceiptInventoryItem;
  sortOrder: 'asc' | 'desc';
};

// ✅ Table column configuration
export type EmployeeDeliveryReceiptInventoryColumn = {
  readonly key: keyof EmployeeDeliveryReceiptInventoryItem;
  readonly label: string;
  readonly sortable: boolean;
  readonly width?: string;
  readonly align?: 'left' | 'center' | 'right';
  readonly format?: 'number' | 'percentage' | 'text';
};

// ✅ Completion rate color coding
export type CompletionRateColor = 'success' | 'warning' | 'danger';

export type CompletionRateConfig = {
  readonly value: number;
  readonly color: CompletionRateColor;
  readonly label: string;
};

// ✅ Statistics for dashboard cards
export type EmployeeDeliveryReceiptInventoryStats = {
  readonly totalRecords: number;
  readonly totalEmployees: number;
  readonly totalAssigned: number;
  readonly totalReceived: number;
  readonly totalDefect: number;
  readonly totalRework: number;
  readonly totalInventory: number;
  readonly averageCompletionRate: number;
  readonly completionRateDistribution: {
    readonly excellent: number; // >= 100%
    readonly good: number; // 80-99%
    readonly average: number; // 50-79%
    readonly poor: number; // < 50%
  };
};

// ✅ Hook return types
export type UseEmployeeDeliveryReceiptInventoryResult = {
  readonly data: readonly EmployeeDeliveryReceiptInventoryItem[];
  readonly summary: EmployeeDeliveryReceiptInventorySummary;
  readonly pagination: EmployeeDeliveryReceiptInventoryPagination;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => void;
};

export type UseEmployeeDeliveryReceiptInventoryFiltersResult = {
  readonly filters: EmployeeDeliveryReceiptInventoryFilterState;
  readonly setFilters: (filters: Partial<EmployeeDeliveryReceiptInventoryFilterState>) => void;
  readonly resetFilters: () => void;
  readonly hasActiveFilters: boolean;
  readonly activeFilterCount: number;
};

export type UseEmployeeDeliveryReceiptInventoryExportResult = {
  readonly exportData: (params: EmployeeDeliveryReceiptInventoryExportParams) => Promise<void>;
  readonly isExporting: boolean;
  readonly exportError: Error | null;
  readonly exportProgress: number;
};

// ✅ Form validation error types
export type EmployeeDeliveryReceiptInventoryValidationError = {
  readonly field: keyof EmployeeDeliveryReceiptInventoryFilters;
  readonly message: string;
  readonly code: string;
};

export type EmployeeDeliveryReceiptInventoryValidationResult = {
  readonly isValid: boolean;
  readonly errors: readonly EmployeeDeliveryReceiptInventoryValidationError[];
};

// ✅ API endpoint paths (for type safety)
export const EMPLOYEE_DELIVERY_RECEIPT_INVENTORY_ENDPOINTS = {
  LIST: '/api/employeeDeliveryReceiptInventory',
  EXPORT: '/api/employeeDeliveryReceiptInventory/export',
  FILTER_OPTIONS: '/api/employeeDeliveryReceiptInventory/filter-options',
} as const;

// ✅ Default values and constants
export const EMPLOYEE_DELIVERY_RECEIPT_INVENTORY_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SORT_BY: 'employee_name' as const,
  SORT_ORDER: 'asc' as const,
  COMPLETION_RATE_THRESHOLDS: {
    EXCELLENT: 100,
    GOOD: 80,
    AVERAGE: 50,
  },
} as const;

// ✅ Color coding for completion rates
export const COMPLETION_RATE_COLORS: Record<string, CompletionRateColor> = {
  EXCELLENT: 'success', // >= 100%
  GOOD: 'success', // 80-99%
  AVERAGE: 'warning', // 50-79%
  POOR: 'danger', // < 50%
} as const;

// ✅ Export format options
export const EXPORT_FORMATS = {
  XLSX: 'xlsx',
  CSV: 'csv',
} as const;

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];
