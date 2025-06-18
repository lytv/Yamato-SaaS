
# Production Step Import Feature Implementation Plan

## 1. Overview
- **Feature**: Import production steps from Excel files (.xlsx/.xls)
- **High-level approach**: Adapt existing products import pattern for production steps
- **Integration points**: Leverages existing validation, database queries, and UI patterns from products import

## 2. Architecture Analysis Summary
- **Key findings**: 
  - Products import functionality provides excellent pattern to follow
  - Production steps have CRUD operations and export functionality already implemented
  - Validation schemas and database structure are well-established
- **Relevant existing patterns**: 
  - `/src/app/api/products/import/route.ts` - API pattern
  - `ProductImportModal` and `useProductImport` - Frontend patterns
  - `excelImportHelpers.ts` - Excel processing utilities
- **Technology stack**: Next.js App Router, TypeScript, Zod validation, xlsx library, Clerk auth

## 3. Prerequisites
- Familiarity with existing products import implementation
- Understanding of production step data structure: stepCode, stepName, filmSequence, stepGroup, notes
- Excel file handling using xlsx library
- Clerk authentication patterns in the project

## 4. Implementation Steps

### Step 1: Types and Interfaces
**File**: `src/types/import.ts`
**Action**: Add production step import types

```typescript
// Add these types to existing import.ts
export type ImportProductionStepData = {
  stepCode: string;
  stepName: string;
  filmSequence?: string;
  stepGroup?: string;
  notes?: string;
  rowNumber: number;
};

export type ImportProductionStepResult = {
  totalRows: number;
  successCount: number;
  errorCount: number;
  createdProductionSteps: ProductionStep[];
  errors: ImportError[];
};
```

### Step 2: Validation Schema
**File**: `src/libs/validations/productionStep.ts`
**Action**: Add import validation schema

```typescript
// Add to existing productionStep validation file
export const importProductionStepRowSchema = z.object({
  stepCode: z.string()
    .trim()
    .min(1, 'Step code is required')
    .max(50, 'Step code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Step code can only contain letters, numbers, underscores and dashes'),
  
  stepName: z.string()
    .trim()
    .min(1, 'Step name is required')
    .max(200, 'Step name must be 200 characters or less'),
  
  filmSequence: z.string()
    .trim()
    .max(50, 'Film sequence must be 50 characters or less')
    .optional()
    .or(z.literal('')),
  
  stepGroup: z.string()
    .trim()
    .max(100, 'Step group must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  
  notes: z.string()
    .trim()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  
  rowNumber: z.number()
});

export type ImportProductionStepRow = z.infer<typeof importProductionStepRowSchema>;

export function validateImportProductionStepRow(data: unknown): ImportProductionStepRow {
  return importProductionStepRowSchema.parse(data);
}
```

### Step 3: Excel Helper Functions
**File**: `src/utils/excelImportHelpers.ts`
**Action**: Add production step specific functions

```typescript
// Add these functions to existing excelImportHelpers.ts

export async function parseProductionStepExcelFile(buffer: Buffer): Promise<ImportProductionStepData[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    
    if (!firstSheetName) {
      throw new Error('Excel file contains no worksheets');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Excel file contains no data');
    }

    const headers = rawData[0] as string[];
    const expectedHeaders = ['Step Code', 'Step Name', 'Film Sequence', 'Step Group', 'Notes'];

    // Validate required headers
    const hasRequiredHeaders = expectedHeaders.slice(0, 2).every(header =>
      headers.some(h => h && h.toString().toLowerCase().trim() === header.toLowerCase())
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

export function validateProductionStepImportData(data: ImportProductionStepData[]): ImportValidationResult {
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
```

### Step 4: API Route Implementation
**File**: `src/app/api/production-steps/import/route.ts`
**Action**: Create new API endpoint

