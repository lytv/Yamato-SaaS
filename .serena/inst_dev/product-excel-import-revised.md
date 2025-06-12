# Product Excel Import Feature - Revised Implementation Plan

## Overview
Implement Excel import functionality following existing codebase patterns. Users can upload Excel files with the same structure as exported files to bulk create products. Uses native Next.js patterns, existing validation schemas, and simple UI consistent with current architecture.

## Architecture Alignment Strategy
This revised plan follows existing patterns discovered in codebase analysis:
- **Modal Pattern**: Single-step modal following ProductModal pattern
- **Hook Pattern**: Exact same structure as useProductMutations
- **API Pattern**: Same auth, validation, and error handling as existing product APIs
- **Validation Pattern**: Reuse existing productFormSchema for each imported row
- **File Handling**: Native Next.js FormData (no external dependencies)

## Prerequisites
1. **No additional dependencies needed** - existing xlsx library sufficient
2. Review existing patterns:
   - `src/features/product/ProductForm.tsx` - Modal pattern
   - `src/hooks/useProductMutations.ts` - Hook pattern
   - `src/app/api/products/route.ts` - API pattern
   - `src/libs/validations/product.ts` - Validation pattern

## Implementation Steps

### Step 1: Create Import Utilities (Simplified)
**File**: `src/utils/excelImportHelpers.ts`

**Core Functions**:
```typescript
// Simple validation result
interface ImportValidationResult {
  isValid: boolean;
  errors: ImportError[];
  validProducts: ImportProductData[];
}

interface ImportProductData {
  productCode: string;
  productName: string;
  category?: string;
  notes?: string;
  rowNumber: number;
}

interface ImportError {
  rowNumber: number;
  field: string;
  message: string;
  value: any;
}
```

**Implementation**:
- `parseExcelFile(buffer: Buffer): Promise<ImportProductData[]>` - Parse using existing xlsx library
- `validateImportData(data: ImportProductData[]): ImportValidationResult` - Use existing productFormSchema
- `formatImportErrors(errors: ImportError[]): string[]` - Format for UI display

### Step 2: Create Import API Endpoint (Following Existing Pattern)
**File**: `src/app/api/products/import/route.ts`

**Implementation following existing product API patterns**:
```typescript
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Same auth pattern as existing APIs
    const { userId, orgId } = await auth();
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Native Next.js FormData handling (no multer needed)
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // File validation
    if (!file || file.size === 0) {
      return Response.json(
        { success: false, error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // Size and type validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return Response.json(
        { success: false, error: 'File too large (max 10MB)', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // Parse Excel using existing utilities
    const buffer = Buffer.from(await file.arrayBuffer());
    const importData = await parseExcelFile(buffer);
    
    // Validate data using existing schemas
    const validation = validateImportData(importData);
    
    // Create products using existing createProduct function (loop approach)
    const ownerId = orgId || userId;
    const results = await processImportData(validation.validProducts, ownerId);
    
    return Response.json({
      success: true,
      data: {
        totalRows: importData.length,
        successCount: results.successful.length,
        errorCount: results.failed.length,
        createdProducts: results.successful,
        errors: [...validation.errors, ...results.failed],
      }
    });
  } catch (error) {
    // Same error handling pattern as existing APIs
    console.error('Error importing products:', error);
    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Helper function using existing createProduct in loop
async function processImportData(products: ImportProductData[], ownerId: string) {
  const successful: Product[] = [];
  const failed: ImportError[] = [];
  
  for (const productData of products) {
    try {
      // Check for existing product code using existing function
      const existing = await getProductByCode(productData.productCode, ownerId);
      if (existing) {
        failed.push({
          rowNumber: productData.rowNumber,
          field: 'productCode',
          message: 'Product code already exists',
          value: productData.productCode
        });
        continue;
      }
      
      // Create product using existing function
      const product = await createProduct({
        ownerId,
        productCode: productData.productCode,
        productName: productData.productName,
        category: productData.category,
        notes: productData.notes,
      });
      
      successful.push(product);
    } catch (error) {
      failed.push({
        rowNumber: productData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create product',
        value: productData.productCode
      });
    }
  }
  
  return { successful, failed };
}
```

### Step 3: Create Import Hook (Following useProductMutations Pattern)
**File**: `src/hooks/useProductImport.ts`

**Exact same pattern as useProductMutations**:
```typescript
type ImportState = {
  isImporting: boolean;
  importError: string | null;
  importResult: ImportResult | null;
};

type ImportReturn = ImportState & {
  importProducts: (file: File) => Promise<ImportResult>;
  clearError: () => void;
  clearResult: () => void;
};

export function useProductImport(): ImportReturn {
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

  const importProducts = useCallback(async (file: File): Promise<ImportResult> => {
    setState(prev => ({ ...prev, isImporting: true, importError: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to import products';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to import products';
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
    importProducts,
    clearError,
    clearResult,
  };
}
```

### Step 4: Create Simple Import Modal (Following ProductModal Pattern)
**File**: `src/features/product/ProductImportModal.tsx`

