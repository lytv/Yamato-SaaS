# 🏭 SCHEMA_NEW.TS - PRODUCTION PLANNING & PROCESS MANAGEMENT SYSTEM

## 🎯 **OVERVIEW**

File này định nghĩa database schema cho một **Production Planning & Process Management System** rất phức tạp, có vẻ như được thiết kế cho ngành **may mặc/textile** với các thuật ngữ chuyên ngành như:
- **CAT** (Cắt), **MAY** (May), **THEU** (Thêu), **DONG_GOI** (Đóng gói)
- **CHÍNH**, **VẢI LÓT** (Main fabric, Lining fabric)
- Product variants với color codes, embroidery types

## 📊 **STRUCTURE OVERVIEW**

```
EXISTING TABLES (Enhanced)     NEW PRODUCTION TABLES (7 tables)
├── organizationSchema         ├── planSchema
├── todoSchema                 ├── planDetailSchema  
├── productSchema ⭐           ├── productSubSchema
├── productionStepSchema       ├── processSchema
└── productionStepDetailSchema ├── processSubSchema
                              ├── workTableSchema
                              └── processExecutionSchema
```

## 🔧 **EXISTING TABLES (Enhanced)**

### **1. organizationSchema**
- Stripe integration cho billing
- Subscription management
- Multi-tenancy support

### **2. todoSchema** 
- Simple todo system (existing pattern)
- `ownerId` cho multi-tenancy

### **3. productSchema ⭐ (Enhanced)**
```typescript
// New enhanced fields:
productFamily: text('product_family'),        // Product grouping
variantCount: integer('variant_count'),       // Number of variants
status: text('status').default('active'),     // active/discontinued
launchDate: date('launch_date'),
discontinueDate: date('discontinue_date'),
basePrice: decimal('base_price'),             // Base pricing

// Indexes for performance
productFamilyIdx, productStatusIdx
```

### **4. productionStepSchema**
- Production steps: CAT, MAY, THEU, DONG_GOI
- Step sequencing với `filmSequence`
- Step grouping

### **5. productionStepDetailSchema**
- Links products với production steps
- Pricing: `factoryPrice`, `calculatedPrice`
- Sequence numbers cho workflow
- Boolean flags: `isFinalStep`, `isVtStep`, `isParkingStep`

## 🏭 **NEW PRODUCTION TABLES (7 Tables)**

### **1. planSchema - Monthly Production Plans**
```typescript
// Plan Identity
planCode: text('plan_code'),              // T.6, T.7, T.8, T.9
planName: text('plan_name'),              // 06.2025, 07.2025
planYear: integer('plan_year'),           // 2025
planMonth: integer('plan_month'),         // 6, 7, 8, 9

// Quantities & Targets
totalTargetQuantity: integer,             // 6675, 6125
totalActualQuantity: integer,

// Status & Scheduling
status: text('status'),                   // draft/active/completed/cancelled
planStartDate: date('plan_start_date'),
planEndDate: date('plan_end_date'),

// Approval workflow
approvedBy: text('approved_by'),
approvedAt: timestamp('approved_at'),
```

**Purpose**: Monthly production planning với targets và approval workflow

### **2. planDetailSchema - Location-based Production Allocation**
```typescript
// Foreign Keys
planId: integer.references(planSchema.id),

// Location & Resource Allocation
locationCode: text('location_code'),      // K04, K01, K31 or 2, 7, 4, 10, 5
locationType: text('location_type'),      // alpha/numeric

// Product Reference
productCode: text('product_code'),        // NHA01, NHA02A
productSubCode: text('product_sub_code'), // NHA_01_CM, NHA_02_CO

// Quantity Planning
plannedQuantity: integer,
actualQuantity: integer,

// Scheduling
plannedStartDate: date,
plannedEndDate: date,
actualStartDate: date,
actualEndDate: date,

// Status & Priority
status: text,                             // planned/in_progress/completed/cancelled
priority: integer,                        // 1=highest, 10=lowest
```

**Purpose**: Phân bổ production theo locations với scheduling chi tiết

### **3. productSubSchema - Product Variants & Sub-Products**
```typescript
// Foreign Key
productId: integer.references(productSchema.id),
productCode: text,                        // Redundant for performance

// Sub-Product Identity
productSubCode: text,                     // NHA_01_CM, NHA_02_CO
productSubDetail: text,                   // CÔNG MÀU, SUIREN KIMONO - TÍM

// Classification & Categorization
subCategory: text,                        // CM, CO
colorCode: text,                          // MÀU, BẠC, TRẮNG, TÍM, HỒNG
designPattern: text,                      // CÔNG, SUIREN KIMONO
embroideryType: text,                     // THÊU/KHÔNG THÊU

// Display & Ordering
displayOrder: integer,
subSequence: integer,                     // 01, 02, 03...

// Pricing & Costing
basePrice: decimal,
additionalCost: decimal,
complexityFactor: decimal,                // Production complexity

// Production Info
productionTimeFactor: decimal,            // Time multiplier
requiresSpecialProcess: boolean,
specialRequirements: text,

// SKU & Inventory
skuCode: text,
barcode: text,
```

