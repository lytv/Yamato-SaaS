/**
 * Satellite Progress TypeScript Types and Interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on sp_satellite_progress_pivot stored procedure
 */

// ✅ Core data type returned from stored procedure
export type SatelliteProgressItem = {
  readonly product_code: string;
  readonly product_name: string;
  readonly plan_code: string;
  readonly plan_name: string;
  readonly assigned_user_name: string;
  readonly planned_quantity: number;
  readonly total_completed: number;
  readonly completion_rate: number;

  // Dynamic step columns (supporting unlimited steps)
  readonly step_code_1?: string | null;
  readonly step_name_1?: string | null;
  readonly step_quantity_1?: number;
  readonly step_code_2?: string | null;
  readonly step_name_2?: string | null;
  readonly step_quantity_2?: number;
  readonly step_code_3?: string | null;
  readonly step_name_3?: string | null;
  readonly step_quantity_3?: number;
  readonly step_code_4?: string | null;
  readonly step_name_4?: string | null;
  readonly step_quantity_4?: number;
  readonly step_code_5?: string | null;
  readonly step_name_5?: string | null;
  readonly step_quantity_5?: number;
  readonly step_code_6?: string | null;
  readonly step_name_6?: string | null;
  readonly step_quantity_6?: number;
  readonly step_code_7?: string | null;
  readonly step_name_7?: string | null;
  readonly step_quantity_7?: number;
  readonly step_code_8?: string | null;
  readonly step_name_8?: string | null;
  readonly step_quantity_8?: number;
  readonly step_code_9?: string | null;
  readonly step_name_9?: string | null;
  readonly step_quantity_9?: number;
  readonly step_code_10?: string | null;
  readonly step_name_10?: string | null;
  readonly step_quantity_10?: number;

  // Add more steps up to 150 as needed
  readonly [key: string]: string | number | null | undefined;
};

// ✅ Filter parameters for API requests
export type SatelliteProgressFilters = {
  readonly search?: string;
  readonly plan_code?: string;
  readonly product_code?: string;
  readonly assigned_user_id?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: string;
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type SatelliteProgressFiltersWithOwner = SatelliteProgressFilters & {
  readonly ownerId: string;
};

// ✅ Filter options for dropdown components
export type SatelliteProgressFilterOptions = {
  readonly plans: readonly { readonly code: string; readonly name: string }[];
  readonly products: readonly { readonly code: string; readonly name: string }[];
  readonly users: readonly { readonly user_id: string; readonly user_name: string }[];
  readonly steps: readonly { readonly code: string; readonly name: string }[];
};

// ✅ Summary statistics
export type SatelliteProgressSummary = {
  readonly total_records: number;
  readonly total_planned: number;
  readonly total_completed: number;
  readonly average_completion_rate: number;
  readonly users_count: number;
  readonly plans_count: number;
};

// ✅ Pagination information
export type SatelliteProgressPagination = {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly hasMore: boolean;
};

// ✅ API Response types following established patterns
export type SatelliteProgressResponse = {
  readonly success: true;
  readonly data: readonly SatelliteProgressItem[];
  readonly summary: SatelliteProgressSummary;
  readonly pagination: SatelliteProgressPagination;
  readonly message?: string;
};

export type SatelliteProgressFilterOptionsResponse = {
  readonly success: true;
  readonly data: SatelliteProgressFilterOptions;
  readonly message?: string;
};

export type SatelliteProgressErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
  readonly validationErrors?: Record<string, string[]>;
};

// ✅ Export parameters
export type SatelliteProgressExportParams = SatelliteProgressFilters & {
  readonly format?: 'xlsx' | 'csv';
  readonly includeHeaders?: boolean;
  readonly filename?: string;
};

// ✅ Export response
export type SatelliteProgressExportResponse = {
  readonly success: true;
  readonly filename: string;
  readonly downloadUrl: string;
  readonly recordCount: number;
  readonly message?: string;
};

// ✅ Filter state for React components (mutable for form handling)
export type SatelliteProgressFilterState = {
  search: string;
  plan_code: string;
  product_code: string;
  assigned_user_id: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

// ✅ Table column configuration
export type SatelliteProgressColumn = {
  readonly key: keyof SatelliteProgressItem | 'dynamic_step';
  readonly label: string;
  readonly sortable: boolean;
  readonly width?: string;
  readonly align?: 'left' | 'center' | 'right';
  readonly format?: 'number' | 'percentage' | 'text';
  readonly stepIndex?: number; // For dynamic step columns
};

// ✅ Dynamic step column for pivot display
export type DynamicStepColumn = {
  readonly stepIndex: number;
  readonly stepCode: string;
  readonly stepName: string;
  readonly quantity: number;
};

// ✅ Hook return types
export type UseSatelliteProgressResult = {
  readonly data: readonly SatelliteProgressItem[];
  readonly summary: SatelliteProgressSummary;
  readonly pagination: SatelliteProgressPagination;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => void;
};

export type UseSatelliteProgressFiltersResult = {
  readonly filters: SatelliteProgressFilterState;
  readonly setFilters: (filters: Partial<SatelliteProgressFilterState>) => void;
  readonly applyFilters: (filters: SatelliteProgressFilterState) => void;
  readonly resetFilters: () => void;
  readonly hasActiveFilters: boolean;
  readonly activeFilterCount: number;
};

export type UseSatelliteProgressExportResult = {
  readonly exportData: (params: SatelliteProgressExportParams) => Promise<void>;
  readonly isExporting: boolean;
  readonly exportError: Error | null;
  readonly exportProgress: number;
};

// ✅ Form validation error types
export type SatelliteProgressValidationError = {
  readonly field: keyof SatelliteProgressFilters;
  readonly message: string;
  readonly code: string;
};

export type SatelliteProgressValidationResult = {
  readonly isValid: boolean;
  readonly errors: readonly SatelliteProgressValidationError[];
};

// ✅ API endpoint paths (for type safety)
export const SATELLITE_PROGRESS_ENDPOINTS = {
  LIST: '/api/satellite-progress',
  EXPORT: '/api/satellite-progress/export',
  FILTER_OPTIONS: '/api/satellite-progress/filter-options',
} as const;

// ✅ Default values and constants
export const SATELLITE_PROGRESS_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SORT_BY: 'product_code' as const,
  SORT_ORDER: 'asc' as const,
  COMPLETION_RATE_THRESHOLDS: {
    EXCELLENT: 100,
    GOOD: 80,
    AVERAGE: 50,
  },
} as const;

// ✅ Export format options
export const EXPORT_FORMATS = {
  XLSX: 'xlsx',
  CSV: 'csv',
} as const;

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];
