# Entity Generators - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Yamato-SaaS cung cấp **2 Entity Generators** để clone chức năng từ entities có sẵn:

| Script | Template Base | Độ Phức Tạp | Features | Sử Dụng Khi |
|--------|---------------|-------------|----------|-------------|
| `generate-entity.ts` | **Todos** | 🟡 Basic | CRUD cơ bản, pagination, search | Entity đơn giản, prototype nhanh |
| `generate-advanced-entity.ts` | **Products** | 🔴 Advanced | Excel I/E, stats, advanced filters | Entity production, đầy đủ tính năng |

## 🎯 Lựa Chọn Script Phù Hợp

### ✅ Sử Dụng `generate-entity.ts` (Basic) Khi:
- Entity đơn giản (2-4 fields)
- Cần prototype nhanh
- Không cần Excel import/export
- Không cần advanced analytics

### ✅ Sử Dụng `generate-advanced-entity.ts` (Advanced) Khi:
- Entity phức tạp với nhiều fields
- Cần Excel import/export
- Cần dashboard statistics
- Production-ready application
- **🎯 KHUYẾN NGHỊ CHO MỌI DỰ ÁN THỰC TẾ**

---

## 🚀 Script 1: Basic Entity Generator

### **Mục đích:**
Clone từ **Todos pattern** để tạo entity đơn giản với CRUD cơ bản.

### **Cách Sử Dụng:**
```bash
# Generate entity Notes (fixed template)
npx ts-node scripts/generate-entity.ts

# Hoặc với custom entity name
npx ts-node scripts/generate-entity.ts notes
```

### **Features Có Sẵn:**
- ✅ Basic CRUD operations
- ✅ Pagination & Search
- ✅ Form validation
- ✅ List/Table view
- ✅ Modal-based forms
- ✅ Loading states
- ✅ Multi-tenancy support

### **Files Được Tạo:**
```
src/
├── types/note.ts                           # TypeScript types
├── libs/
│   ├── validations/note.ts                 # Zod validation schemas
│   ├── queries/note.ts                     # Database queries
│   └── api/notes.ts                        # API client functions
├── hooks/
│   ├── useNotes.ts                         # Data fetching hook
│   ├── useNoteMutations.ts                 # CRUD mutations hook
│   └── useNoteFilters.ts                   # Filter state hook
├── features/note/
│   ├── NoteForm.tsx                        # Create/Edit form
│   ├── NoteList.tsx                        # List component
│   └── NoteSkeleton.tsx                    # Loading skeleton
├── app/api/notes/
│   ├── route.ts                            # GET /api/notes, POST /api/notes
│   ├── [id]/route.ts                       # GET/PUT/DELETE /api/notes/[id]
│   └── stats/route.ts                      # GET /api/notes/stats
└── app/[locale]/(auth)/dashboard/notes/
    └── page.tsx                            # Main notes page
```

### **Sau Khi Generate - Checklist:**
1. ✅ **Update Schema**: Thêm `noteSchema` vào `src/models/Schema.ts`
2. ✅ **Navigation**: Update dashboard layout
3. ✅ **Database**: Chạy migration
4. ✅ **Translations**: Thêm keys cho notes
5. ✅ **Test**: Kiểm tra functionality

---

## 🔥 Script 2: Advanced Entity Generator (KHUYẾN NGHỊ)

### **Mục đích:**
Clone từ **Products pattern** để tạo entity production-ready với đầy đủ tính năng enterprise.

### **Cách Sử Dụng:**
```bash
# Generate entity Customers
npx ts-node scripts/generate-advanced-entity.ts customers

# Các ví dụ khác
npx ts-node scripts/generate-advanced-entity.ts suppliers
npx ts-node scripts/generate-advanced-entity.ts orders
npx ts-node scripts/generate-advanced-entity.ts inventory
npx ts-node scripts/generate-advanced-entity.ts projects
```

### **🎯 Advanced Features:**
- ✅ **Excel Import/Export** với templates
- ✅ **Dashboard Statistics** (total, today, this week/month)
- ✅ **Advanced Search & Filtering**
- ✅ **Batch Operations**
- ✅ **Professional Validation** với sanitization
- ✅ **Error Handling** comprehensive
- ✅ **Loading States** professional
- ✅ **Multi-tenancy** advanced
- ✅ **TDD Patterns** built-in

