# Entity Generation Example: Customers 👥

## Command Used:
```bash
npx ts-node scripts/generate-advanced-entity.ts customers
```

## Generated File Structure:

```
📁 Generated Files (50+ files)
├── 📁 src/types/
│   └── customer.ts                     # TypeScript definitions
├── 📁 src/libs/
│   ├── validations/customer.ts         # Zod validation schemas  
│   ├── queries/customer.ts             # Database operations
│   └── api/customers.ts                # API client functions
├── 📁 src/hooks/
│   ├── useCustomers.ts                 # Data fetching hook
│   ├── useCustomerMutations.ts         # CRUD mutations
│   ├── useCustomerFilters.ts           # Filter state management
│   ├── useCustomerExport.ts            # Excel export hook
│   └── useCustomerImport.ts            # Excel import hook
├── 📁 src/features/customer/
│   ├── CustomerForm.tsx                # Create/Edit form
│   ├── CustomerList.tsx                # Table with filters
│   ├── CustomerSkeleton.tsx            # Loading states
│   └── CustomerImportModal.tsx         # Excel import UI
├── 📁 src/app/api/customers/
│   ├── route.ts                        # GET /api/customers, POST /api/customers
│   ├── [id]/route.ts                   # GET/PUT/DELETE /api/customers/[id]
│   ├── stats/route.ts                  # GET /api/customers/stats
│   ├── export/route.ts                 # GET /api/customers/export
│   └── import/route.ts                 # POST /api/customers/import
└── 📁 src/app/[locale]/(auth)/dashboard/customers/
    └── page.tsx                        # Main customers page
```

## Sample Generated Code:

### `src/types/customer.ts`:
```typescript
/**
 * Customer-related TypeScript types and interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on customerSchema from Drizzle ORM
 */

import type { customerSchema } from '@/models/Schema';

// ✅ Infer the CustomerDb type from Drizzle schema
export type CustomerDb = typeof customerSchema.$inferSelect;

// ✅ Client-side Customer type
export type Customer = Omit<CustomerDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// ✅ Form data for React Hook Form
export type CustomerFormData = {
  customerCode: string;
  customerName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
};

// ... more comprehensive types
```

### `src/libs/validations/customer.ts`:
```typescript
/**
 * Customer Validation Schemas
 * Following TypeScript Type Safety Standards and TDD implementation
 */

import { z } from 'zod';

export const customerFormSchema = z.object({
  customerCode: z.string()
    .trim()
    .min(1, 'Customer code is required')
    .max(50, 'Customer code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Customer code can only contain letters, numbers, underscores and dashes'),

  customerName: z.string()
    .trim()
    .min(1, 'Customer name is required')
    .max(200, 'Customer name must be 200 characters or less'),

  contactPerson: z.string()
    .trim()
    .max(255, 'Contact person must be 255 characters or less')
    .optional()
    .or(z.literal('')),

  // ... more validation rules
});
```

### `src/features/customer/CustomerList.tsx`:
```tsx
/**
 * Displays customers in table format with search, sort, pagination, and actions
 * Generated from Products pattern with advanced features
 */

export function CustomerList({ onEdit, onDelete }: CustomerListProps) {
  const { customers, pagination, isLoading, error, refresh } = useCustomers({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  });

  const { exportCustomers, isExporting } = useCustomerExport();
  const { importCustomers } = useCustomerImport();

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Excel Export */}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || customers.length === 0}
          >
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export
          </Button>

          {/* Excel Import */}
          <CustomerImportModal onSuccess={refresh} />
        </div>
      </div>

      {/* Advanced Table with all features */}
      <CustomerTable 
        customers={customers}
        onEdit={onEdit}
        onDelete={onDelete}
        // ... more props
      />
      
      {/* Pagination */}
      <CustomerPagination {...pagination} />
    </div>
  );
}
```

## Generated Features Demo:

### ✅ **Excel Export**:
```typescript
// Generated hook: useCustomerExport.ts
const { exportCustomers, isExporting } = useCustomerExport();

// Usage:
await exportCustomers({
  search: 'ABC Company',
  sortBy: 'customerName',
  sortOrder: 'asc'
});
// → Downloads: customers-export-2025-01-15.xlsx
```

### ✅ **Excel Import**:
```typescript
// Generated component: CustomerImportModal.tsx
<CustomerImportModal 
  onSuccess={(result) => {
    console.log(`Imported ${result.successful.length} customers`);
    refresh(); // Refresh customer list
  }}
/>
```

### ✅ **Dashboard Stats**:
```typescript
// Generated API: /api/customers/stats
{
  "total": 1250,
  "today": 5,
  "thisWeek": 23,
  "thisMonth": 87,
  "byCategory": [
    { "name": "Enterprise", "count": 450 },
    { "name": "SMB", "count": 800 }
  ]
}
```

### ✅ **Advanced Search**:
```typescript
// Multi-field search automatically generated
const searchFields = [
  'customerCode',
  'customerName', 
  'contactPerson',
  'email',
  'address'
];
// Search "ABC" → matches any field containing "ABC"
```

## Manual Steps After Generation:

### 1. Update Schema (`src/models/Schema.ts`):
```typescript
export const customerSchema = createTable('customer', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  customerCode: text('customer_code').notNull(),
  customerName: text('customer_name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('unique_customer_code_per_owner').on(table.customerCode, table.ownerId),
]);
```

### 2. Update Navigation (`src/app/[locale]/(auth)/dashboard/layout.tsx`):
```tsx
{
  href: '/dashboard/customers',
  label: t('customers'),
  icon: Users,
},
```

### 3. Run Migration:
```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Test Result:
- ✅ Visit: `http://localhost:3000/dashboard/customers`
- ✅ Create customer with form validation
- ✅ Search/filter customers
- ✅ Export to Excel
- ✅ Import from Excel
- ✅ View dashboard stats

## Time Savings:

| Task | Manual Coding | Generator | Savings |
|------|---------------|-----------|---------|
| Types & Interfaces | 2 hours | 0 minutes | 100% |
| API Routes | 4 hours | 0 minutes | 100% |
| React Components | 6 hours | 15 minutes | 96% |
| Validation Schemas | 1 hour | 0 minutes | 100% |
| Excel Import/Export | 8 hours | 0 minutes | 100% |
| Testing Setup | 3 hours | 30 minutes | 83% |
| **TOTAL** | **24 hours** | **45 minutes** | **97%** |

## End Result:

🎉 **Production-ready Customers entity** với đầy đủ tính năng enterprise trong **45 phút** thay vì **3 ngày làm việc**!

---

*Được generate bởi: `generate-advanced-entity.ts` script*  
*Template base: Products pattern*  
*Features: Full CRUD + Excel I/E + Stats + Advanced Filtering*