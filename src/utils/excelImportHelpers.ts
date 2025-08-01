/**
 * Excel Import Helper Functions
 * Following TypeScript Type Safety Standards
 * Parses Excel files for product import functionality
 * Uses existing xlsx library and validation patterns
 */

import type { Buffer } from 'node:buffer';

import * as XLSX from 'xlsx';

import { validateImportProductRow } from '@/libs/validations/product';
import { validateImportProductionStepRow } from '@/libs/validations/productionStep';
import { validateImportUserSyncRow } from '@/libs/validations/user_sync';
import type { ImportError, ImportProductData, ImportProductionStepData, ImportProductionStepValidationResult, ImportUserSyncData, ImportUserSyncValidationResult, ImportValidationResult } from '@/types/import';

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

/**
 * Parse Excel file buffer and extract production step data
 * @param buffer - Excel file buffer
 * @returns Promise resolving to array of import production step data
 */
export async function parseProductionStepExcelFile(buffer: Buffer): Promise<ImportProductionStepData[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error('Excel file contains no worksheets');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      throw new Error('Unable to read worksheet data');
    }

    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Excel file contains no data');
    }

    const headers = rawData[0] as string[];
    const expectedHeaders = ['Step Code', 'Step Name', 'Film Sequence', 'Step Group', 'Notes'];

    // Validate required headers
    const hasRequiredHeaders = expectedHeaders.slice(0, 2).every(header =>
      headers.some(h => h && h.toString().toLowerCase().trim() === header.toLowerCase()),
    );

    if (!hasRequiredHeaders) {
      throw new Error('Excel file must contain headers: Step Code, Step Name (Film Sequence, Step Group, and Notes are optional)');
    }

    // Map header indices
    const headerMap = {
      stepCode: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'step code'),
      stepName: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'step name'),
      filmSequence: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'film sequence'),
      stepGroup: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'step group'),
      notes: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'notes'),
    };

    const productionSteps: ImportProductionStepData[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as (string | number | undefined)[];
      const rowNumber = i + 1;

      // Skip empty rows
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        continue;
      }

      const stepCode = headerMap.stepCode >= 0 ? (row[headerMap.stepCode]?.toString().trim() || '') : '';
      const stepName = headerMap.stepName >= 0 ? (row[headerMap.stepName]?.toString().trim() || '') : '';
      const filmSequence = headerMap.filmSequence >= 0 ? (row[headerMap.filmSequence]?.toString().trim() || '') : '';
      const stepGroup = headerMap.stepGroup >= 0 ? (row[headerMap.stepGroup]?.toString().trim() || '') : '';
      const notes = headerMap.notes >= 0 ? (row[headerMap.notes]?.toString().trim() || '') : '';

      const productionStepData: ImportProductionStepData = {
        stepCode,
        stepName,
        filmSequence: filmSequence || undefined,
        stepGroup: stepGroup || undefined,
        notes: notes || undefined,
        rowNumber,
      };

      productionSteps.push(productionStepData);
    }

    return productionSteps;
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to parse Excel file: ${error.message}`);
    }
    throw new Error('Failed to parse Excel file: Unknown error');
  }
}

/**
 * Validate imported production step data using existing validation schemas
 * @param data - Array of import production step data
 * @returns Validation result with valid production steps and errors
 */
export function validateProductionStepImportData(data: ImportProductionStepData[]): ImportProductionStepValidationResult {
  const validProductionSteps: ImportProductionStepData[] = [];
  const errors: ImportError[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'No data found in Excel file', value: null }],
      validProducts: [],
    };
  }

  if (data.length > 1000) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'Maximum 1000 rows allowed', value: data.length }],
      validProducts: [],
    };
  }

  const seenStepCodes = new Set<string>();

  for (const stepData of data) {
    try {
      const validated = validateImportProductionStepRow(stepData);

      if (seenStepCodes.has(validated.stepCode.toLowerCase())) {
        errors.push({
          rowNumber: stepData.rowNumber,
          field: 'stepCode',
          message: 'Duplicate step code within import file',
          value: validated.stepCode,
        });
        continue;
      }

      seenStepCodes.add(validated.stepCode.toLowerCase());
      validProductionSteps.push(validated);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ path: string[]; message: string }> };
        for (const issue of zodError.issues) {
          errors.push({
            rowNumber: stepData.rowNumber,
            field: issue.path[0] || 'unknown',
            message: issue.message,
            value: stepData[issue.path[0] as keyof ImportProductionStepData],
          });
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Validation failed';
        errors.push({
          rowNumber: stepData.rowNumber,
          field: 'general',
          message: errorMessage,
          value: stepData.stepCode,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validProducts: validProductionSteps,
  };
}

/**
 * Create template Excel file for production step import
 * @returns Buffer containing template Excel file
 */
export function generateProductionStepImportTemplate(): Buffer {
  const workbook = XLSX.utils.book_new();

  const templateData = [
    ['Step Code', 'Step Name', 'Film Sequence', 'Step Group', 'Notes'],
    ['STEP-001', 'Mixing Process', 'SEQ-A-01', 'Preparation', 'Initial mixing step'],
    ['STEP-002', 'Quality Check', 'SEQ-B-02', 'Quality Control', 'Inspection and validation'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(templateData);

  const columnWidths = [
    { wch: 15 }, // Step Code
    { wch: 30 }, // Step Name
    { wch: 20 }, // Film Sequence
    { wch: 20 }, // Step Group
    { wch: 40 }, // Notes
  ];
  worksheet['!cols'] = columnWidths;

  const instructionsSheet = XLSX.utils.json_to_sheet([
    { Field: 'Instructions', Value: 'Fill in your production step data using the template format' },
    { Field: 'Required Fields', Value: 'Step Code and Step Name are required' },
    { Field: 'Optional Fields', Value: 'Film Sequence, Step Group, and Notes are optional' },
    { Field: 'Step Code Rules', Value: 'Only letters, numbers, underscores and dashes allowed' },
    { Field: 'Maximum Rows', Value: '1000 production steps per import' },
    { Field: 'File Size Limit', Value: '10MB maximum' },
  ]);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Production Steps Template');
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    compression: true,
  });
}

/**
 * Parse Excel file buffer and extract user sync data
 * @param buffer - Excel file buffer
 * @returns Promise resolving to array of import user sync data
 */
export async function parseUserSyncExcelFile(buffer: Buffer): Promise<ImportUserSyncData[]> {
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
    const expectedHeaders = ['User ID', 'Email', 'Full Name', 'Role', 'Organization Role', 'Shortcut', 'Active'];

    // Validate headers
    const hasRequiredHeaders = expectedHeaders.slice(0, 2).every(header =>
      headers.some(h => h && h.toString().toLowerCase().trim() === header.toLowerCase()),
    );

    if (!hasRequiredHeaders) {
      throw new Error('Excel file must contain headers: User ID, Email (other fields are optional)');
    }

    // Map header indices
    const headerMap = {
      userId: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'user id'),
      email: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'email'),
      fullName: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'full name'),
      role: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'role'),
      organizationRole: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'organization role'),
      shortcut: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'shortcut'),
      isActive: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'active'),
    };

    // Process data rows (skip header row)
    const userSyncs: ImportUserSyncData[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as (string | number | undefined)[];
      const rowNumber = i + 1; // Excel row number (1-based)

      // Skip empty rows
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        continue;
      }

      // Extract cell values
      const userId = headerMap.userId >= 0 ? (row[headerMap.userId]?.toString().trim() || '') : '';
      const email = headerMap.email >= 0 ? (row[headerMap.email]?.toString().trim() || '') : '';
      const fullName = headerMap.fullName >= 0 ? (row[headerMap.fullName]?.toString().trim() || '') : '';
      const role = headerMap.role >= 0 ? (row[headerMap.role]?.toString().trim() || '') : '';
      const organizationRole = headerMap.organizationRole >= 0 ? (row[headerMap.organizationRole]?.toString().trim() || '') : '';
      const shortcut = headerMap.shortcut >= 0 ? (row[headerMap.shortcut]?.toString().trim() || '') : '';
      const isActiveStr = headerMap.isActive >= 0 ? (row[headerMap.isActive]?.toString().trim() || '') : '';
      const isActive = isActiveStr.toLowerCase() === 'yes' || isActiveStr.toLowerCase() === 'true' || isActiveStr === '1';

      // Create user sync data
      const userSyncData: ImportUserSyncData = {
        userId,
        email,
        fullName: fullName || undefined,
        role: role || undefined,
        organizationRole: organizationRole || undefined,
        shortcut: shortcut || undefined,
        isActive,
        rowNumber,
      };

      userSyncs.push(userSyncData);
    }

    return userSyncs;
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to parse Excel file: ${error.message}`);
    }
    throw new Error('Failed to parse Excel file: Unknown error');
  }
}