**Purpose**: Quản lý product variants với detailed attributes cho textile industry

### **4. processSchema - Main Production Processes**
```typescript
// Process Identity
processCode: text,                        // CAT, MAY, THEU, DONG_GOI
processName: text,                        // Cắt, May, Thêu, Đóng gói

// Process Classification
processCategory: text,                    // production/quality/packaging
processType: text,                        // manual/machine/hybrid
department: text,

// Workflow & Sequencing
sequenceOrder: integer,                   // Order in production workflow
isParallelAllowed: boolean,
prerequisiteProcesses: text[],            // Array of required previous processes

// Time & Capacity Management
standardTimePerUnit: integer,             // Standard minutes per unit
setupTime: integer,                       // Setup time
defaultCapacityPerDay: integer,

// Quality & Standards
qualityCheckRequired: boolean,
qualityStandards: text,
defectTolerancePercent: decimal,

// Status & Configuration
isOutsourceable: boolean,
sopDocumentUrl: text,                     // Standard Operating Procedure
```

**Purpose**: Define main production processes với timing, capacity, và quality standards

### **5. processSubSchema - Sub-Processes**
```typescript
// Foreign Key
processId: integer.references(processSchema.id),
processCode: text,                        // Redundant for performance

// Sub-Process Identity
processSubCode: text,                     // chinh, vailot
processSubName: text,                     // CHÍNH, VẢI LÓT

// Sub-Process Classification
subCategory: text,                        // main/auxiliary/support
subType: text,                           // primary_material/secondary_material

// Material & Resource Requirements
materialType: text,                       // fabric_main/fabric_lining/thread
materialConsumptionFactor: decimal,
toolRequirements: text[],

// Time & Complexity
timeFactor: decimal,                      // Time multiplier
complexityLevel: integer,                 // 1=simple, 5=complex
skillLevelRequired: integer,              // 1=basic, 5=expert

// Sequencing within Process
subSequence: integer,
isOptional: boolean,
dependsOnSubCode: text,                   // Dependency on other sub-process

// Costing Factors
laborCostFactor: decimal,
materialCostFactor: decimal,
overheadCostFactor: decimal,

// Status & Automation
isAutomated: boolean,
```

**Purpose**: Chi tiết sub-processes within main processes với material và costing factors

### **6. workTableSchema - Work Stations & Resources**
```typescript
// Table Identity
tableCode: text,                          // "1", "2", "K04", "K01"
tableName: text,                          // Display name
tableDetail: text,                        // "Bàn 1", "Bàn 2"

// Table Classification
tableType: text,                          // cutting/sewing/embroidery/packing
tableCategory: integer,                   // 1,2,3,4...

// Capacity & Specifications
capacityPerDay: integer,
capacityPerHour: integer,
tableSizeLength: decimal,
tableSizeWidth: decimal,

// Location & Assignment
locationCode: text,                       // Physical location
department: text,
assignedOperator: text,
supervisor: text,

// Operational Status
status: text,                             // active/maintenance/offline/repair
availabilitySchedule: text,               // Working hours/shifts
lastMaintenanceDate: date,
nextMaintenanceDate: date,

// Equipment Details
equipmentModel: text,
installationDate: date,
warrantyExpiryDate: date,

// Performance Metrics
utilizationRate: decimal,
efficiencyRating: decimal,
totalProcessedUnits: integer,
```

**Purpose**: Quản lý work stations với capacity, maintenance, và performance tracking

### **7. processExecutionSchema - Actual Process Execution Tracking**
```typescript
// Foreign Key References
planDetailId: integer.references(planDetailSchema.id),
processSubId: integer.references(processSubSchema.id),
workTableId: integer.references(workTableSchema.id),

// Process Type Reference
processType: text,                        // CAT, MAY, THEU
processSubName: text,                     // CHÍNH, VẢI LÓT

// Product Reference (redundant for performance)
productCode: text,
productSubCode: text,
productSubDetail: text,

// Resource Assignment
tableNumber: text,                        // Links to work_table.table_code
operatorAssigned: text,

// Quantity Management
totalQuantity: integer,                   // Total planned
plannedQuantity: integer,                 // For this execution
actualQuantity: integer,
defectQuantity: integer,
reworkQuantity: integer,

// Scheduling
plannedDate: date,
actualStartDate: date,
actualCompletionDate: date,
estimatedDuration: integer,               // Minutes
actualDuration: integer,                  // Minutes

// Status & Quality
status: text,                             // planned/in_progress/completed/cancelled/on_hold
qualityStatus: text,                      // passed/failed/pending/rework_required
completionPercentage: decimal,

// Performance Metrics
efficiencyRating: decimal,
qualityScore: decimal,

// Issues & Notes
issuesEncountered: text,
solutionsApplied: text,
```

