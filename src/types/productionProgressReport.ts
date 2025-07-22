/**
 * Production Progress Report TypeScript Types and Interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on sp_production_progress_report stored procedure
 */

// ✅ Core data type returned from stored procedure
export type ProductionProgressReportItem = {
  readonly report_type: 'EMPLOYEE_SUMMARY' | 'OUTSOURCE_DETAIL';
  readonly entity_id: string;
  readonly entity_name: string;
  readonly plan_code: string;
  readonly product_code: string;
  readonly product_name: string;
  readonly step_code: string;
  readonly step_name: string;
  readonly total_planned: number;
  readonly total_actual: number;
  readonly total_assigned: number;
  readonly total_received: number;
  readonly total_defect: number;
  readonly total_made: number;
  readonly completion_rate: number;
  readonly remaining_quantity: number;
};

// ✅ Filter parameters for API requests
export type ProductionProgressReportFilters = {
  readonly search?: string;
  readonly plan_code?: string;
  readonly product_code?: string;
  readonly production_step_code?: string;
  readonly report_type?: 'EMPLOYEE_SUMMARY' | 'OUTSOURCE_DETAIL' | 'ALL';
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: string;
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type ProductionProgressReportFiltersWithOwner = ProductionProgressReportFilters & {
  readonly ownerId: string;
};

// ✅ Filter options for dropdown components
export type ProductionProgressReportFilterOptions = {
  readonly plans: readonly { readonly code: string; readonly name: string }[];
  readonly products: readonly { readonly code: string; readonly name: string }[];
  readonly productionSteps: readonly { readonly code: string; readonly name: string }[];
  readonly entities: readonly { readonly id: string; readonly name: string; readonly type: 'EMPLOYEE' | 'OUTSOURCE' }[];
};

// ✅ Summary statistics
export type ProductionProgressReportSummary = {
  readonly total_records: number;
  readonly total_entities: number;
  readonly total_planned: number;
  readonly total_actual: number;
  readonly total_assigned: number;
  readonly total_received: number;
  readonly total_defect: number;
  readonly total_made: number;
  readonly average_completion_rate: number;
  readonly employee_count: number;
  readonly outsource_count: number;
};

// ✅ Pagination information
export type ProductionProgressReportPagination = {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly hasMore: boolean;
};

// ✅ API Response types following established patterns
export type ProductionProgressReportResponse = {
  readonly success: true;
  readonly data: readonly ProductionProgressReportItem[];
  readonly summary: ProductionProgressReportSummary;
  readonly pagination: ProductionProgressReportPagination;
  readonly message?: string;
};

export type ProductionProgressReportFilterOptionsResponse = {
  readonly success: true;
  readonly data: ProductionProgressReportFilterOptions;
  readonly message?: string;
};

export type ProductionProgressReportErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
  readonly validationErrors?: Record<string, string[]>;
};

// ✅ Export parameters
export type ProductionProgressReportExportParams = ProductionProgressReportFilters & {
  readonly format?: 'xlsx' | 'csv';
  readonly includeHeaders?: boolean;
  readonly filename?: string;
};

// ✅ Export response
export type ProductionProgressReportExportResponse = {
  readonly success: true;
  readonly filename: string;
  readonly downloadUrl: string;
  readonly recordCount: number;
  readonly message?: string;
};

// ✅ Filter state for React components (mutable for form handling)
export type ProductionProgressReportFilterState = {
  search: string;
  plan_code: string;
  product_code: string;
  production_step_code: string;
  report_type: 'ALL' | 'EMPLOYEE_SUMMARY' | 'OUTSOURCE_DETAIL';
  sortBy: keyof ProductionProgressReportItem;
  sortOrder: 'asc' | 'desc';
};

// ✅ Table column configuration
export type ProductionProgressReportColumn = {
  readonly key: keyof ProductionProgressReportItem;
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
export type ProductionProgressReportStats = {
  readonly totalRecords: number;
  readonly totalEntities: number;
  readonly totalPlanned: number;
  readonly totalActual: number;
  readonly totalAssigned: number;
  readonly totalReceived: number;
  readonly totalDefect: number;
  readonly totalMade: number;
  readonly averageCompletionRate: number;
  readonly employeeCount: number;
  readonly outsourceCount: number;
  readonly completionRateDistribution: {
    readonly excellent: number; // >= 100%
    readonly good: number; // 80-99%
    readonly average: number; // 50-79%
    readonly poor: number; // < 50%
  };
};

// ✅ Hook return types
export type UseProductionProgressReportResult = {
  readonly data: readonly ProductionProgressReportItem[];
  readonly summary: ProductionProgressReportSummary;
  readonly pagination: ProductionProgressReportPagination;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => void;
};

export type UseProductionProgressReportFiltersResult = {
  readonly filters: ProductionProgressReportFilterState;
  readonly setFilters: (filters: Partial<ProductionProgressReportFilterState>) => void;
  readonly applyFilters: (filters: ProductionProgressReportFilterState) => void;
  readonly resetFilters: () => void;
  readonly hasActiveFilters: boolean;
  readonly activeFilterCount: number;
};

export type UseProductionProgressReportExportResult = {
  readonly exportData: (params: ProductionProgressReportExportParams) => Promise<void>;
  readonly isExporting: boolean;
  readonly exportError: Error | null;
  readonly exportProgress: number;
};

// ✅ Form validation error types
export type ProductionProgressReportValidationError = {
  readonly field: keyof ProductionProgressReportFilters;
  readonly message: string;
  readonly code: string;
};

export type ProductionProgressReportValidationResult = {
  readonly isValid: boolean;
  readonly errors: readonly ProductionProgressReportValidationError[];
};

// ✅ API endpoint paths (for type safety)
export const PRODUCTION_PROGRESS_REPORT_ENDPOINTS = {
  LIST: '/api/production-progress-report',
  EXPORT: '/api/production-progress-report/export',
  FILTER_OPTIONS: '/api/production-progress-report/filter-options',
} as const;

// ✅ Default values and constants
export const PRODUCTION_PROGRESS_REPORT_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SORT_BY: 'plan_code' as const,
  SORT_ORDER: 'asc' as const,
  REPORT_TYPE: 'ALL' as const,
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

// ✅ Report type labels
export const REPORT_TYPE_LABELS = {
  ALL: 'All Reports',
  EMPLOYEE_SUMMARY: 'Employee Summary',
  OUTSOURCE_DETAIL: 'Outsource Detail',
} as const;

// ✅ Export format options
export const EXPORT_FORMATS = {
  XLSX: 'xlsx',
  CSV: 'csv',
} as const;

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];