/**
 * Validate imported user sync data using existing validation schemas
 * @param data - Array of import user sync data
 * @returns Validation result with valid user syncs and errors
 */
export function validateUserSyncImportData(data: ImportUserSyncData[]): ImportUserSyncValidationResult {
  const validUserSyncs: ImportUserSyncData[] = [];
  const errors: ImportError[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'No data found in Excel file', value: null }],
      validUserSyncs: [],
    };
  }

  // Check for maximum row limit
  if (data.length > 1000) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'Maximum 1000 rows allowed', value: data.length }],
      validUserSyncs: [],
    };
  }

  // Track unique user IDs to detect duplicates within the file
  const seenUserIds = new Set<string>();

  for (const userSyncData of data) {
    try {
      // Validate using existing schema
      const validated = validateImportUserSyncRow(userSyncData);

      // Check for duplicate user IDs within the import file
      if (seenUserIds.has(validated.userId.toLowerCase())) {
        errors.push({
          rowNumber: userSyncData.rowNumber,
          field: 'userId',
          message: 'Duplicate user ID within import file',
          value: validated.userId,
        });
        continue;
      }

      seenUserIds.add(validated.userId.toLowerCase());
      validUserSyncs.push(validated);
    } catch (error) {
      // Handle validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        // Zod validation error
        const zodError = error as { issues: Array<{ path: string[]; message: string }> };
        for (const issue of zodError.issues) {
          errors.push({
            rowNumber: userSyncData.rowNumber,
            field: issue.path[0] || 'unknown',
            message: issue.message,
            value: userSyncData[issue.path[0] as keyof ImportUserSyncData],
          });
        }
      } else {
        // Generic error
        const errorMessage = error instanceof Error ? error.message : 'Validation failed';
        errors.push({
          rowNumber: userSyncData.rowNumber,
          field: 'general',
          message: errorMessage,
          value: userSyncData.userId,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validUserSyncs,
  };
}

export type ImportProcessData = {
  processCode: string;
  processName: string;
  processCategory?: string;
  description?: string;
  rowNumber: number;
};

export function validateProcessImportData(data: ImportProcessData[]): { isValid: boolean; errors: ImportError[]; validProcesses: ImportProcessData[] } {
  const validProcesses: ImportProcessData[] = [];
  const errors: ImportError[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'No data found in Excel file', value: null }],
      validProcesses: [],
    };
  }

  // Check for maximum row limit
  if (data.length > 1000) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'Maximum 1000 rows allowed', value: data.length }],
      validProcesses: [],
    };
  }

  const seenProcessCodes = new Set<string>();

  for (const processData of data) {
    // Validate required fields
    if (!processData.processCode || !processData.processName) {
      errors.push({
        rowNumber: processData.rowNumber,
        field: !processData.processCode ? 'processCode' : 'processName',
        message: 'Required field missing',
        value: !processData.processCode ? processData.processCode : processData.processName,
      });
      continue;
    }
    if (seenProcessCodes.has(processData.processCode.toLowerCase())) {
      errors.push({
        rowNumber: processData.rowNumber,
        field: 'processCode',
        message: 'Duplicate process code within import file',
        value: processData.processCode,
      });
      continue;
    }
    seenProcessCodes.add(processData.processCode.toLowerCase());
    validProcesses.push(processData);
  }

  return {
    isValid: errors.length === 0,
    errors,
    validProcesses,
  };
}