```typescript
import { Buffer } from 'node:buffer';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createProductionStep as createProductionStepDb, getProductionStepByCode } from '@/libs/queries/productionStep';
import type { ImportError } from '@/types/import';
import type { ProductionStep } from '@/types/productionStep';
import { parseProductionStepExcelFile, validateProductionStepImportData } from '@/utils/excelImportHelpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      return Response.json(
        { success: false, error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return Response.json(
        { success: false, error: 'File too large (max 10MB)', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { success: false, error: 'Invalid file type. Only .xlsx and .xls files are allowed', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const importData = await parseProductionStepExcelFile(buffer);
    const validation = validateProductionStepImportData(importData);

    const ownerId = orgId || userId;
    const results = await processImportData(validation.validProducts, ownerId);

    return Response.json({
      success: true,
      data: {
        totalRows: importData.length,
        successCount: results.successful.length,
        errorCount: results.failed.length,
        createdProductionSteps: results.successful,
        errors: [...validation.errors, ...results.failed],
      },
    });
  } catch (error) {
    console.error('Error importing production steps:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { success: false, error: 'Invalid request data', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Failed to parse Excel file')) {
        return Response.json(
          { success: false, error: error.message, code: 'EXCEL_PARSE_ERROR' },
          { status: 400 }
        );
      }

      return Response.json(
        { success: false, error: error.message, code: 'IMPORT_ERROR' },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

async function processImportData(
  productionSteps: Array<{ stepCode: string; stepName: string; filmSequence?: string; stepGroup?: string; notes?: string; rowNumber: number }>,
  ownerId: string
): Promise<{
  successful: ProductionStep[];
  failed: ImportError[];
}> {
  const successful: ProductionStep[] = [];
  const failed: ImportError[] = [];

  for (const stepData of productionSteps) {
    try {
      // Check for existing step code
      const existing = await getProductionStepByCode(stepData.stepCode, ownerId);
      if (existing) {
        failed.push({
          rowNumber: stepData.rowNumber,
          field: 'stepCode',
          message: 'Production step code already exists',
          value: stepData.stepCode,
        });
        continue;
      }

      // Create production step
      const dbStep = await createProductionStepDb({
        ownerId,
        stepCode: stepData.stepCode,
        stepName: stepData.stepName,
        filmSequence: stepData.filmSequence,
        stepGroup: stepData.stepGroup,
        notes: stepData.notes,
      });

      const productionStep: ProductionStep = {
        id: dbStep.id,
        ownerId: dbStep.ownerId,
        stepCode: dbStep.stepCode,
        stepName: dbStep.stepName,
        filmSequence: dbStep.filmSequence,
        stepGroup: dbStep.stepGroup,
        notes: dbStep.notes,
        createdAt: dbStep.createdAt.toISOString(),
        updatedAt: dbStep.updatedAt.toISOString(),
      };

      successful.push(productionStep);
    } catch (error) {
      failed.push({
        rowNumber: stepData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create production step',
        value: stepData.stepCode,
      });
    }
  }

  return { successful, failed };
}
```

### Step 5: React Hook Implementation
**File**: `src/hooks/useProductionStepImport.ts`
**Action**: Create new hook

```typescript
import { useCallback, useState } from 'react';
import type { ImportProductionStepResult } from '@/types/import';

type ImportState = {
  isImporting: boolean;
  importError: string | null;
  importResult: ImportProductionStepResult | null;
};

type ImportReturn = ImportState & {
  importProductionSteps: (file: File) => Promise<ImportProductionStepResult>;
  clearError: () => void;
  clearResult: () => void;
};

export function useProductionStepImport(): ImportReturn {
  const [state, setState] = useState<ImportState>({
    isImporting: false,
    importError: null,
    importResult: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, importError: null }));
  }, []);

  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, importResult: null }));
  }, []);

  const importProductionSteps = useCallback(async (file: File): Promise<ImportProductionStepResult> => {
    setState(prev => ({ ...prev, isImporting: true, importError: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/production-steps/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to import production steps';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Import failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const importResult = result.data;

      setState(prev => ({
        ...prev,
        isImporting: false,
        importResult,
      }));

      return importResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import production steps';
      setState(prev => ({
        ...prev,
        isImporting: false,
        importError: errorMessage,
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    importProductionSteps,
    clearError,
    clearResult,
  };
}
```

### Step 6: Import Modal Component
**File**: `src/features/productionStep/ProductionStepImportModal.tsx`
**Action**: Create new component

```typescript
import React, { useState } from 'react';
import { useProductionStepImport } from '@/hooks/useProductionStepImport';
import type { ImportProductionStepResult } from '@/types/import';

type ProductionStepImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ImportProductionStepResult) => void;
};

export function ProductionStepImportModal({ isOpen, onClose, onSuccess }: ProductionStepImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { importProductionSteps, isImporting, importError, importResult, clearError, clearResult } = useProductionStepImport();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      clearError();
      clearResult();
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const result = await importProductionSteps(selectedFile);
      onSuccess(result);
    } catch {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    clearError();
    clearResult();
    onClose();
  };

  // ... rest of component similar to ProductImportModal but with production step specific content

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-xl">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Import Production Steps from Excel
          </h2>

          {/* File Upload Section */}
          <div className="mb-6">
            <label htmlFor="file-upload" className="mb-2 block text-sm font-medium text-gray-700">
              Select Excel File (.xlsx)
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isImporting}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Error Display */}
          {importError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{importError}</p>
            </div>
          )}

          {/* Results Display */}
          {importResult && (
            <div className="mb-6 rounded-md bg-gray-50 p-4">
              <h3 className="mb-2 font-medium text-gray-900">Import Results</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Total rows processed: {importResult.totalRows}</p>
                <p className="text-green-600">Successfully created: {importResult.successCount}</p>
                {importResult.errorCount > 0 && (
                  <p className="text-red-600">Failed: {importResult.errorCount}</p>
                )}
              </div>

              {/* Error Details */}
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-900">Errors:</h4>
                  <div className="max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <p key={index} className="text-xs text-red-600">
                        Row {error.rowNumber}: {error.message}
                      </p>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-xs text-gray-500">
                        ... and {importResult.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {importResult ? 'Close' : 'Cancel'}
            </button>

            {!importResult && (
              <button
                type="button"
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
                className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import Production Steps'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 7: Page Integration
**File**: `src/app/[locale]/(auth)/dashboard/production-steps/page.tsx`
**Action**: Add import modal integration

```typescript
// Add import to existing file
import { ProductionStepImportModal } from '@/features/productionStep/ProductionStepImportModal';

