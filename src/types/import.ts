/**
 * Import Types
 * Type definitions for Excel import functionality
 * Following existing product type patterns
 */

import type { Product } from './product';

// Simplified types following existing patterns
export type ImportProductData = {
  productCode: string;
  productName: string;
  category?: string;
  notes?: string;
  rowNumber: number;
};

export type ImportError = {
  rowNumber: number;
  field: string;
  message: string;
  value: any;
};

export type ImportResult = {
  totalRows: number;
  successCount: number;
  errorCount: number;
  createdProducts: Product[];
  errors: ImportError[];
};

export type ImportValidationResult = {
  isValid: boolean;
  errors: ImportError[];
  validProducts: ImportProductData[];
};