export async function parseProcessExcelFile(buffer: Buffer): Promise<ImportProcessData[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel file contains no worksheets');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      throw new Error('Unable to read worksheet data');
    }
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Excel file contains no data');
    }
    const headers = rawData[0] as string[];
    const expectedHeaders = ['Process Code', 'Process Name', 'Process Category', 'Description'];
    const hasRequiredHeaders = expectedHeaders.slice(0, 2).every(header =>
      headers.some(h => h && h.toString().toLowerCase().trim() === header.toLowerCase()),
    );
    if (!hasRequiredHeaders) {
      throw new Error('Excel file must contain headers: Process Code, Process Name (others optional)');
    }
    const headerMap = {
      processCode: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'process code'),
      processName: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'process name'),
      processCategory: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'process category'),
      description: headers.findIndex(h => h && h.toString().toLowerCase().trim() === 'description'),
    };
    const processes: ImportProcessData[] = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as (string | number | undefined)[];
      const rowNumber = i + 1;
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        continue;
      }
      const processCode = headerMap.processCode >= 0 ? (row[headerMap.processCode]?.toString().trim() || '') : '';
      const processName = headerMap.processName >= 0 ? (row[headerMap.processName]?.toString().trim() || '') : '';
      const processCategory = headerMap.processCategory >= 0 ? (row[headerMap.processCategory]?.toString().trim() || '') : '';
      const description = headerMap.description >= 0 ? (row[headerMap.description]?.toString().trim() || '') : '';
      const processData: ImportProcessData = {
        processCode,
        processName,
        processCategory: processCategory || undefined,
        description: description || undefined,
        rowNumber,
      };
      processes.push(processData);
    }
    return processes;
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to parse Excel file: ${error.message}`);
    }
    throw new Error('Failed to parse Excel file: Unknown error');
  }
}

/**
 * Parse YMT Plan Excel file and extract work table data
 * @param buffer - Excel file buffer
 * @returns Promise resolving to array of import work table data
 */
export async function parseYmtPlanExcelFile(buffer: Buffer): Promise<ImportWorkTableData[]> {
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

    // Process work table data from column D (index 3) 
    const workTables: ImportWorkTableData[] = [];
    
    // Get table name prefix from D3 (row index 2, column index 3)
    const tableNamePrefix = (rawData[2] as any[])?.[3]?.toString().trim() || 'BÀN';

    // Start from row 4 (index 3) for table codes
    for (let i = 3; i < rawData.length; i++) {
      const row = rawData[i] as (string | number | undefined)[];
      const rowNumber = i + 1; // Excel row number (1-based)

      // Get table code from column D (index 3)
      const cellValue = row[3];
      if (cellValue === null || cellValue === undefined || cellValue === '') {
        continue;
      }
      
      const tableCode = cellValue.toString().trim();
      
      // Skip if no table code after trimming
      if (!tableCode || tableCode === '') {
        continue;
      }

      // Create work table data
      const workTableData: ImportWorkTableData = {
        tableCode,
        tableName: `${tableNamePrefix} ${tableCode}`,
        tableDetail: `${tableNamePrefix} ${tableCode}`,
        tableType: 'sewing', // Default type for ymt_plan tables
        rowNumber,
      };

      workTables.push(workTableData);
    }

    return workTables;
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to parse YMT Plan Excel file: ${error.message}`);
    }
    throw new Error('Failed to parse YMT Plan Excel file: Unknown error');
  }
}