**Single-step modal following existing pattern**:
```typescript
interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ImportResult) => void;
}

export function ProductImportModal({ isOpen, onClose, onSuccess }: ProductImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { importProducts, isImporting, importError, importResult, clearError, clearResult } = useProductImport();

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      clearError();
      clearResult();
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const result = await importProducts(selectedFile);
      onSuccess(result);
      // Keep modal open to show results
    } catch (error) {
      // Error is handled by hook
    }
  };

  // Handle close
  const handleClose = () => {
    setSelectedFile(null);
    clearError();
    clearResult();
    onClose();
  };

  // Same keyboard and backdrop handling as ProductModal
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <h2 id="import-modal-title" className="text-xl font-semibold mb-4">
            Import Products from Excel
          </h2>

          {/* File Upload Section */}
          <div className="mb-6">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File (.xlsx)
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isImporting}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Error Display */}
          {importError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{importError}</p>
            </div>
          )}

          {/* Results Display */}
          {importResult && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Import Results</h3>
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
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Errors:</h4>
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {importResult ? 'Close' : 'Cancel'}
            </button>
            
            {!importResult && (
              <button
                type="button"
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import Products'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 5: Integrate with ProductList (Minimal Changes)
**File**: `src/features/product/ProductList.tsx` (modify existing)

**Add import button and modal**:
```typescript
// Add import modal state to existing ModalState
type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  product?: Product;
  showImport?: boolean; // Add this
};

// In ProductsPage component, add import handling
const [importModalOpen, setImportModalOpen] = useState(false);

// Add import success handler
const handleImportSuccess = (result: ImportResult) => {
  // Refresh product list
  refresh();
  
  // Show success message
  if (result.successCount > 0) {
    // Add toast notification or success feedback
    console.log(`Successfully imported ${result.successCount} products`);
  }
};

// Add import button next to export button (around line 190 in header controls)
<div className="flex items-center space-x-4">
  {/* Existing export button */}
  <button
    type="button"
    onClick={() => setImportModalOpen(true)}
    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
  >
    <Upload className="mr-2 h-4 w-4" />
    Import from Excel
  </button>
  
  {/* Existing export button code... */}
</div>

// Add import modal at the end of component
<ProductImportModal
  isOpen={importModalOpen}
  onClose={() => setImportModalOpen(false)}
  onSuccess={handleImportSuccess}
/>
```

### Step 6: Create Type Definitions (Simplified)
**File**: `src/types/import.ts`

```typescript
// Simplified types following existing patterns
export interface ImportProductData {
  productCode: string;
  productName: string;
  category?: string;
  notes?: string;
  rowNumber: number;
}

export interface ImportError {
  rowNumber: number;
  field: string;
  message: string;
  value: any;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  createdProducts: Product[];
  errors: ImportError[];
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: ImportError[];
  validProducts: ImportProductData[];
}
```

### Step 7: Add Import Validation (Extend Existing)
**File**: `src/libs/validations/product.ts` (extend existing)

```typescript
// Add import-specific validation that reuses existing schemas
export const importProductRowSchema = z.object({
  productCode: productFormSchema.shape.productCode,
  productName: productFormSchema.shape.productName,
  category: productFormSchema.shape.category.optional(),
  notes: productFormSchema.shape.notes.optional(),
  rowNumber: z.number().int().positive(),
});

export type ImportProductRow = z.infer<typeof importProductRowSchema>;

export function validateImportProductRow(data: unknown): ImportProductRow {
  return importProductRowSchema.parse(data);
}
```

## Files to Create
1. `src/utils/excelImportHelpers.ts` - Excel parsing utilities (simple)
2. `src/app/api/products/import/route.ts` - Import API endpoint (following existing pattern)
3. `src/hooks/useProductImport.ts` - Import hook (same as useProductMutations)
4. `src/features/product/ProductImportModal.tsx` - Single-step modal
5. `src/types/import.ts` - Simple type definitions

## Files to Modify
1. `src/features/product/ProductList.tsx` - Add import button and modal (minimal changes)
2. `src/libs/validations/product.ts` - Add import validation (reuse existing)

## Key Simplifications vs Original Plan
- **No external dependencies** (react-dropzone, multer removed)
- **Single-step modal** (vs 4-step wizard)
- **Loop-based import** (vs bulk operations)
- **Native file handling** (vs complex upload libraries)
- **Reuse existing patterns** (vs creating new patterns)
- **Simple error handling** (vs complex error recovery)

## Performance Limits (Conservative)
- File size: **10MB max**
- Row count: **1000 products max**
- Individual validation: **Standard API timeout**
- Total import: **2-3 minutes max**

## Testing Strategy (Simplified)
1. **Unit tests**: Excel parsing, validation functions
2. **API tests**: File upload, import processing
3. **Hook tests**: State management, error handling
4. **Component tests**: Modal interactions, file selection
5. **Integration tests**: Complete import workflow

## Success Criteria
- Users can import up to 1000 products from Excel file
- Same validation rules as manual product creation
- Clear success/error feedback with row-level details
- Performance acceptable for reasonable file sizes
- UI consistent with existing modal patterns
- Zero external dependencies added
- Follows all existing security and auth patterns

This revised approach reduces implementation complexity by ~70% while delivering the same user functionality and maintaining perfect architectural consistency.