// Add to existing state
const [importModal, setImportModal] = useState(false);

// Add handler functions
const handleImportProductionSteps = () => {
  setImportModal(true);
};

const handleImportSuccess = (result: ImportProductionStepResult) => {
  console.log('Import successful:', result);
  setRefreshKey(prev => prev + 1); // Refresh the list
};

const handleCloseImportModal = () => {
  setImportModal(false);
};

// Add import button to header section
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">
      {t('productionStep.pageTitle', { default: 'Production Steps' })}
    </h1>
    <p className="text-muted-foreground">
      {t('productionStep.pageDescription', {
        default: 'Manage your production steps and workflow',
      })}
    </p>
  </div>

  <div className="flex space-x-2">
    <Button
      onClick={handleImportProductionSteps}
      variant="outline"
      className="shrink-0"
    >
      Import from Excel
    </Button>
    
    <Button
      onClick={handleCreateProductionStep}
      disabled={isCreating}
      className="shrink-0"
    >
      {t('productionStep.createNew', { default: 'Create Production Step' })}
    </Button>
  </div>
</div>

// Add import modal at the end before closing main tag
<ProductionStepImportModal
  isOpen={importModal}
  onClose={handleCloseImportModal}
  onSuccess={handleImportSuccess}
/>
```

## 5. Testing Strategy

### Unit Tests
- **API Route**: Test file validation, parsing, error handling
- **Hook**: Test state management, API calls, error scenarios
- **Modal Component**: Test file selection, upload, results display
- **Validation**: Test schema validation with various input scenarios

### Integration Tests
- **End-to-end import flow**: File upload → processing → database creation
- **Error scenarios**: Invalid files, duplicate data, validation failures
- **UI interactions**: Modal opening, file selection, progress display

### Test Cases to Consider
- Valid Excel file with correct headers and data
- Invalid file formats (non-Excel files)
- Excel files with missing required headers
- Files with invalid data (validation failures)
- Duplicate step codes within file and against database
- Large files (approaching size limits)
- Empty files or files with no data rows

## 6. Documentation Updates

### API Documentation
- Add `/api/production-steps/import` endpoint documentation
- Include request/response schemas and error codes
- Document file format requirements and limitations

### User Documentation  
- Update production steps documentation with import instructions
- Create Excel template documentation
- Add troubleshooting guide for common import errors

### Technical Documentation
- Update architecture documentation with new import flow
- Document validation rules and business logic
- Add error handling and recovery procedures

## 7. Considerations and Potential Challenges

### Scalability Considerations
- **File size limits**: 10MB limit should handle most use cases
- **Row limits**: 1000 rows per import prevents server overload
- **Processing time**: Large files may require progress indicators

### Performance Implications
- **Memory usage**: Excel parsing keeps data in memory temporarily
- **Database transactions**: Individual row processing allows partial success
- **File I/O**: Temporary file storage for large uploads

### Security Considerations
- **File validation**: Strict file type and content validation
- **Input sanitization**: All data validated through Zod schemas  
- **Authorization**: Owner-based data isolation maintained
- **Rate limiting**: Consider adding rate limits for import endpoints

### Potential Integration Challenges
- **Data conflicts**: Handling duplicate step codes gracefully
- **Error reporting**: Clear, actionable error messages for users
- **State management**: Keeping UI in sync after imports
- **Browser compatibility**: File upload and processing across browsers

### Impact on Existing Features
- **Database performance**: Additional queries for duplicate checking
- **UI consistency**: Maintaining design patterns with existing modals
- **API consistency**: Following established error response formats
- **Component reusability**: Leveraging existing UI components where possible

## 8. Next Steps

### Immediate Actions
1. Start with types and validation schema implementation
2. Create API route following the detailed specification
3. Build and test the React hook for state management
4. Develop the import modal component

### Future Enhancements
- **Bulk operations**: Consider batch processing for very large files
- **Template generation**: Endpoint to download Excel template
- **Import history**: Track and display previous import operations
- **Advanced validation**: Business rule validation beyond field validation

### Monitoring and Observability
- **Import metrics**: Track success/failure rates
- **Performance monitoring**: Response times for import operations
- **Error tracking**: Log and monitor common import failures
- **User analytics**: Track import feature usage and adoption