export type ImportWorkTableData = {
  tableCode: string;
  tableName: string;
  tableDetail?: string;
  tableType: string;
  rowNumber: number;
};

/**
 * Validate imported work table data
 * @param data - Array of import work table data
 * @returns Validation result with valid work tables and errors
 */
export function validateWorkTableImportData(data: ImportWorkTableData[]): { isValid: boolean; errors: ImportError[]; validWorkTables: ImportWorkTableData[] } {
  const validWorkTables: ImportWorkTableData[] = [];
  const errors: ImportError[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'No work table data found in Excel file', value: null }],
      validWorkTables: [],
    };
  }

  // Check for maximum row limit
  if (data.length > 1000) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'Maximum 1000 rows allowed', value: data.length }],
      validWorkTables: [],
    };
  }

  const seenTableCodes = new Set<string>();

  for (const workTableData of data) {
    // Validate required fields
    if (!workTableData.tableCode || !workTableData.tableName) {
      errors.push({
        rowNumber: workTableData.rowNumber,
        field: !workTableData.tableCode ? 'tableCode' : 'tableName',
        message: 'Required field missing',
        value: !workTableData.tableCode ? workTableData.tableCode : workTableData.tableName,
      });
      continue;
    }

    // Check for duplicate table codes within the import file
    if (seenTableCodes.has(workTableData.tableCode.toLowerCase())) {
      errors.push({
        rowNumber: workTableData.rowNumber,
        field: 'tableCode',
        message: 'Duplicate table code within import file',
        value: workTableData.tableCode,
      });
      continue;
    }

    seenTableCodes.add(workTableData.tableCode.toLowerCase());
    validWorkTables.push(workTableData);
  }

  return {
    isValid: errors.length === 0,
    errors,
    validWorkTables,
  };
}

