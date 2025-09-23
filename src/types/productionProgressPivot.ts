/**
 * Production Progress Pivot TypeScript Types and Interfaces
 * Based on sp_production_progress_pivot stored procedure
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 */

// ✅ Helper type for dynamic step fields
type DynamicStepFields = {
  [K in `step_code_${number}` | `step_name_${number}` | `step_quantity_${number}`]:
  K extends `step_quantity_${number}` ? number : string | null;
};

// ✅ Core data type returned from stored procedure (now supports up to 20 dynamic steps)
export type ProductionProgressPivotItem = {
  readonly product_code: string;
  readonly product_name: string;
  readonly plan_code: string;
  readonly plan_name: string;
  readonly planned_quantity: number;
  readonly total_completed: number;
  readonly completion_rate: number;
} & DynamicStepFields;

// ✅ Filter parameters for API requests
export type ProductionProgressPivotFilters = {
  readonly search?: string;
  readonly product_code?: string;
  readonly plan_code?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: string;
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type ProductionProgressPivotFiltersWithOwner = ProductionProgressPivotFilters & {
  readonly ownerId: string;
};

// ✅ Filter options for dropdown components
export type ProductionProgressPivotFilterOptions = {
  readonly plans: readonly { readonly code: string; readonly name: string }[];
  readonly products: readonly { readonly code: string; readonly name: string }[];
  readonly steps: readonly { readonly code: string; readonly name: string }[];
};

// ✅ Summary statistics
export type ProductionProgressPivotSummary = {
  readonly total_records: number;
  readonly total_planned: number;
  readonly total_completed: number;
  readonly average_completion_rate: number;
  readonly products_count: number;
  readonly plans_count: number;
};

// ✅ Pagination information
export type ProductionProgressPivotPagination = {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly hasMore: boolean;
};

// ✅ API Response types following established patterns
export type ProductionProgressPivotResponse = {
  readonly success: true;
  readonly data: readonly ProductionProgressPivotItem[];
  readonly summary: ProductionProgressPivotSummary;
  readonly pagination: ProductionProgressPivotPagination;
  readonly message?: string;
};

export type ProductionProgressPivotFilterOptionsResponse = {
  readonly success: true;
  readonly data: ProductionProgressPivotFilterOptions;
  readonly message?: string;
};

export type ProductionProgressPivotErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
  readonly validationErrors?: Record<string, string[]>;
};

// ✅ Export parameters
export type ProductionProgressPivotExportParams = ProductionProgressPivotFilters & {
  readonly format?: 'xlsx' | 'csv';
  readonly includeHeaders?: boolean;
  readonly filename?: string;
};

// ✅ Export response
export type ProductionProgressPivotExportResponse = {
  readonly success: true;
  readonly filename: string;
  readonly downloadUrl: string;
  readonly recordCount: number;
  readonly message?: string;
};

// ✅ Filter state for React components (mutable for form handling)
export type ProductionProgressPivotFilterState = {
  search: string;
  product_code: string;
  plan_code: string;
  sortBy: keyof ProductionProgressPivotItem;
  sortOrder: 'asc' | 'desc';
};

// ✅ Table column configuration
export type ProductionProgressPivotColumn = {
  readonly key: keyof ProductionProgressPivotItem | 'dynamic_step';
  readonly label: string;
  readonly sortable: boolean;
  readonly width?: string;
  readonly align?: 'left' | 'center' | 'right';
  readonly format?: 'number' | 'percentage' | 'text';
  readonly stepIndex?: number; // For dynamic step columns
};

// ✅ Dynamic step column for rendering
export type DynamicStepColumn = {
  readonly stepIndex: number;
  readonly stepCode: string | null;
  readonly stepName: string | null;
  readonly quantity: number;
};

// ✅ Hook return types
export type UseProductionProgressPivotResult = {
  readonly data: readonly ProductionProgressPivotItem[];
  readonly summary: ProductionProgressPivotSummary;
  readonly pagination: ProductionProgressPivotPagination;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => void;
};

export type UseProductionProgressPivotFiltersResult = {
  readonly filters: ProductionProgressPivotFilterState;
  readonly setFilters: (filters: Partial<ProductionProgressPivotFilterState>) => void;
  readonly applyFilters: (filters: ProductionProgressPivotFilterState) => void;
  readonly resetFilters: () => void;
  readonly hasActiveFilters: boolean;
  readonly activeFilterCount: number;
};

export type UseProductionProgressPivotExportResult = {
  readonly exportData: (params: ProductionProgressPivotExportParams) => Promise<void>;
  readonly isExporting: boolean;
  readonly exportError: Error | null;
  readonly exportProgress: number;
};

// ✅ Form validation error types
export type ProductionProgressPivotValidationError = {
  readonly field: keyof ProductionProgressPivotFilters;
  readonly message: string;
  readonly code: string;
};

export type ProductionProgressPivotValidationResult = {
  readonly isValid: boolean;
  readonly errors: readonly ProductionProgressPivotValidationError[];
};

// ✅ API endpoint paths (for type safety)
export const PRODUCTION_PROGRESS_PIVOT_ENDPOINTS = {
  LIST: '/api/production-progress-pivot',
  EXPORT: '/api/production-progress-pivot/export',
  FILTER_OPTIONS: '/api/production-progress-pivot/filter-options',
} as const;

// ✅ Default values and constants
export const PRODUCTION_PROGRESS_PIVOT_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SORT_BY: 'product_code' as const,
  SORT_ORDER: 'asc' as const,
  MAX_STEPS: 150,
} as const;

// ✅ Completion rate colors
export const PIVOT_COMPLETION_RATE_COLORS = {
  EXCELLENT: 'success', // >= 100%
  GOOD: 'success', // 80-99%
  AVERAGE: 'warning', // 50-79%
  POOR: 'danger', // < 50%
} as const;

// ✅ Export format options
export const PIVOT_EXPORT_FORMATS = {
  XLSX: 'xlsx',
  CSV: 'csv',
} as const;

export type PivotExportFormat = typeof PIVOT_EXPORT_FORMATS[keyof typeof PIVOT_EXPORT_FORMATS];
