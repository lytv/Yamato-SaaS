/**
 * Price Summary TypeScript Types and Interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on sp_product_price_pivot stored procedure
 */

// ✅ Price types available in the system
export type PriceType = 'factory_price' | 'calculated_price' | 'retail_price';

// ✅ Price type options for dropdown
export type PriceTypeOption = {
  readonly value: PriceType;
  readonly label: string;
  readonly description: string;
};

// ✅ Dynamic step data structure from stored procedure
export type PriceStepData = {
  readonly step_code: string;
  readonly step_name: string;
  readonly sequence_number: number;
  readonly price: number;
};

// ✅ Core data type returned from stored procedure
export type PriceSummaryItem = {
  readonly product_code: string;
  readonly product_name: string;
  readonly step_data: Record<string, PriceStepData>; // JSONB converted to object
  readonly total_steps: number;
  readonly total_price: number;
  readonly has_pricing: boolean;
};

// ✅ Filter parameters for API requests
export type PriceSummaryFilters = {
  readonly search?: string;
  readonly product_code?: string;
  readonly price_type?: PriceType;
  readonly show_only_with_pricing?: boolean;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type PriceSummaryFiltersWithOwner = PriceSummaryFilters & {
  readonly ownerId: string;
};

// ✅ Filter options for dropdown components
export type PriceSummaryFilterOptions = {
  readonly products: readonly { readonly code: string; readonly name: string }[];
  readonly price_types: readonly PriceTypeOption[];
  readonly steps: readonly { readonly code: string; readonly name: string }[];
};

// ✅ Summary statistics
export type PriceSummarySummary = {
  readonly total_records: number;
  readonly total_products: number;
  readonly total_steps_with_pricing: number;
  readonly average_price_per_product: number;
  readonly highest_priced_product: string;
  readonly lowest_priced_product: string;
};

// ✅ Pagination information
export type PriceSummaryPagination = {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly hasMore: boolean;
};

// ✅ API Response types following established patterns
export type PriceSummaryResponse = {
  readonly success: true;
  readonly data: readonly PriceSummaryItem[];
  readonly summary: PriceSummarySummary;
  readonly pagination: PriceSummaryPagination;
  readonly message?: string;
};

export type PriceSummaryFilterOptionsResponse = {
  readonly success: true;
  readonly data: PriceSummaryFilterOptions;
  readonly message?: string;
};

export type PriceSummaryErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
  readonly validationErrors?: Record<string, string[]>;
};

// ✅ Export parameters
export type PriceSummaryExportParams = PriceSummaryFilters & {
  readonly format?: 'xlsx' | 'csv';
  readonly includeHeaders?: boolean;
  readonly filename?: string;
};

// ✅ Export response
export type PriceSummaryExportResponse = {
  readonly success: true;
  readonly filename: string;
  readonly downloadUrl: string;
  readonly recordCount: number;
  readonly message?: string;
};

// ✅ Filter state for React components (mutable for form handling)
export type PriceSummaryFilterState = {
  search: string;
  product_code: string;
  price_type: PriceType;
  show_only_with_pricing: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

// ✅ Table column configuration for pivot display
export type PriceSummaryColumn = {
  readonly key: keyof PriceSummaryItem | 'dynamic_step';
  readonly label: string;
  readonly sortable: boolean;
  readonly width?: string;
  readonly align?: 'left' | 'center' | 'right';
  readonly format?: 'number' | 'currency' | 'text';
  readonly stepCode?: string; // For dynamic step columns
  readonly sticky?: boolean; // For sticky columns
};

// ✅ Dynamic step column for pivot display
export type DynamicPriceColumn = {
  readonly stepCode: string;
  readonly stepName: string;
  readonly sequenceNumber: number;
  readonly price: number;
};

// ✅ Hook return types
export type UsePriceSummaryResult = {
  readonly data: readonly PriceSummaryItem[];
  readonly summary: PriceSummarySummary;
  readonly pagination: PriceSummaryPagination;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => void;
};

export type UsePriceSummaryFiltersResult = {
  readonly filters: PriceSummaryFilterState;
  readonly setFilters: (filters: Partial<PriceSummaryFilterState>) => void;
  readonly applyFilters: (filters: PriceSummaryFilterState) => void;
  readonly resetFilters: () => void;
  readonly hasActiveFilters: boolean;
  readonly activeFilterCount: number;
};

export type UsePriceSummaryExportResult = {
  readonly exportData: (params: PriceSummaryExportParams) => Promise<void>;
  readonly isExporting: boolean;
  readonly exportError: Error | null;
  readonly exportProgress: number;
};

// ✅ Form validation error types
export type PriceSummaryValidationError = {
  readonly field: keyof PriceSummaryFilters;
  readonly message: string;
  readonly code: string;
};

export type PriceSummaryValidationResult = {
  readonly isValid: boolean;
  readonly errors: readonly PriceSummaryValidationError[];
};

// ✅ API endpoint paths (for type safety)
export const PRICE_SUMMARY_ENDPOINTS = {
  LIST: '/api/price-summary',
  EXPORT: '/api/price-summary/export',
  FILTER_OPTIONS: '/api/price-summary/filter-options',
} as const;

// ✅ Default values and constants
export const PRICE_SUMMARY_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SORT_BY: 'product_code' as const,
  SORT_ORDER: 'asc' as const,
  PRICE_TYPE: 'factory_price' as const,
  SHOW_ONLY_WITH_PRICING: false as const,
} as const;

// ✅ Price type options with Vietnamese labels
export const PRICE_TYPE_OPTIONS: readonly PriceTypeOption[] = [
  {
    value: 'factory_price',
    label: 'Đơn giá xưởng',
    description: 'Giá sản xuất tại xưởng',
  },
  {
    value: 'calculated_price',
    label: 'Đơn giá về tính',
    description: 'Giá tính toán chi phí',
  },
  {
    value: 'retail_price',
    label: 'Đơn giá bán lẻ',
    description: 'Giá bán lẻ cho khách hàng',
  },
] as const;

// ✅ Export format options
export const EXPORT_FORMATS = {
  XLSX: 'xlsx',
  CSV: 'csv',
} as const;

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];

// ✅ Currency formatting helper type
export type CurrencyFormatOptions = {
  readonly locale?: string;
  readonly currency?: string;
  readonly minimumFractionDigits?: number;
  readonly maximumFractionDigits?: number;
};