/**
 * Parse YMT Plan Excel file and extract plan data from header
 * @param buffer - Excel file buffer
 * @returns Promise resolving to array of import plan data
 */
export async function parseYmtPlanForPlan(buffer: Buffer): Promise<ImportPlanData[]> {
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

    // Extract plan data from row 1 column B (index 1)
    const plans: ImportPlanData[] = [];
    
    const headerText = (rawData[0] as any[])?.[1]?.toString().trim(); // Row 1, Column B
    if (!headerText) {
      throw new Error('No plan header found in cell B1');
    }

    // Parse "CẮT THÁNG 08.2025" format
    const matches = headerText.match(/CẮT\s+THÁNG\s+(\d{2})\.(\d{4})/i);
    if (!matches) {
      throw new Error(`Invalid plan header format: "${headerText}". Expected format: "CẮT THÁNG MM.YYYY"`);
    }

    const month = parseInt(matches[1], 10);
    const year = parseInt(matches[2], 10);
    
    // Create plan data
    const planCode = `${matches[1]}${matches[2]}`; // 082025
    const planName = planCode; // Same as code
    
    const planData: ImportPlanData = {
      planCode,
      planName,
      planYear: year,
      planMonth: month,
      rowNumber: 1,
    };

    plans.push(planData);
    return plans;
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to parse YMT Plan Excel file: ${error.message}`);
    }
    throw new Error('Failed to parse YMT Plan Excel file: Unknown error');
  }
}

export type ImportPlanData = {
  planCode: string;
  planName: string;
  planYear: number;
  planMonth: number;
  rowNumber: number;
};

/**
 * Validate imported plan data
 * @param data - Array of import plan data
 * @returns Validation result with valid plans and errors
 */
export function validatePlanImportData(data: ImportPlanData[]): { isValid: boolean; errors: ImportError[]; validPlans: ImportPlanData[] } {
  const validPlans: ImportPlanData[] = [];
  const errors: ImportError[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'No plan data found in Excel file', value: null }],
      validPlans: [],
    };
  }

  for (const planData of data) {
    // Validate required fields
    if (!planData.planCode || !planData.planName) {
      errors.push({
        rowNumber: planData.rowNumber,
        field: !planData.planCode ? 'planCode' : 'planName',
        message: 'Required field missing',
        value: !planData.planCode ? planData.planCode : planData.planName,
      });
      continue;
    }

    // Validate year and month
    if (planData.planYear < 2000 || planData.planYear > 2100) {
      errors.push({
        rowNumber: planData.rowNumber,
        field: 'planYear',
        message: 'Invalid year (must be between 2000-2100)',
        value: planData.planYear,
      });
      continue;
    }

    if (planData.planMonth < 1 || planData.planMonth > 12) {
      errors.push({
        rowNumber: planData.rowNumber,
        field: 'planMonth',
        message: 'Invalid month (must be between 1-12)',
        value: planData.planMonth,
      });
      continue;
    }

    validPlans.push(planData);
  }

  return {
    isValid: errors.length === 0,
    errors,
    validPlans,
  };
}

export type ImportProductSubData = {
  productName: string;
  productSubDetail: string;
  totalQuantity: number;
  assignments: Array<{
    tableNumber: number;
    quantity: number;
  }>;
  rowNumber: number;
};

/**
 * Parse YMT Plan Excel file and extract product_sub data
 * @param buffer - Excel file buffer
 * @returns Promise resolving to array of import product_sub data
 */
export async function parseYmtPlanForProductSub(buffer: Buffer): Promise<ImportProductSubData[]> {
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

    if (!Array.isArray(rawData) || rawData.length < 4) {
      throw new Error('Excel file must have at least 4 rows of data');
    }


    const productSubs: ImportProductSubData[] = [];
    let currentProductName = ''; // Track current product name for merged cells

    // Start from row 4 (index 3) for data
    for (let i = 3; i < rawData.length; i++) {
      const row = rawData[i] as (string | number | undefined)[];
      const rowNumber = i + 1; // Excel row number (1-based)

      // Skip empty rows
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        continue;
      }

      // Column A (index 0): Product Name (NHA 01)
      const columnA = row[0]?.toString().trim() || '';
      // Column B (index 1): Product Sub Detail (CÔNG BẠC)
      const columnB = row[1]?.toString().trim() || '';
      // Column C (index 2): Total quantity
      const columnC = row[2];
      // Column D (index 3): Table number (BÀN)
      const columnD = row[3];
      // Column E (index 4): Quantity for this table
      const columnE = row[4];

      // Update current product name if column A has value
      if (columnA) {
        currentProductName = columnA;
      }

      // If we have product sub detail and table assignment data
      if (currentProductName && columnB && columnD !== undefined && columnE !== undefined) {
        const productName = currentProductName; // Use tracked product name
        const productSubDetail = columnB;
        const totalQuantity = columnC ? parseInt(columnC.toString()) || 0 : 0;
        const tableNumber = parseInt(columnD.toString()) || 0;
        const quantity = parseInt(columnE.toString()) || 0;

        // Find existing product_sub or create new one
        let existingProductSub = productSubs.find(p => 
          p.productName === productName && 
          p.productSubDetail === productSubDetail
        );

        if (!existingProductSub) {
          existingProductSub = {
            productName,
            productSubDetail,
            totalQuantity,
            assignments: [],
            rowNumber,
          };
          productSubs.push(existingProductSub);
        }

        // Add table assignment
        existingProductSub.assignments.push({
          tableNumber,
          quantity,
        });
      }
    }

    return productSubs;
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to parse YMT Plan Excel file for product_sub: ${error.message}`);
    }
    throw new Error('Failed to parse YMT Plan Excel file for product_sub: Unknown error');
  }
}