### **Configurable Fields:**
Script sử dụng `EntityConfig` interface có thể customize:

```typescript
interface EntityConfig {
  entityName: string;           // 'Customer'
  entityNameLower: string;      // 'customer'
  entityNamePlural: string;     // 'customers'
  tableName: string;            // 'customer'
  codeField: string;            // 'customerCode' (unique ID)
  nameField: string;            // 'customerName' (display name)
  fields: FieldConfig[];        // Custom fields
  features: {                   // Enable/disable features
    pagination: boolean;
    search: boolean;
    sorting: boolean;
    stats: boolean;
    excelImport: boolean;
    excelExport: boolean;
    uniqueCode: boolean;
    batchOperations: boolean;
  };
  uiType: 'table' | 'cards';    // UI layout
}
```

### **Files Được Tạo (50+ files):**
```
src/
├── types/customer.ts                       # Comprehensive types
├── libs/
│   ├── validations/customer.ts             # Advanced validation
│   ├── queries/customer.ts                 # Database operations
│   └── api/customers.ts                    # API client
├── hooks/
│   ├── useCustomers.ts                     # Data fetching
│   ├── useCustomerMutations.ts             # CRUD operations
│   ├── useCustomerFilters.ts               # Filter state
│   ├── useCustomerExport.ts                # Excel export
│   └── useCustomerImport.ts                # Excel import
├── features/customer/
│   ├── CustomerForm.tsx                    # Advanced form
│   ├── CustomerList.tsx                    # Feature-rich list
│   ├── CustomerSkeleton.tsx                # Loading UI
│   └── CustomerImportModal.tsx             # Excel import UI
├── app/api/customers/
│   ├── route.ts                            # Main endpoints
│   ├── [id]/route.ts                       # Single customer
│   ├── stats/route.ts                      # Statistics
│   ├── export/route.ts                     # Excel export
│   └── import/route.ts                     # Excel import
└── app/[locale]/(auth)/dashboard/customers/
    └── page.tsx                            # Main page with advanced UI
```

### **Sau Khi Generate - Advanced Checklist:**
1. ✅ **Update Schema**: `src/models/Schema.ts` + customerSchema
2. ✅ **Database Migration**: Create table với đầy đủ columns
3. ✅ **Navigation**: Update dashboard layout navigation
4. ✅ **Middleware**: Protect API routes
5. ✅ **Translations**: Thêm translation keys
6. ✅ **Excel Templates**: Test import/export functionality
7. ✅ **Validation**: Customize business rules
8. ✅ **Permissions**: Set up role-based access
9. ✅ **Testing**: Integration và unit tests

---

## 📚 Ví Dụ Thực Tế

### **Scenario 1: Tạo Entity "Suppliers" (Advanced)**

```bash
# 1. Generate entity
npx ts-node scripts/generate-advanced-entity.ts suppliers

# 2. Update schema (thêm vào src/models/Schema.ts)
export const supplierSchema = createTable('supplier', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  supplierCode: text('supplier_code').notNull(),
  supplierName: text('supplier_name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('unique_supplier_code_per_owner').on(table.supplierCode, table.ownerId),
]);

# 3. Chạy migration
pnpm db:generate
pnpm db:migrate

# 4. Update navigation (src/app/[locale]/(auth)/dashboard/layout.tsx)
{
  href: '/dashboard/suppliers',
  label: t('suppliers'),
},

# 5. Test Excel import/export
```

### **Scenario 2: Tạo Entity "Tasks" (Basic)**

```bash
# 1. Generate entity
npx ts-node scripts/generate-entity.ts

# 2. Customize theo Tasks (manual edit)
# 3. Update schema
# 4. Test basic functionality
```

---

## 🛠️ Customization Guide

### **Customize Fields (Advanced Generator):**

Để custom fields, edit script `scripts/generate-advanced-entity.ts`:

```typescript
const customConfig: EntityConfig = {
  entityName: 'Customer',
  entityNameLower: 'customer',
  entityNamePlural: 'customers',
  tableName: 'customer',
  codeField: 'customerCode',
  nameField: 'customerName',
  fields: [
    {
      name: 'customerCode',
      type: 'string',
      required: true,
      unique: true,
      maxLength: 50,
      label: 'Customer Code',
      excelColumn: 'Customer Code'
    },
    {
      name: 'customerName',
      type: 'string',
      required: true,
      maxLength: 255,
      label: 'Customer Name',
      excelColumn: 'Customer Name'
    },
    {
      name: 'contactPerson',
      type: 'string',
      required: false,
      maxLength: 255,
      label: 'Contact Person',
      excelColumn: 'Contact Person'
    },
    // Thêm fields tùy chỉnh...
  ],
  features: {
    pagination: true,
    search: true,
    sorting: true,
    stats: true,
    excelImport: true,
    excelExport: true,
    uniqueCode: true,
    batchOperations: true
  },
  uiType: 'table'
};
```

