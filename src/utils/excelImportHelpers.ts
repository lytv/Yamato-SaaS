/**
 * Excel Import Helper Functions
 * Following TypeScript Type Safety Standards
 * Parses Excel files for product import functionality
 * Uses existing xlsx library and validation patterns
 */

import type { Buffer } from 'node:buffer';

import * as XLSX from 'xlsx';

import { validateImportProductRow } from '@/libs/validations/product';
import type { ImportError, ImportProductData, ImportValidationResult } from '@/types/import';

/**
 * Parse Excel file buffer and extract product data
 * @param buffer - Excel file buffer
 * @returns Promise resolving to array of import product data
 */
export async function parseExcelFile(buffer: Buffer): Promise<ImportProductData[]> {
  try {
    // Read workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get first worksheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel file contains no worksheets');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      throw new Error('Unable to read worksheet data');
    }

    // Convert to JSON array
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Excel file contains no data');
    }

    // Extract headers from first row
    const headers = rawData[0] as string[];
    const expectedHeaders = ['Product Code', 'Product Name', 'Category', 'Notes'];

    // Validate headers
    const hasRequiredHeaders = expectedHeaders.slice(0, 2).every(header =>
      headers.some(h => h && h.toString().toLowerCase().trim() === header.toLowerCase()),
    );

    if (!hasRequiredHeaders) {
      throw new Error('Excel file must contain headers: Product Code, Product Name (Category and Notes are optional)');
    }

    // Map header indices
    const headerMap = {
      productCode: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'product code'),
      productName: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'product name'),
      category: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'category'),
      notes: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'notes'),
    };

    // Process data rows (skip header row)
    const products: ImportProductData[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as (string | number | undefined)[];
      const rowNumber = i + 1; // Excel row number (1-based)

      // Skip empty rows
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        continue;
      }

      // Extract cell values
      const productCode = headerMap.productCode >= 0 ? (row[headerMap.productCode]?.toString().trim() || '') : '';
      const productName = headerMap.productName >= 0 ? (row[headerMap.productName]?.toString().trim() || '') : '';
      const category = headerMap.category >= 0 ? (row[headerMap.category]?.toString().trim() || '') : '';
      const notes = headerMap.notes >= 0 ? (row[headerMap.notes]?.toString().trim() || '') : '';

      // Create product data
      const productData: ImportProductData = {
        productCode,
        productName,
        category: category || undefined,
        notes: notes || undefined,
        rowNumber,
      };

      products.push(productData);
    }

    return products;
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to parse Excel file: ${error.message}`);
    }
    throw new Error('Failed to parse Excel file: Unknown error');
  }
}

/**
 * Validate imported product data using existing validation schemas
 * @param data - Array of import product data
 * @returns Validation result with valid products and errors
 */
export function validateImportData(data: ImportProductData[]): ImportValidationResult {
  const validProducts: ImportProductData[] = [];
  const errors: ImportError[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'No data found in Excel file', value: null }],
      validProducts: [],
    };
  }

  // Check for maximum row limit
  if (data.length > 1000) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'Maximum 1000 rows allowed', value: data.length }],
      validProducts: [],
    };
  }

  // Track unique product codes to detect duplicates within the file
  const seenProductCodes = new Set<string>();

  for (const productData of data) {
    try {
      // Validate using existing schema
      const validated = validateImportProductRow(productData);

      // Check for duplicate product codes within the import file
      if (seenProductCodes.has(validated.productCode.toLowerCase())) {
        errors.push({
          rowNumber: productData.rowNumber,
          field: 'productCode',
          message: 'Duplicate product code within import file',
          value: validated.productCode,
        });
        continue;
      }

      seenProductCodes.add(validated.productCode.toLowerCase());
      validProducts.push(validated);
    } catch (error) {
      // Handle validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        // Zod validation error
        const zodError = error as { issues: Array<{ path: string[]; message: string }> };
        for (const issue of zodError.issues) {
          errors.push({
            rowNumber: productData.rowNumber,
            field: issue.path[0] || 'unknown',
            message: issue.message,
            value: productData[issue.path[0] as keyof ImportProductData],
          });
        }
      } else {
        // Generic error
        const errorMessage = error instanceof Error ? error.message : 'Validation failed';
        errors.push({
          rowNumber: productData.rowNumber,
          field: 'general',
          message: errorMessage,
          value: productData.productCode,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validProducts,
  };
}

/**
 * Format import errors for UI display
 * @param errors - Array of import errors
 * @returns Array of formatted error messages
 */
export function formatImportErrors(errors: ImportError[]): string[] {
  return errors.map((error) => {
    if (error.rowNumber === 0) {
      return error.message;
    }
    return `Row ${error.rowNumber}: ${error.message} (${error.field}: ${error.value})`;
  });
}

/**
 * Create template Excel file for import
 * @returns Buffer containing template Excel file
 */
export function generateImportTemplate(): Buffer {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Create template data with headers and example rows
  const templateData = [
    ['Product Code', 'Product Name', 'Category', 'Notes'],
    ['PROD-001', 'Example Product 1', 'Electronics', 'Sample product for demonstration'],
    ['PROD-002', 'Example Product 2', 'Software', 'Another sample product'],
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);

  // Set column widths
  const columnWidths = [
    { wch: 15 }, // Product Code
    { wch: 30 }, // Product Name
    { wch: 20 }, // Category
    { wch: 40 }, // Notes
  ];
  worksheet['!cols'] = columnWidths;

  // Add instructions sheet
  const instructionsSheet = XLSX.utils.json_to_sheet([
    { Field: 'Instructions', Value: 'Fill in your product data using the template format' },
    { Field: 'Required Fields', Value: 'Product Code and Product Name are required' },
    { Field: 'Optional Fields', Value: 'Category and Notes are optional' },
    { Field: 'Product Code Rules', Value: 'Only letters, numbers, underscores and dashes allowed' },
    { Field: 'Maximum Rows', Value: '1000 products per import' },
    { Field: 'File Size Limit', Value: '10MB maximum' },
  ]);

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Template');
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // Generate buffer
  const templateBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    compression: true,
  });

  return templateBuffer;
}