**Purpose**: Track actual execution của processes với detailed quantity, timing, quality, và performance metrics

## 🔗 **RELATIONSHIP MAPPING**

```
Plan (Monthly) 
  ├── PlanDetail (Location-based allocation)
      ├── ProductSub (Product variants)
      │   └── Product (Base products)
      └── ProcessExecution (Actual work)
          ├── ProcessSub (Sub-processes)
          │   └── Process (Main processes)  
          └── WorkTable (Work stations)
```

## 📈 **ADVANCED FEATURES**

### **🔍 Advanced Indexing Strategy**
- **Composite indexes** cho common query patterns
- **Unique indexes** cho business constraints
- **Performance indexes** cho reporting queries

### **🛡️ Data Integrity**
- **Foreign key constraints** với cascade deletes
- **Check constraints** cho data validation
- **Unique constraints** cho business rules

### **📊 Redundant Fields for Performance**
- `productCode` trong multiple tables
- `processCode` trong sub-tables
- Denormalization cho query optimization

### **🎯 Business Logic Built-in**
- **Status workflows** với predefined states
- **Approval processes** với timestamps
- **Quality tracking** với scores và tolerances
- **Performance metrics** built into schema

## 🏗️ **SCHEMA DESIGN PATTERNS**

### **1. Multi-tenancy Pattern**
```typescript
ownerId: text('owner_id').notNull() // In every table
```

### **2. Audit Trail Pattern**
```typescript
updatedAt: timestamp.defaultNow().$onUpdate(() => new Date()),
createdAt: timestamp.defaultNow(),
```

### **3. Soft Delete Pattern**
```typescript
status: text('status').default('active') // active/discontinued/deleted
```

### **4. Hierarchical Data Pattern**
```typescript
// Parent-child relationships với foreign keys
// Sequence ordering với integer fields
// Dependency tracking với arrays
```

### **5. Performance Optimization Pattern**
```typescript
// Redundant fields for denormalization
// Composite indexes for query optimization  
// Status indexes for filtering
```

## 🎯 **BUSINESS DOMAIN INSIGHTS**

### **Industry**: Textile/Garment Manufacturing
- **Product variants**: Colors, patterns, embroidery types
- **Production processes**: Cutting, Sewing, Embroidery, Packaging
- **Materials**: Main fabric, lining fabric, threads
- **Quality control**: Built-in quality checkpoints
- **Capacity planning**: Table-based resource allocation

### **Workflow Complexity**
- **Multi-step production** với dependencies
- **Parallel processing** capabilities
- **Resource constraints** với capacity management
- **Quality gates** trong production flow
- **Performance tracking** at every level

### **Planning Sophistication**
- **Monthly planning cycles** với approval workflows
- **Location-based allocation** cho distributed manufacturing
- **Quantity planning** với actual vs planned tracking
- **Time estimation** với standard times và factors

## 🚀 **IMPLEMENTATION CONSIDERATIONS**

### **Data Volume & Performance**
- Schema designed cho **high-volume production data**
- **Extensive indexing** cho query performance
- **Denormalization** cho reporting efficiency

### **Complexity Management**
- **7 new tables** với complex relationships
- **Advanced features** như arrays, decimal precision
- **Business logic** embedded trong schema

### **Integration Points**
- **Existing tables** được enhanced, không replaced
- **Foreign keys** link new system với existing
- **Type exports** cho TypeScript integration

### **Scalability Features**
- **Partitioning-ready** với date fields
- **Index optimization** cho common queries
- **Status-based filtering** cho large datasets

## 💡 **RECOMMENDATIONS FOR IMPLEMENTATION**

### **Phase 1: Core Tables**
1. `planSchema` - Start với basic planning
2. `productSubSchema` - Extend product variants
3. `workTableSchema` - Resource management

### **Phase 2: Process Management**
4. `processSchema` - Main process definitions
5. `processSubSchema` - Sub-process details

### **Phase 3: Execution Tracking**
6. `planDetailSchema` - Detailed planning
7. `processExecutionSchema` - Execution tracking

### **Migration Strategy**
- **Gradual migration** từ existing system
- **Data mapping** từ old schema
- **Feature flags** cho progressive rollout

## 🎯 **CONCLUSION**

Đây là một **enterprise-grade schema** cho production management với:
- ✅ **Comprehensive planning** capabilities
- ✅ **Detailed process tracking**
- ✅ **Resource management**
- ✅ **Quality control** integration
- ✅ **Performance monitoring**
- ✅ **Scalability** considerations

Schema này cho thấy một **mature understanding** của production planning domain và **sophisticated database design** cho complex manufacturing workflows.
