# OutsourceOrder Retail Price Feature

## Overview
Added a new feature "Áp dụng giá lẻ" (Apply Retail Price) to the outsource orders functionality. This allows users to select between normal pricing and retail pricing when creating or editing outsource orders.

## Database Changes
- **Table**: `outsource_order`
- **New Column**: `apply_retail_price` (INTEGER, NOT NULL, DEFAULT 2)
- **Values**: 
  - `2` = Normal pricing (default)
  - `3` = Retail pricing
- **Migration File**: `migrations/0020_add_apply_retail_price_to_outsource_order.sql`

## Code Changes

### 1. Database Schema
- Updated `src/models/Schema/outsourceOrder.ts`
- Added `applyRetailPrice: integer('apply_retail_price').notNull().default(2)`

### 2. TypeScript Types
- Updated `src/types/outsourceOrder.ts`
- Added `applyRetailPrice: number` to form data types
- Added `applyRetailPrice?: number` to input types

### 3. Validation
- Updated `src/libs/validations/outsourceOrder.ts`
- Added `applyRetailPrice: z.number().int().min(2).max(3).default(2)`

### 4. Form UI
- Updated `src/features/outsourceOrder/OutsourceOrderForm.tsx`
- Added dropdown selector with Vietnamese labels
- Default value: 2 (normal pricing)

### 5. List Components
- Updated `src/features/outsourceOrder/OutsourceOrderList.tsx`
- Updated `src/features/outsourceOrder/OutsourceOrderIntegratedList.tsx`
- Added `applyRetailPrice` mapping in data transformation functions

### 6. Localization
- Updated `src/locales/vn.json`
- Added Vietnamese translations:
  - `"apply_retail_price": "Áp dụng giá lẻ"`
  - `"apply_retail_price_placeholder": "Chọn loại giá..."`
  - `"normal_price": "Giá thường (2)"`
  - `"retail_price": "Giá lẻ (3)"`

## Usage
When creating or editing an outsource order, users can now:
1. Select "Giá thường (2)" for normal pricing (default)
2. Select "Giá lẻ (3)" for retail pricing

## Database Migration
To apply the database changes, run:
```bash
npm run db:migrate
```

## Testing
- Form validation ensures only values 2 and 3 are accepted
- Default value is automatically set to 2 (normal pricing)
- UI displays proper Vietnamese labels for both options

## Technical Notes
- The field is required in forms but optional in API inputs (falls back to default)
- Database constraint ensures only values 2 and 3 are allowed
- TypeScript types are fully updated for type safety