# 🚀 PRODUCTS ADVANCED PATTERN - COMPREHENSIVE REFERENCE

## 🎯 **Lý do Products tốt hơn Todos làm Template**

Products pattern được thiết kế cho enterprise applications với nhiều tính năng advanced:

### **📊 Key Advantages:**
- ✅ **Excel Import/Export** - Professional data exchange
- ✅ **Unique Constraints** - Business logic enforcement (productCode + ownerId)
- ✅ **Table UI** - Better for data-heavy applications
- ✅ **Advanced Filtering** - Multi-field search & complex sorting
- ✅ **Batch Operations** - Import hundreds of records at once
- ✅ **Professional Validation** - Field-level validation with business rules
- ✅ **Error Handling** - Comprehensive error reporting for imports
- ✅ **File Upload** - Drag & drop Excel files
- ✅ **Export with Context** - Export filtered/sorted data

## 🏗️ **Products Architecture Layers**

### **1. Enhanced Database Schema**
```typescript
export const productSchema = pgTable('product', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  productCode: text('product_code').notNull(),     // Unique business identifier
  productName: text('product_name').notNull(),     // Display name
  notes: text('notes'),                            // Optional long text
  category: text('category'),                      // Categorization
  // ... timestamps
}, (table) => {
  return {
    // CRITICAL: Unique constraint per owner for business logic
    productCodeOwnerIdx: uniqueIndex('product_code_owner_idx').on(
      table.productCode,
      table.ownerId,
    ),
  };
});
```

### **2. Advanced Type System**
```typescript
// Multiple specialized types for different use cases
export type ProductListParamsWithOwner = ProductListParams & { ownerId: string };
export type ProductExportParams = { search?: string; sortBy?: string; sortOrder?: string };
export type ImportResult = {
  totalRows: number;
  successCount: number;
  errorCount: number;
  createdProducts: Product[];
  errors: ImportError[];
};
```

### **3. Excel Integration Layer**
- **Export**: `generateProductsExcel()` with professional formatting
- **Import**: `parseExcelFile()` with validation & error reporting
- **Templates**: Auto-generated Excel templates with proper headers
- **Validation**: Business rule validation during import

### **4. Professional UI Components**
- **Table Layout**: Better for data-heavy applications vs cards
- **Batch Operations**: Import/Export buttons with progress indicators
- **Advanced Filters**: Multi-field search, sorting, pagination
- **Confirmation Dialogs**: Professional delete confirmations
- **Error Reporting**: Detailed import error display

### **5. Business Logic Patterns**
- **Unique Constraints**: Enforce business rules at DB level
- **Code Validation**: Check for duplicates before creation
- **Multi-tenancy**: Advanced ownerId pattern with orgId fallback
- **Audit Trail**: Comprehensive timestamps and change tracking

## 📁 **File Structure Comparison**

### **Todos (Basic CRUD)**
```
├── types/todo.ts              (Simple types)
├── queries/todo.ts            (Basic CRUD)
├── api/todos/route.ts         (Simple endpoints)
└── components/TodoList.tsx    (Card layout)
```

### **Products (Enterprise)**
```
├── types/product.ts               (Advanced types with import/export)
├── queries/product.ts             (Business logic + unique constraints)
├── validations/product.ts         (Enhanced validation schemas)
├── utils/excelHelpers.ts          (Excel processing utilities)
├── api/products/
│   ├── route.ts                   (Main CRUD)
│   ├── export/route.ts            (Excel export endpoint)
│   └── import/route.ts            (Excel import endpoint)
├── hooks/
│   ├── useProducts.ts             (Data fetching)
│   ├── useProductMutations.ts     (CRUD mutations)
│   ├── useProductFilters.ts       (Advanced filtering)
│   └── useProductExport.ts        (Excel export logic)
└── components/
    ├── ProductList.tsx            (Table UI with import/export)
    ├── ProductForm.tsx            (Enhanced form)
    └── ProductImportModal.tsx     (Import dialog with progress)
```

## 🔧 **Key Implementation Patterns**

### **Excel Export Pattern**
```typescript
// 1. API Route
export async function GET(request: NextRequest): Promise<Response> {
  // Fetch data without pagination limits (up to 5000)
  const result = await getPaginatedProducts({ ...params, limit: 5000 });
  
  // Generate Excel with proper formatting
  const excelBuffer = generateProductsExcel(result.products);
  
  // Return with proper headers for download
  return new Response(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }
  });
}

// 2. Excel Generation
export function generateProductsExcel(products: readonly Product[]): Buffer {
  const excelData = products.map(product => ({
    'Product Code': product.productCode,
    'Product Name': product.productName,
    'Category': product.category || '',
    'Notes': product.notes || '',
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  // Set column widths, add metadata sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
```

