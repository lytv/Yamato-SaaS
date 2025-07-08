# OutsourceOrder Entity Generator

Tự động tạo đầy đủ CRUD files cho **OutsourceOrder** entity dựa trên schema hiện có.

## 📁 Files đã tạo

```
scripts/
├── configs/
│   └── outsource-order-config.ts    # Entity configuration
├── generate-outsource-order.js      # Helper script  
└── README-outsource-order.md        # Hướng dẫn này
```

## 🚀 Cách sử dụng

### **Option 1: Sử dụng NPM Scripts (Đơn giản nhất)**

```bash
# Dry run (xem trước mà không tạo files)
npm run generate:entity:dry

# Tạo files thực tế
npm run generate:entity
```

### **Option 2: Sử dụng Helper Script**

```bash
# Di chuyển vào thư mục scripts
cd scripts

# Dry run (xem trước mà không tạo files)
node generate-outsource-order.js --dry-run --verbose

# Tạo files thực tế với backup
node generate-outsource-order.js --backup --verbose

# Tạo files và ghi đè (nếu cần)
node generate-outsource-order.js --force --backup
```

### **Option 3: Chạy trực tiếp Script gốc**

```bash
# Di chuyển vào thư mục scripts
cd scripts

# Dry run
npx tsx enhanced-generate-advanced-entity-V4-improved.ts outsourceorder ./configs/outsource-order-config.ts --dry-run --verbose

# Tạo files thực tế
npx tsx enhanced-generate-advanced-entity-V4-improved.ts outsourceorder ./configs/outsource-order-config.ts --backup --verbose
```

## 📋 Files sẽ được tạo

Sau khi chạy thành công, các files sau sẽ được tạo:

```
src/
├── types/
│   └── outsourceOrder.ts              # TypeScript types & interfaces
├── libs/
│   ├── queries/
│   │   └── outsourceOrder.ts          # Database queries (Drizzle ORM)
│   └── validations/
│       └── outsourceOrder.ts          # Zod validation schemas
├── hooks/
│   ├── useOutsourceOrders.ts          # Main data fetching hook
│   ├── useOutsourceOrderMutations.ts  # Create/Update/Delete hooks
│   ├── useOutsourceOrderFilters.ts    # Filters & search hook
│   └── useOutsourceOrderExport.ts     # Excel export hook
└── app/api/
    └── outsourceOrders/
        └── route.ts                    # API endpoints (GET, POST, PUT, DELETE)
```

## ⚙️ Config Features

### ✅ **Enabled Features:**
- **Pagination** - Phân trang danh sách
- **Search** - Tìm kiếm theo orderCode, orderTitle  
- **Sorting** - Sắp xếp theo date, status, priority
- **Stats** - Thống kê theo status, user, time
- **Excel Export** - Xuất Excel với options
- **Unique Code** - orderCode unique per owner
- **Relations** - Join với userSync (createdBy, assignedTo)
- **Filters** - Lọc theo status, user, date range
- **Relation Options** - Dropdown chọn users

### ❌ **Disabled Features:**
- **Excel Import** - Orders thường tạo manual
- **Batch Operations** - Ít khi xóa/sửa hàng loạt

## 🔗 Relations Configuration

Config đã setup 2 relations với `userSyncSchema`:

```typescript
// 1. Created By User
createdByUser: belongsTo userSync
foreignKey: createdByUserId -> userSync.userId
displayField: fullName

// 2. Assigned To User  
assignedToUser: belongsTo userSync
foreignKey: assignedToUserId -> userSync.userId
displayField: fullName
```

## 🎯 Business Logic

### **Validation Rules:**
- `orderCode` - Required, unique per owner
- `orderDate` - Required, không được > today
- `expectedCompletionDate` - Phải >= orderDate
- `actualCompletionDate` - Phải >= orderDate, chỉ set khi completed
- `priority` - Range 1-10
- `totalAmount` - >= 0 (nếu có)
- `status` - Workflow: draft → sent → in_progress → completed

### **Business Rules:**
- Không thể assign cho chính mình
- actualCompletionDate chỉ set khi status = completed
- Status workflow validation

## 📊 Usage Examples

### **1. Sử dụng trong React Component:**

```typescript
import { useOutsourceOrders, useOutsourceOrderMutations } from '@/hooks/useOutsourceOrders';

function OutsourceOrderList() {
  // Fetch data with pagination & filters
  const { data: orders, isLoading } = useOutsourceOrders({
    page: 1,
    limit: 10,
    search: 'GGC',
    status: 'in_progress',
    includeRelations: true
  });

  // Mutations
  const { createOrder, updateOrder, deleteOrder } = useOutsourceOrderMutations();

  // Create new order
  const handleCreate = async (formData) => {
    await createOrder.mutateAsync({
      orderCode: 'GGC003',
      orderTitle: 'New outsource order',
      assignedToUserId: 'user_123',
      orderDate: new Date(),
      status: 'draft',
      priority: 5
    });
  };

  return (
    <div>
      {isLoading ? 'Loading...' : orders?.map(order => (
        <div key={order.id}>
          <h3>{order.orderCode} - {order.orderTitle}</h3>
          <p>Assigned to: {order.assignedToUser?.fullName}</p>
          <p>Status: {order.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### **2. Sử dụng Filters:**

```typescript
import { useOutsourceOrderFilters } from '@/hooks/useOutsourceOrderFilters';

function OrderFilters() {
  const {
    filters,
    setSearch,
    setStatus,
    setSorting,
    resetFilters,
    hasActiveFilters
  } = useOutsourceOrderFilters();

  return (
    <div>
      <input 
        value={filters.search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search orders..."
      />
      
      <select 
        value={filters.status || ''}
        onChange={(e) => setStatus(e.target.value || undefined)}
      >
        <option value="">All Status</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      
      {hasActiveFilters && (
        <button onClick={resetFilters}>Clear Filters</button>
      )}
    </div>
  );
}
```

### **3. Export Excel:**

```typescript
import { useOutsourceOrderExport } from '@/hooks/useOutsourceOrderExport';

function ExportButton() {
  const { exportData, isExporting, progress } = useOutsourceOrderExport();

  const handleExport = () => {
    exportData({
      format: 'xlsx',
      filename: 'outsource-orders-export',
      includeHeaders: true,
      status: 'completed' // Only export completed orders
    });
  };

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? `Exporting... ${progress}%` : 'Export Excel'}
    </button>
  );
}
```

## 🔧 Customization

Nếu cần modify, edit file config:
```bash
scripts/configs/outsource-order-config.ts
```

Sau đó chạy lại generator để regenerate files.

## ⚠️ Lưu ý quan trọng

1. **Schema tồn tại**: `outsourceOrderSchema` đã có trong `/models/Schema.ts`, script sẽ skip generate schema
2. **Relations**: Đảm bảo `userSyncSchema` có sẵn và accessible
3. **API Routes**: Có thể cần adjust imports nếu structure khác
4. **Types**: Double-check import paths trong generated files

## 🆘 Troubleshooting

**Lỗi: "Config file not found"**
```bash
# Đảm bảo đang ở thư mục scripts
cd scripts
pwd  # Confirm location
```

**Lỗi: "Entity config not found"**
```bash
# Check config export names
node -e "console.log(Object.keys(require('./configs/outsource-order-config.ts')))"
```

**Lỗi: "Permission denied"**
```bash
# Check file permissions
ls -la enhanced-generate-advanced-entity-V4-improved.ts
```

---

**📞 Support**: Nếu gặp vấn đề, check generated files và adjust imports/types theo structure project.
