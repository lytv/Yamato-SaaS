# 🏭 SCHEMA_NEW.TS - QUICK REFERENCE

## 📊 **STRUCTURE OVERVIEW** 

**5 EXISTING TABLES (Enhanced)** + **7 NEW PRODUCTION TABLES**

### **Existing Enhanced**
- `organizationSchema` - Stripe billing
- `todoSchema` - Simple todos  
- `productSchema` ⭐ - Enhanced với families, pricing, status
- `productionStepSchema` - Process steps (CAT, MAY, THEU)
- `productionStepDetailSchema` - Step details với pricing

### **New Production Tables**
1. **`planSchema`** - Monthly plans (T.6, T.7, T.8, T.9)
2. **`planDetailSchema`** - Location-based allocation  
3. **`productSubSchema`** - Product variants (colors, embroidery)
4. **`processSchema`** - Main processes (CAT, MAY, THEU, DONG_GOI)
5. **`processSubSchema`** - Sub-processes (CHÍNH, VẢI LÓT)
6. **`workTableSchema`** - Work stations & resources
7. **`processExecutionSchema`** - Actual execution tracking

## 🔗 **KEY RELATIONSHIPS**

```
Plan → PlanDetail → ProcessExecution
       ↓             ↙        ↓
   ProductSub ←→ ProcessSub ← WorkTable
       ↓             ↓
   Product      Process
```

## 🏭 **BUSINESS DOMAIN**

**Industry**: Textile/Garment Manufacturing
- **Processes**: Cắt, May, Thêu, Đóng gói
- **Materials**: Vải chính, Vải lót, Chỉ thêu
- **Variants**: Màu sắc, Họa tiết, Kiểu thêu
- **Resources**: Bàn cắt, Bàn may, Máy thêu

## 🎯 **KEY FEATURES**

### **Planning**
- Monthly production plans với approval workflow
- Location-based resource allocation
- Quantity planning với actual vs planned

### **Process Management**
- Multi-step workflows với dependencies
- Sub-process details với material factors
- Time estimation và capacity planning

### **Execution Tracking**
- Real-time progress monitoring
- Quality control integration
- Performance metrics và efficiency rating

### **Resource Management**
- Work station capacity management
- Operator assignment và scheduling
- Equipment maintenance tracking

## 🔧 **TECHNICAL FEATURES**

### **Performance Optimization**
- Composite indexes cho common queries
- Denormalized fields cho query speed
- Status-based filtering optimization

### **Data Integrity**
- Foreign key constraints với cascade
- Check constraints cho validation
- Unique constraints cho business rules

### **Advanced Types**
- Arrays cho prerequisite processes
- Decimal precision cho financial data
- Date types cho scheduling

## 📈 **COMPLEXITY INDICATORS**

- **7 new tables** với complex relationships
- **20+ indexes** cho performance
- **5+ foreign keys** per table
- **Array fields** cho complex data
- **Decimal precision** cho financial accuracy
- **Status workflows** cho business logic

## 🚀 **IMPLEMENTATION APPROACH**

### **Phase 1: Foundation**
- Plan management (planSchema)
- Product variants (productSubSchema)  
- Work stations (workTableSchema)

### **Phase 2: Processes**
- Process definitions (processSchema)
- Sub-process details (processSubSchema)

### **Phase 3: Execution**
- Detailed planning (planDetailSchema)
- Execution tracking (processExecutionSchema)

## 💡 **PATTERNS USED**

- **Multi-tenancy**: `ownerId` trong mọi table
- **Audit trail**: `createdAt`, `updatedAt` 
- **Soft delete**: Status-based lifecycle
- **Denormalization**: Performance-optimized queries
- **Hierarchical data**: Parent-child relationships
- **Business workflows**: Built-in approval processes

Schema này thể hiện **enterprise-grade complexity** cho sophisticated manufacturing management system.
