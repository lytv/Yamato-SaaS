/**
 * Export-related TypeScript types and interfaces
 * Following TypeScript Type Safety Standards
 * Used for Excel export functionality
 */

import type { ProductListParams } from '@/types/product';

// ✅ Export parameters (extends ProductListParams but removes pagination)
export type ProductExportParams = Omit<ProductListParams, 'page' | 'limit'> & {
  readonly ownerId?: string;
};

// ✅ Export response types
export type ExportResponse = {
  readonly success: true;
  readonly data: {
    readonly filename: string;
    readonly fileSize: number;
    readonly recordCount: number;
  };
  readonly message?: string;
};

export type ExportErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// ✅ Export hook state
export type ExportState = {
  readonly isExporting: boolean;
  readonly exportError: string | null;
  readonly lastExportDate: Date | null;
};

// ✅ Export hook return type
export type ExportHookReturn = ExportState & {
  readonly exportProducts: (params?: ProductExportParams) => Promise<void>;
  readonly clearError: () => void;
};

// ✅ Export validation result
export type ExportValidationResult = {
  readonly isValid: boolean;
  readonly error?: string;
  readonly maxRecords?: number;
};

// ✅ Export file metadata
export type ExportFileMetadata = {
  readonly filename: string;
  readonly contentType: string;
  readonly size: number;
  readonly generatedAt: string;
  readonly recordCount: number;
};

// ✅ Export configuration
export type ExportConfig = {
  readonly maxRecords: number;
  readonly fileFormat: 'xlsx' | 'csv';
  readonly includeMetadata: boolean;
  readonly compressionEnabled: boolean;
};

// ✅ Default export configuration
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  maxRecords: 5000,
  fileFormat: 'xlsx',
  includeMetadata: true,
  compressionEnabled: true,
} as const;
