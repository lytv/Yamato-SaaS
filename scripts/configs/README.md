# Entity Generator V3 - Configuration Guide

## 📁 Files Created

### 1. Configuration Files
- `scripts/configs/plandetail-config.ts` - Configuration cho PlanDetail entity
- `scripts/enhanced-generate-advanced-entity-V3-configurable.ts` - Script generator có thể dùng external config

### 2. Usage

#### Option 1: Sử dụng Config File (Recommended)
```bash
# Chạy với config file đã tạo
npx ts-node scripts/enhanced-generate-advanced-entity-V3-configurable.ts plandetail configs/plandetail-config.ts
```

#### Option 2: Sử dụng Script gốc
```bash
# Chạy với built-in config (Plan entity)
npx ts-node scripts/enhanced-generate-advanced-entity-V3-with-relations.ts plandetail
```

## 🎯 PlanDetail Configuration Features

### Database Schema Mapping
PlanDetail entity được config dựa trên `planDetailSchema` trong Schema.ts với:

#### 📋 **Relationships:**
- **belongsTo Plan**: `planId` -> `Plan.id` (required, cascade delete)

#### 📊 **Fields:**
- **Location & Resource**: `locationCode`, `locationType`
- **Product Reference**: `productCode`, `productSubCode`
- **Quantity Planning**: `plannedQuantity`, `actualQuantity`
- **Scheduling**: `plannedStartDate`, `plannedEndDate`, `actualStartDate`, `actualEndDate`
- **Status & Priority**: `status`, `priority`, `note`

#### 🔧 **Features Enabled:**
- ✅ Pagination, Search, Sorting
- ✅ Statistics
- ✅ Excel Import/Export
- ✅ Batch Operations
- ✅ Database Relationships
- ✅ Type Safety

## 📝 Generated Files Structure

Khi chạy script, sẽ tạo ra:

```
src/
├── types/plandetail.ts                                    # TypeScript types
├── models/Schema/plandetail.ts                           # Database schema
├── libs/
│   ├── queries/plandetail.ts                            # Database queries
│   └── validations/plandetail.ts                        # Zod validation
├── app/api/plandetails/
│   ├── route.ts                                         # CRUD endpoints
│   ├── [id]/route.ts                                    # Single entity
│   ├── stats/route.ts                                   # Statistics
│   ├── export/route.ts                                  # Excel export
│   ├── import/route.ts                                  # Excel import
│   └── relations/options/route.ts                      # Relation dropdowns
├── features/plandetail/
│   ├── PlanDetailForm.tsx                               # Form with relations
│   ├── PlanDetailList.tsx                               # Data table
│   └── PlanDetailSkeleton.tsx                           # Loading state
├── hooks/
│   ├── usePlanDetails.ts                                # Data fetching
│   └── usePlanDetailMutations.ts                        # CRUD operations
└── app/[locale]/(auth)/dashboard/plandetails/page.tsx   # Main page
```

## 🔧 Customization

### Modify Configuration
Để thay đổi cấu hình, chỉnh sửa file `scripts/configs/plandetail-config.ts`:

```typescript
export const planDetailConfig: EntityConfig = {
  entityName: 'PlanDetail',
  entityNameLower: 'plandetail',
  tableName: 'plan_detail',
  codeField: 'locationCode',
  nameField: 'productSubCode',
  fields: [
    // Thêm/sửa/xóa fields ở đây
    {
      name: 'customField',
      type: 'string',
      required: false,
      label: 'Custom Field',
      // ...
    }
  ],
  features: {
    // Bật/tắt features
    relationships: true,
    excelImport: true,
    // ...
  }
};
```

### Add New Relationships
```typescript
{
  name: 'newRelation',
  type: 'relation',
  required: false,
  label: 'New Relation',
  relation: {
    type: 'belongsTo',
    entity: 'NewEntity',
    entityLower: 'newentity',
    foreignKey: 'newEntityId',
    displayField: 'newEntityName',
    onDelete: 'setNull'
  }
}
```

## 🚀 Business Logic Helpers

Config file bao gồm các helper functions:

```typescript
// Generate location codes
planDetailHelpers.generateLocationCode('alpha', 4); // "K04"
planDetailHelpers.generateLocationCode('numeric', 7); // "7"

// Calculate progress
planDetailHelpers.calculateProgress(100, 75); // 75%

// Auto-determine status
planDetailHelpers.determineStatus(
  plannedStart, plannedEnd, 
  actualStart, actualEnd, 
  plannedQty, actualQty
); // 'planned' | 'in_progress' | 'completed'

// Validate product codes
planDetailHelpers.validateProductCodes('NHA01', 'NHA_01_CM'); // true
```

## ⚡ Next Steps

1. **Run the generator:**
   ```bash
   npx ts-node scripts/enhanced-generate-advanced-entity-V3-configurable.ts plandetail configs/plandetail-config.ts
   ```

2. **Update main Schema.ts:**
   ```typescript
   // Add to src/models/Schema.ts
   export * from './Schema/plandetail';
   ```

3. **Run type check:**
   ```bash
   npm run type-check
   ```

4. **Test generated entity:**
   - Visit `/dashboard/plandetails`
   - Test CRUD operations
   - Test Excel import/export
   - Test relationships

## 🔍 Validation Rules

Config bao gồm validation rules tự động:

```typescript
export const planDetailValidationRules = {
  statusOptions: ['planned', 'in_progress', 'completed', 'cancelled'],
  priorityMin: 1,
  priorityMax: 10,
  locationCodePatterns: {
    alpha: /^[A-Z]\d{2,3}$/,    // K04, K01, K31
    numeric: /^\d{1,2}$/,       // 2, 7, 4, 10, 5
  },
  quantityMin: 0,
  quantityMax: 999999,
};
```

## 🎨 UI Components

Generated form sẽ có:

- **Plan Selector**: Dropdown cho chọn Plan (relationship)
- **Location Fields**: Input cho location code và type
- **Product Fields**: Input cho product codes
- **Quantity Fields**: Number inputs với validation
- **Date Pickers**: Cho planned/actual dates
- **Status Dropdown**: Với predefined options
- **Priority Slider**: 1-10 range
- **Note Textarea**: Cho ghi chú

## 🔄 Migration Notes

Nếu database schema đã tồn tại, có thể cần:

1. **Backup database** trước khi chạy
2. **Review generated schema** so với existing
3. **Create migration** nếu cần thay đổi
4. **Test thoroughly** sau khi generate

---

**Ready to generate PlanDetail entity!** 🚀