/**
 * Validate imported product_sub data
 * @param data - Array of import product_sub data
 * @returns Validation result with valid product_subs and errors
 */
export function validateProductSubImportData(data: ImportProductSubData[]): { isValid: boolean; errors: ImportError[]; validProductSubs: ImportProductSubData[] } {
  const validProductSubs: ImportProductSubData[] = [];
  const errors: ImportError[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'No product_sub data found in Excel file', value: null }],
      validProductSubs: [],
    };
  }

  // Check for maximum row limit
  if (data.length > 1000) {
    return {
      isValid: false,
      errors: [{ rowNumber: 0, field: 'file', message: 'Maximum 1000 rows allowed', value: data.length }],
      validProductSubs: [],
    };
  }

  const seenProductSubCodes = new Set<string>();

  for (const productSubData of data) {
    // Debug log
    console.log(`Validating Row ${productSubData.rowNumber}:`, {
      productName: productSubData.productName,
      productSubDetail: productSubData.productSubDetail,
      totalQuantity: productSubData.totalQuantity,
      assignments: productSubData.assignments
    });

    // Validate required fields
    if (!productSubData.productName || !productSubData.productSubDetail) {
      const missingField = !productSubData.productName ? 'productName' : 'productSubDetail';
      console.log(`Row ${productSubData.rowNumber}: Missing ${missingField}`);
      errors.push({
        rowNumber: productSubData.rowNumber,
        field: missingField,
        message: 'Required field missing',
        value: !productSubData.productName ? productSubData.productName : productSubData.productSubDetail,
      });
      continue;
    }

    // Generate product_sub_code for duplicate check
    const productSubCode = `${productSubData.productName}_${productSubData.productSubDetail}`.replace(/\s+/g, '_').toUpperCase();
    
    // Check for duplicate product_sub codes within the import file
    if (seenProductSubCodes.has(productSubCode.toLowerCase())) {
      errors.push({
        rowNumber: productSubData.rowNumber,
        field: 'productSubCode',
        message: 'Duplicate product_sub combination within import file',
        value: productSubCode,
      });
      continue;
    }

    // Validate assignments
    if (!productSubData.assignments || productSubData.assignments.length === 0) {
      errors.push({
        rowNumber: productSubData.rowNumber,
        field: 'assignments',
        message: 'No table assignments found',
        value: 'empty',
      });
      continue;
    }

    // Skip total quantity validation - not needed for database
    // Total quantity is just for reference in the notes

    seenProductSubCodes.add(productSubCode.toLowerCase());
    validProductSubs.push(productSubData);
  }

  return {
    isValid: errors.length === 0,
    errors,
    validProductSubs,
  };
}
