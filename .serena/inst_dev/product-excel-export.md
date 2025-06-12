# Product Excel Export Feature Implementation Plan

## Overview
Add Excel export functionality to the product list that allows users to download all their products (respecting current search/filter/sort context) as a well-formatted Excel file (.xlsx format).

## Architecture Integration Points
- Leverages existing product queries and authentication (Clerk)
- Uses existing validation schemas and multi-tenancy support  
- Integrates with ProductList component and useProducts hook
- Follows established API route patterns in `/api/products/`

## Prerequisites
1. Verify `xlsx` library is installed: `npm install xlsx @types/node`
2. Review existing product API patterns in `src/app/api/products/route.ts`
3. Study ProductList component structure in `src/features/product/ProductList.tsx`
4. Understand useProducts hook implementation in `src/hooks/useProducts.ts`

## Implementation Steps

### Step 1: Create Excel Utility Functions
**File**: `src/utils/excelHelpers.ts`
- Create `generateProductsExcel(products: Product[]): Buffer` function
- Implement Excel workbook creation with proper headers
- Add column formatting for dates and text
- Include metadata (export date, total count)
- Use SheetJS (xlsx) library for Excel generation

### Step 2: Create Export API Endpoint  
**File**: `src/app/api/products/export/route.ts`
- Follow existing API patterns from `src/app/api/products/route.ts`
- Implement GET handler with same auth pattern: `const { userId, orgId } = await auth()`
- Accept same query parameters as main products API (search, sortBy, sortOrder)
- Use existing `validateProductListParams()` function
- Remove pagination limits but implement max limit of 5000 products
- Call `getPaginatedProducts()` with export flag
- Generate Excel using utility function
- Return file response with proper headers:
  ```typescript
  return new Response(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="products-export-${Date.now()}.xlsx"`
    }
  });
  ```

### Step 3: Create Export Custom Hook
**File**: `src/hooks/useProductExport.ts`
- Follow existing hook patterns like `useProductMutations.ts`
- Implement state management for: `isExporting`, `exportError`
- Create `exportProducts(filters)` function that calls export API
- Handle file download trigger using URL.createObjectURL()
- Include proper error handling and cleanup
- Return hook interface: `{ exportProducts, isExporting, exportError }`

### Step 4: Integrate Export Button in ProductList
**File**: `src/features/product/ProductList.tsx` (modify existing)
- Import and use `useProductExport` hook
- Add export button in header area near search controls (around line 190)
- Use `Download` icon from `lucide-react`
- Pass current filter context to export function
- Handle loading state by disabling button during export
- Display error messages if export fails
- Button placement: After sort controls, before any action buttons

### Step 5: Add Export Validation Schema
**File**: `src/libs/validations/product.ts` (extend existing)
- Create `productExportParamsSchema` extending `productListParamsSchema`
- Remove pagination fields (page, limit) since export gets all records
- Add `validateProductExportParams()` function
- Ensure consistency with existing validation patterns

### Step 6: Create Export Type Definitions
**File**: `src/types/export.ts`
- Define `ProductExportParams` interface
- Define `ExportResponse` interface
- Define `ExportError` interface
- Ensure compatibility with existing `Product` types

## Files to Examine
1. `src/app/api/products/route.ts` - For API patterns and auth
2. `src/features/product/ProductList.tsx` - For UI integration points
3. `src/hooks/useProducts.ts` - For hook patterns and state management
4. `src/libs/validations/product.ts` - For validation patterns
5. `src/types/product.ts` - For type definitions and interfaces

## Files to Create
1. `src/utils/excelHelpers.ts` - Excel generation utilities
2. `src/app/api/products/export/route.ts` - Export API endpoint
3. `src/hooks/useProductExport.ts` - Export hook
4. `src/types/export.ts` - Export type definitions

## Files to Modify
1. `src/features/product/ProductList.tsx` - Add export button and integration
2. `src/libs/validations/product.ts` - Add export validation schema

## Testing Strategy
1. Create `src/utils/__tests__/excelHelpers.test.ts` for utility functions
2. Create `src/hooks/__tests__/useProductExport.test.ts` for hook testing
3. Create `src/app/api/products/export/route.test.ts` for API testing
4. Test with various filter combinations
5. Test error scenarios and edge cases
6. Verify multi-tenancy isolation

## Key Considerations
- **Performance**: Limit exports to 5000 products maximum
- **Security**: Use same auth and validation as existing product APIs
- **UX**: Provide clear loading states and error feedback
- **Browser Compatibility**: Test file downloads across browsers
- **File Format**: Generate .xlsx with proper column headers and formatting

## Success Criteria
- Users can export their product list as Excel file
- Export respects current search/filter/sort context
- File downloads automatically with meaningful filename
- Export is properly secured with multi-tenant isolation
- Loading states and error handling work correctly
- Performance is acceptable for reasonable dataset sizes