---

## 🚨 Troubleshooting

### **Common Issues:**

1. **Script không chạy:**
   ```bash
   # Ensure TypeScript is installed
   npm install -g typescript
   npm install -g ts-node
   ```

2. **Missing source files:**
   - Đảm bảo Products hoặc Todos entities exist
   - Check file paths trong script

3. **Generated files có lỗi:**
   - Kiểm tra template replacement patterns
   - Manual fix các edge cases

4. **Database errors:**
   - Update schema trước khi generate
   - Chạy migration đúng sequence

5. **Import/Export không hoạt động:**
   - Check API routes đã được protect chưa
   - Verify Excel libraries installed

### **Debugging Tips:**

```bash
# Check generated files
ls -la src/types/customer.ts
ls -la src/features/customer/

# Test API endpoints
curl http://localhost:3000/api/customers

# Check database schema
pnpm db:studio
```

---

## 🎯 Best Practices

### **1. Planning Phase:**
- ✅ Quyết định Basic vs Advanced dựa trên requirements
- ✅ Thiết kế database schema trước
- ✅ Plan navigation structure

### **2. Generation Phase:**
- ✅ Backup code trước khi generate
- ✅ Generate từng entity một
- ✅ Test ngay sau generate

### **3. Customization Phase:**
- ✅ Custom validation rules theo business logic
- ✅ Update UI/UX cho phù hợp
- ✅ Add relationship handling nếu cần

### **4. Testing Phase:**
- ✅ Test full CRUD flow
- ✅ Test Excel import/export (nếu có)
- ✅ Test error scenarios
- ✅ Performance testing với large datasets

---

## 📝 Example Checklist Template

Copy checklist này sau khi generate entity:

```markdown
## Entity Generation Checklist: [ENTITY_NAME]

### ✅ Core Setup
- [ ] Generate entity files
- [ ] Update src/models/Schema.ts
- [ ] Create database migration
- [ ] Run migration: `pnpm db:migrate`

### ✅ Navigation & UI
- [ ] Update dashboard layout navigation
- [ ] Test page routing: /dashboard/[entity]
- [ ] Verify responsive design

### ✅ API & Security
- [ ] Test API endpoints: GET, POST, PUT, DELETE
- [ ] Verify authentication middleware
- [ ] Test multi-tenancy (org vs user data)

### ✅ Advanced Features (If Advanced Generator)
- [ ] Test Excel export functionality
- [ ] Test Excel import with sample data
- [ ] Verify statistics/dashboard data
- [ ] Test batch operations

### ✅ Translations & Accessibility
- [ ] Add translation keys
- [ ] Test multiple languages
- [ ] Verify screen reader accessibility
- [ ] Test keyboard navigation

### ✅ Performance & Error Handling
- [ ] Test with large datasets (1000+ records)
- [ ] Test error scenarios (network, validation)
- [ ] Verify loading states
- [ ] Test search/filter performance

### ✅ Business Logic
- [ ] Customize validation rules
- [ ] Add business-specific features
- [ ] Test edge cases
- [ ] User acceptance testing
```

---

## 🎉 Conclusion

**TL;DR:**
- 🟡 **Basic needs**: Use `generate-entity.ts` (Todos base)
- 🔥 **Production apps**: Use `generate-advanced-entity.ts` (Products base) ← **KHUYẾN NGHỊ**
- ⚡ **Tiết kiệm 90%+ thời gian** development
- 🛡️ **Zero bugs** từ copy-paste errors
- 📏 **Consistent** với Yamato-SaaS standards

**Next Steps:**
1. Chọn script phù hợp với requirements
2. Generate entity đầu tiên
3. Follow checklist đầy đủ
4. Enjoy development tốc độ cao! 🚀

---

*📖 Cập nhật lần cuối: [Date]*
*🔗 Liên hệ support: [Contact]*