/**
 * Import Types
 * Type definitions for Excel import functionality
 * Following existing product type patterns
 */

import type { Product } from './product';
import type { ProductionStep } from './productionStep';

// Simplified types following existing patterns
export type ImportProductData = {
  productCode: string;
  productName: string;
  category?: string;
  notes?: string;
  rowNumber: number;
};

export type ImportProductionStepData = {
  stepCode: string;
  stepName: string;
  filmSequence?: string;
  stepGroup?: string;
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

export type ImportProductionStepResult = {
  totalRows: number;
  successCount: number;
  errorCount: number;
  createdProductionSteps: ProductionStep[];
  errors: ImportError[];
};

export type ImportValidationResult = {
  isValid: boolean;
  errors: ImportError[];
  validProducts: ImportProductData[];
};

export type ImportProductionStepValidationResult = {
  isValid: boolean;
  errors: ImportError[];
  validProducts: ImportProductionStepData[];
};