### **Excel Import Pattern**
```typescript
// 1. File Upload Handling
const formData = await request.formData();
const file = formData.get('file') as File;

// 2. Validation
if (!allowedTypes.includes(file.type)) {
  return Response.json({ error: 'Invalid file type' }, { status: 400 });
}

// 3. Parse Excel
const buffer = Buffer.from(await file.arrayBuffer());
const importData = await parseExcelFile(buffer);

// 4. Validate Data
const validation = validateImportData(importData);

// 5. Process with Error Handling
for (const productData of validation.validProducts) {
  try {
    // Check for duplicates
    const existing = await getProductByCode(productData.productCode, ownerId);
    if (existing) {
      failed.push({ rowNumber, field: 'productCode', message: 'Already exists' });
      continue;
    }
    
    // Create product
    const product = await createProduct(productData);
    successful.push(product);
  } catch (error) {
    failed.push({ rowNumber, field: 'general', message: error.message });
  }
}
```

### **Unique Constraint Pattern**
```typescript
// 1. Database Level
productCodeOwnerIdx: uniqueIndex('product_code_owner_idx').on(
  table.productCode,
  table.ownerId,
),

// 2. Application Level Check
export async function getProductByCode(productCode: string, ownerId: string): Promise<ProductDb | null> {
  const [product] = await db
    .select()
    .from(productSchema)
    .where(and(
      eq(productSchema.productCode, productCode),
      eq(productSchema.ownerId, ownerId),
    ))
    .limit(1);
  return product ?? null;
}

// 3. Validation Before Create/Update
const existing = await getProductByCode(data.productCode, ownerId);
if (existing) {
  throw new Error('Product code already exists');
}
```

### **Table UI Pattern**
```typescript
// Professional table layout vs cards
<div className="rounded-md border">
  <table className="w-full">
    <thead>
      <tr className="border-b bg-muted/50">
        <th>Product Code</th>
        <th>Product Name</th>
        <th>Category</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {products.map(product => (
        <tr key={product.id} className="border-b hover:bg-muted/50">
          <td className="font-mono">{product.productCode}</td>
          <td>{product.productName}</td>
          <td>{product.category}</td>
          <td>
            <Button onClick={() => onEdit(product)}>Edit</Button>
            <Button onClick={() => onDelete(product)}>Delete</Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

## 🎯 **When to Use Products Pattern**

### **✅ Use Products Pattern for:**
- **Business Applications** - Need professional data management
- **Data-Heavy Entities** - Many records, complex filtering needed
- **Import/Export Requirements** - Excel integration essential
- **Unique Business Identifiers** - Codes, SKUs, IDs that must be unique
- **Multi-field Search** - Search across multiple columns
- **Professional UI** - Table layouts, batch operations
- **Enterprise Features** - Audit trails, validation, error handling

### **❌ Use Todos Pattern for:**
- **Simple Content** - Notes, comments, basic text entries
- **Personal Use** - Individual user content without business logic
- **Card-based UI** - Better visual presentation for content
- **No Import/Export** - Simple CRUD without file operations
- **No Business Rules** - No unique constraints or complex validation

## 📋 **Products-based Generation Checklist**

### **✅ Database Layer**
- [ ] Schema with unique constraints
- [ ] Business identifier field (code/SKU)
- [ ] Display name field
- [ ] Optional categorization fields

### **✅ Advanced Types**
- [ ] Export parameter types
- [ ] Import result types
- [ ] List params with owner types
- [ ] Error handling types

### **✅ Excel Integration**
- [ ] Export utility functions
- [ ] Import parsing functions
- [ ] Validation functions
- [ ] Error reporting functions

### **✅ API Endpoints**
- [ ] Main CRUD endpoints
- [ ] Export endpoint with filtering
- [ ] Import endpoint with file handling
- [ ] Stats endpoint

### **✅ React Hooks**
- [ ] Data fetching hook
- [ ] Mutations hook
- [ ] Filters hook  
- [ ] Export hook

### **✅ UI Components**
- [ ] Table-based list component
- [ ] Advanced form component
- [ ] Import modal component
- [ ] Skeleton loading states

### **✅ Business Logic**
- [ ] Unique constraint validation
- [ ] Duplicate checking
- [ ] Multi-field search
- [ ] Professional error handling

## 🚀 **Benefits of Products Pattern**

1. **Professional Grade** - Enterprise-ready features
2. **Scalable** - Handles large datasets efficiently
3. **User Friendly** - Excel integration users expect
4. **Robust** - Comprehensive error handling
5. **Flexible** - Easily customizable for different entities
6. **Future-Proof** - Built for growth and complexity

This pattern represents the gold standard for data management in SaaS applications!
