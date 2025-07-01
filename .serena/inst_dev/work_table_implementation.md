# 🔧 WORK TABLE IMPLEMENTATION PLAN

## 🎯 **OBJECTIVE**
Implement complete CRUD functionality for WorkTable (Bàn 1, 2, K04, work stations) following Yamato-SaaS todos pattern. This table manages work stations, resources, and equipment with capacity management, maintenance tracking, and performance monitoring.

## 📋 **OVERVIEW**
WorkTable manages work stations and production resources:
- **tableCode**: "1", "2", "K04", "K01" (work station identifiers)
- **tableDetail**: "Bàn 1", "Bàn 2" (display names)
- **Performance tracking**: Utilization, efficiency, processed units
- **Maintenance management**: Dates, schedules, warranties
- **Capacity management**: Per day/hour capacity with specifications
- **Status management**: Active, maintenance, offline, repair

## 🏗️ **IMPLEMENTATION LAYERS (8 Layers)**

### **LAYER 1: DATABASE SCHEMA** ✅ Already exists in schema_new.ts
- File: `src/models/schema_new.ts`
- Status: ✅ Complete - workTableSchema already defined
- Note: Schema includes capacity management, maintenance tracking, performance metrics

---

### **LAYER 2: TYPE DEFINITIONS**
**File to create**: `src/types/workTable.ts`

**Requirements**:
1. **Import schemas**: workTableSchema from schema_new.ts
2. **Server/Client types**: Handle Date vs string differences for multiple date fields
3. **Input types**: Create/Update input types
4. **API response types**: Consistent with todos pattern
5. **Form data types**: Equipment and capacity management forms
6. **Filter types**: Equipment type, status, location-based filtering
7. **Enum types**: Table types, statuses, categories
8. **Metric types**: Performance and capacity calculation types

**Key differences from previous tables**:
- **Multiple date fields**: lastMaintenanceDate, nextMaintenanceDate, installationDate, warrantyExpiryDate
- **Decimal fields**: Capacity rates, dimensions, performance metrics
- **Integer performance fields**: Utilization rates, efficiency ratings
- **Location management**: Physical location and department assignment
- **Equipment tracking**: Model, installation, warranty information

**Example structure**:
```typescript
import type { workTableSchema } from '@/models/schema_new';

// Server-side type (with Date objects)
export type WorkTableDb = typeof workTableSchema.$inferSelect;

// Client-side type (dates as strings from API)
export type WorkTable = Omit<WorkTableDb, 'createdAt' | 'updatedAt' | 'lastMaintenanceDate' | 'nextMaintenanceDate' | 'installationDate' | 'warrantyExpiryDate'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  lastMaintenanceDate: string | Date | null;
  nextMaintenanceDate: string | Date | null;
  installationDate: string | Date | null;
  warrantyExpiryDate: string | Date | null;
};

// Input types
export type CreateWorkTableInput = typeof workTableSchema.$inferInsert;
export type UpdateWorkTableInput = Partial<Omit<CreateWorkTableInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Enum types for dropdowns
export type TableType = 'cutting' | 'sewing' | 'embroidery' | 'packing' | 'quality_control' | 'other';
export type WorkTableStatus = 'active' | 'maintenance' | 'offline' | 'repair' | 'decommissioned';
export type CapacityUnit = 'per_hour' | 'per_day' | 'per_shift';

// API response types following todos pattern
export type WorkTablesResponse = {
  success: true;
  data: WorkTable[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type WorkTableResponse = {
  success: true;
  data: WorkTable;
  message?: string;
};

export type WorkTableErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Form data type (comprehensive for work table management)
export type WorkTableFormData = {
  tableCode: string;
  tableName: string;
  tableDetail: string;
  tableType: TableType;
  tableCategory: number;
  capacityPerDay: number;
  capacityPerHour: number;
  tableSizeLength: number;
  tableSizeWidth: number;
  locationCode: string;
  department: string;
  assignedOperator: string;
  supervisor: string;
  status: WorkTableStatus;
  availabilitySchedule: string;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  equipmentModel: string;
  installationDate: string | null;
  warrantyExpiryDate: string | null;
  utilizationRate: number;
  efficiencyRating: number;
  totalProcessedUnits: number;
  specialCapabilities: string;
  limitations: string;
  note: string;
};

// List parameters with work table specific filters
export type WorkTableListParams = {
  search?: string;
  ownerId: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'tableName' | 'tableCode' | 'capacityPerDay' | 'utilizationRate' | 'efficiencyRating';
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
  // WorkTable-specific filters
  tableType?: TableType;
  status?: WorkTableStatus;
  department?: string;
  locationCode?: string;
  tableCategory?: number;
  assignedOperator?: string;
  supervisor?: string;
  // Capacity filters
  minCapacityPerDay?: number;
  maxCapacityPerDay?: number;
  minCapacityPerHour?: number;
  maxCapacityPerHour?: number;
  // Performance filters
  minUtilizationRate?: number;
  maxUtilizationRate?: number;
  minEfficiencyRating?: number;
  maxEfficiencyRating?: number;
  // Maintenance filters
  maintenanceDue?: boolean; // nextMaintenanceDate <= today
  warrantyExpiring?: boolean; // warrantyExpiryDate within 30 days
};

// Filter state type for UI
export type WorkTableFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'tableName' | 'tableCode' | 'capacityPerDay' | 'utilizationRate' | 'efficiencyRating';
  sortOrder: 'asc' | 'desc';
  tableType: TableType | 'all';
  status: WorkTableStatus | 'all';
  department: string;
  locationCode: string;
  tableCategory: number | 'all';
  assignedOperator: string;
  supervisor: string;
  // Capacity range filters
  capacityPerDayRange: [number, number];
  capacityPerHourRange: [number, number];
  // Performance range filters
  utilizationRateRange: [number, number];
  efficiencyRatingRange: [number, number];
  // Date-based filters
  maintenanceDue: boolean;
  warrantyExpiring: boolean;
};

// Performance metrics calculation types
export type WorkTableMetrics = {
  totalTables: number;
  activeTables: number;
  maintenanceTables: number;
  averageUtilization: number;
  averageEfficiency: number;
  totalCapacityPerDay: number;
  totalCapacityPerHour: number;
  maintenanceDueCount: number;
  warrantyExpiringCount: number;
};

// Capacity calculation types
export type CapacityCalculation = {
  tableId: number;
  tableCode: string;
  dailyCapacity: number;
  hourlyCapacity: number;
  currentUtilization: number;
  availableCapacity: number;
  efficiencyAdjustedCapacity: number;
};

// Maintenance scheduling types
export type MaintenanceSchedule = {
  tableId: number;
  tableCode: string;
  tableName: string;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  daysSinceLastMaintenance: number | null;
  daysUntilNextMaintenance: number | null;
  isOverdue: boolean;
  isDueSoon: boolean; // within 7 days
};

// Equipment information type
export type EquipmentInfo = {
  tableId: number;
  tableCode: string;
  equipmentModel: string;
  installationDate: string | null;
  warrantyExpiryDate: string | null;
  ageInMonths: number | null;
  warrantyStatus: 'active' | 'expired' | 'expiring_soon' | 'unknown';
  daysUntilWarrantyExpiry: number | null;
};

// Location and assignment summary
export type LocationSummary = {
  locationCode: string;
  department: string;
  tableCount: number;
  totalCapacityPerDay: number;
  averageUtilization: number;
  activeTables: number;
  maintenanceTables: number;
};

// Operator workload type
export type OperatorWorkload = {
  operatorName: string;
  assignedTables: number;
  totalCapacityManaged: number;
  averageTableEfficiency: number;
  department: string;
  supervisor: string;
};
```

---

### **LAYER 3: VALIDATION SCHEMAS**
**File to create**: `src/libs/validations/workTable.ts`

**Requirements**:
1. **Base schemas**: Create, Update, ID validation
2. **Complex field validation**: Multiple decimals, dates, enums
3. **Business logic validation**: Capacity constraints, date logic, status transitions
4. **Range validation**: Performance metrics, dimensions, capacity values
5. **Date validation**: Maintenance scheduling, warranty tracking
6. **List parameters**: Robust null/undefined handling + complex filtering
7. **Form validation**: React Hook Form integration
8. **Helper functions**: Date calculations, performance validations

**Key validations needed**:
- **tableCode**: Required, unique per owner, alphanumeric format
- **capacity values**: Positive integers, logical relationship (hourly < daily)
- **dimension values**: Positive decimals with reasonable ranges
- **performance metrics**: 0-100 percentage ranges with decimal precision
- **date fields**: Logical date relationships (installation before warranty expiry)
- **maintenance dates**: lastMaintenance < nextMaintenance
- **status transitions**: Valid status change logic

**Example structure**:
```typescript
import { z } from 'zod';

// Enum schemas
const TableTypeSchema = z.enum(['cutting', 'sewing', 'embroidery', 'packing', 'quality_control', 'other']);
const WorkTableStatusSchema = z.enum(['active', 'maintenance', 'offline', 'repair', 'decommissioned']);

// Decimal schemas with specific precision requirements
const DimensionSchema = z.number().min(0.1).max(999.99).multipleOf(0.01); // For table dimensions
const PercentageSchema = z.number().min(0).max(100).multipleOf(0.01); // For utilization, efficiency
const CapacitySchema = z.number().int().min(1).max(99999); // For capacity values

// Date schema for maintenance and warranty dates
const OptionalDateSchema = z.union([
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  z.null(),
  z.undefined()
]).optional().nullable();

// Base work table validation
export const CreateWorkTableSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  tableCode: z.string()
    .min(1, 'Table code is required')
    .max(20, 'Table code must be less than 20 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Table code must be alphanumeric with underscores or hyphens'),
  tableName: z.string().max(100, 'Table name must be less than 100 characters').optional(),
  tableDetail: z.string().max(200, 'Table detail must be less than 200 characters').optional(),
  tableType: TableTypeSchema.optional(),
  tableCategory: z.number().int().min(1).max(999).optional(),
  capacityPerDay: CapacitySchema.optional(),
  capacityPerHour: CapacitySchema.optional(),
  tableSizeLength: DimensionSchema.optional(),
  tableSizeWidth: DimensionSchema.optional(),
  locationCode: z.string().max(50, 'Location code must be less than 50 characters').optional(),
  department: z.string().max(100, 'Department must be less than 100 characters').optional(),
  assignedOperator: z.string().max(100, 'Assigned operator must be less than 100 characters').optional(),
  supervisor: z.string().max(100, 'Supervisor must be less than 100 characters').optional(),
  status: WorkTableStatusSchema.default('active'),
  availabilitySchedule: z.string().max(500, 'Availability schedule must be less than 500 characters').optional(),
  lastMaintenanceDate: OptionalDateSchema,
  nextMaintenanceDate: OptionalDateSchema,
  equipmentModel: z.string().max(100, 'Equipment model must be less than 100 characters').optional(),
  installationDate: OptionalDateSchema,
  warrantyExpiryDate: OptionalDateSchema,
  utilizationRate: PercentageSchema.default(0),
  efficiencyRating: PercentageSchema.default(0),
  totalProcessedUnits: z.number().int().min(0).default(0),
  specialCapabilities: z.string().max(1000, 'Special capabilities must be less than 1000 characters').optional(),
  limitations: z.string().max(1000, 'Limitations must be less than 1000 characters').optional(),
  note: z.string().max(500, 'Note must be less than 500 characters').optional(),
}).refine((data) => {
  // Business logic validation: hourly capacity should be reasonable relative to daily
  if (data.capacityPerHour && data.capacityPerDay) {
    const maxReasonableHourly = Math.ceil(data.capacityPerDay / 8); // Assuming 8-hour workday
    if (data.capacityPerHour > maxReasonableHourly) {
      return false;
    }
  }
  return true;
}, {
  message: 'Hourly capacity should not exceed daily capacity divided by working hours',
  path: ['capacityPerHour']
}).refine((data) => {
  // Date logic validation: lastMaintenance should be before nextMaintenance
  if (data.lastMaintenanceDate && data.nextMaintenanceDate) {
    const lastDate = new Date(data.lastMaintenanceDate);
    const nextDate = new Date(data.nextMaintenanceDate);
    if (lastDate >= nextDate) {
      return false;
    }
  }
  return true;
}, {
  message: 'Next maintenance date must be after last maintenance date',
  path: ['nextMaintenanceDate']
}).refine((data) => {
  // Date logic validation: installation should be before warranty expiry
  if (data.installationDate && data.warrantyExpiryDate) {
    const installDate = new Date(data.installationDate);
    const warrantyDate = new Date(data.warrantyExpiryDate);
    if (installDate >= warrantyDate) {
      return false;
    }
  }
  return true;
}, {
  message: 'Warranty expiry date must be after installation date',
  path: ['warrantyExpiryDate']
});

// Update schema with optional fields
export const UpdateWorkTableSchema = CreateWorkTableSchema.partial().omit(['ownerId']).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Work table ID validation
export const WorkTableIdSchema = z.object({
  id: z.coerce.number().int().positive('Work table ID must be a positive integer'),
});

// List parameters with complex filtering (enhanced from todos pattern)
export const WorkTableListParamsSchema = z.object({
  page: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return 1;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 1 : num;
    })
    .pipe(z.number().int().min(1, 'Page must be at least 1')),

  limit: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return 10;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 10 : num;
    })
    .pipe(z.number().int().min(1).max(100, 'Limit cannot exceed 100')),

  search: z.union([z.string(), z.undefined(), z.null()])
    .transform(val => val || undefined).optional(),

  sortBy: z.union([
    z.enum(['createdAt', 'updatedAt', 'tableName', 'tableCode', 'capacityPerDay', 'utilizationRate', 'efficiencyRating']), 
    z.undefined(), 
    z.null()
  ]).transform(val => 
    val && ['createdAt', 'updatedAt', 'tableName', 'tableCode', 'capacityPerDay', 'utilizationRate', 'efficiencyRating'].includes(val) 
      ? val : 'createdAt'
  ),

  sortOrder: z.union([z.enum(['asc', 'desc']), z.undefined(), z.null()])
    .transform(val => val && ['asc', 'desc'].includes(val) ? val : 'desc'),

  // WorkTable-specific filters
  tableType: TableTypeSchema.optional(),
  status: WorkTableStatusSchema.optional(),
  department: z.string().optional(),
  locationCode: z.string().optional(),
  tableCategory: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  assignedOperator: z.string().optional(),
  supervisor: z.string().optional(),

  // Capacity range filters
  minCapacityPerDay: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  maxCapacityPerDay: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),

  // Performance range filters
  minUtilizationRate: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseFloat(val) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  maxUtilizationRate: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseFloat(val) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),

  // Boolean filters
  maintenanceDue: z.union([z.string(), z.boolean(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }).optional(),
  warrantyExpiring: z.union([z.string(), z.boolean(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }).optional(),
});

// Form validation for React Hook Form (simplified for UI)
export const WorkTableFormSchema = z.object({
  tableCode: z.string().min(1, 'Table code is required').max(20),
  tableName: z.string().max(100),
  tableDetail: z.string().max(200),
  tableType: TableTypeSchema,
  tableCategory: z.number().int().min(1).max(999),
  capacityPerDay: CapacitySchema,
  capacityPerHour: CapacitySchema,
  tableSizeLength: DimensionSchema,
  tableSizeWidth: DimensionSchema,
  locationCode: z.string().max(50),
  department: z.string().max(100),
  assignedOperator: z.string().max(100),
  supervisor: z.string().max(100),
  status: WorkTableStatusSchema,
  availabilitySchedule: z.string().max(500),
  lastMaintenanceDate: z.string().optional().nullable(),
  nextMaintenanceDate: z.string().optional().nullable(),
  equipmentModel: z.string().max(100),
  installationDate: z.string().optional().nullable(),
  warrantyExpiryDate: z.string().optional().nullable(),
  utilizationRate: PercentageSchema,
  efficiencyRating: PercentageSchema,
  totalProcessedUnits: z.number().int().min(0),
  specialCapabilities: z.string().max(1000),
  limitations: z.string().max(1000),
  note: z.string().max(500),
}).refine((data) => {
  // Form-level validations
  if (data.capacityPerHour && data.capacityPerDay) {
    const maxReasonableHourly = Math.ceil(data.capacityPerDay / 8);
    if (data.capacityPerHour > maxReasonableHourly) {
      return false;
    }
  }
  return true;
}, {
  message: 'Hourly capacity should not exceed daily capacity divided by working hours',
  path: ['capacityPerHour']
});

// Request schemas for API
export const CreateWorkTableRequestSchema = CreateWorkTableSchema.omit(['ownerId']);
export const UpdateWorkTableRequestSchema = UpdateWorkTableSchema;

// Type exports
export type CreateWorkTableRequest = z.infer<typeof CreateWorkTableRequestSchema>;
export type UpdateWorkTableRequest = z.infer<typeof UpdateWorkTableRequestSchema>;
export type WorkTableListParams = z.infer<typeof WorkTableListParamsSchema>;
export type WorkTableFormData = z.infer<typeof WorkTableFormSchema>;

// Validation helper functions
export function validateCreateWorkTable(data: unknown): CreateWorkTableRequest {
  return CreateWorkTableRequestSchema.parse(data);
}

export function validateUpdateWorkTable(data: unknown): UpdateWorkTableRequest {
  return UpdateWorkTableRequestSchema.parse(data);
}

export function validateWorkTableId(data: unknown): { id: number } {
  return WorkTableIdSchema.parse(data);
}

export function validateWorkTableListParams(data: unknown): WorkTableListParams {
  return WorkTableListParamsSchema.parse(data);
}

export function validateWorkTableForm(data: unknown): WorkTableFormData {
  return WorkTableFormSchema.parse(data);
}

// Date calculation helpers
export function calculateDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isMaintenanceDue(nextMaintenanceDate: string | Date | null): boolean {
  if (!nextMaintenanceDate) return false;
  const today = new Date();
  const maintenanceDate = new Date(nextMaintenanceDate);
  return maintenanceDate <= today;
}

export function isWarrantyExpiring(warrantyExpiryDate: string | Date | null, daysThreshold: number = 30): boolean {
  if (!warrantyExpiryDate) return false;
  const today = new Date();
  const expiryDate = new Date(warrantyExpiryDate);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold && diffDays > 0;
}

export function calculateEquipmentAge(installationDate: string | Date | null): number | null {
  if (!installationDate) return null;
  const today = new Date();
  const installation = new Date(installationDate);
  const diffTime = today.getTime() - installation.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)); // Age in months
}
```

---

### **LAYER 4: DATABASE QUERIES**
**File to create**: `src/libs/queries/workTable.ts`

**Requirements**:
1. **CRUD operations**: Create, Read, Update, Delete with ownership checks
2. **Complex filtering**: By type, status, location, capacity ranges, performance ranges
3. **Date-based queries**: Maintenance due, warranty expiring, age calculations
4. **Performance analytics**: Utilization rates, efficiency calculations, capacity summaries
5. **Location analytics**: Department summaries, operator workloads
6. **Maintenance tracking**: Due dates, overdue equipment, maintenance history
7. **Capacity planning**: Available capacity calculations, utilization optimization

**Key query features**:
- **Date calculations**: Age, days until maintenance, warranty status
- **Range filtering**: Capacity, performance metrics, dimensions
- **Aggregation queries**: Department summaries, performance averages
- **Complex sorting**: Multi-field sorting with calculated fields
- **Status-based filtering**: Active equipment, maintenance schedules

**Example structure**:
```typescript
import { and, asc, count, desc, eq, gte, lte, ilike, or, sql, avg, sum } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { workTableSchema } from '@/models/schema_new';
import type { 
  CreateWorkTableInput, 
  UpdateWorkTableInput, 
  WorkTableDb, 
  WorkTableListParams,
  WorkTableMetrics,
  MaintenanceSchedule,
  EquipmentInfo,
  LocationSummary,
  OperatorWorkload
} from '@/types/workTable';

/**
 * Create new work table with business validation
 */
export async function createWorkTable(data: CreateWorkTableInput): Promise<WorkTableDb> {
  // Check if tableCode already exists for this owner
  const existingTable = await getWorkTableByCode(data.tableCode, data.ownerId);
  if (existingTable) {
    throw new Error(`Table code '${data.tableCode}' already exists`);
  }

  const [workTable] = await db
    .insert(workTableSchema)
    .values({
      ownerId: data.ownerId,
      tableCode: data.tableCode,
      tableName: data.tableName,
      tableDetail: data.tableDetail,
      tableType: data.tableType,
      tableCategory: data.tableCategory,
      capacityPerDay: data.capacityPerDay,
      capacityPerHour: data.capacityPerHour,
      tableSizeLength: data.tableSizeLength?.toString(), // Convert decimal to string
      tableSizeWidth: data.tableSizeWidth?.toString(),
      locationCode: data.locationCode,
      department: data.department,
      assignedOperator: data.assignedOperator,
      supervisor: data.supervisor,
      status: data.status ?? 'active',
      availabilitySchedule: data.availabilitySchedule,
      lastMaintenanceDate: data.lastMaintenanceDate ? new Date(data.lastMaintenanceDate) : null,
      nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null,
      equipmentModel: data.equipmentModel,
      installationDate: data.installationDate ? new Date(data.installationDate) : null,
      warrantyExpiryDate: data.warrantyExpiryDate ? new Date(data.warrantyExpiryDate) : null,
      utilizationRate: data.utilizationRate?.toString() ?? '0',
      efficiencyRating: data.efficiencyRating?.toString() ?? '0',
      totalProcessedUnits: data.totalProcessedUnits ?? 0,
      specialCapabilities: data.specialCapabilities,
      limitations: data.limitations,
      note: data.note,
    })
    .returning();

  if (!workTable) {
    throw new Error('Failed to create work table');
  }

  return workTable;
}

/**
 * Get work tables by owner with comprehensive filtering
 */
export async function getWorkTablesByOwner(params: WorkTableListParams): Promise<WorkTableDb[]> {
  const { 
    ownerId, page, limit, search, sortBy = 'createdAt', sortOrder = 'desc',
    tableType, status, department, locationCode, tableCategory, assignedOperator, supervisor,
    minCapacityPerDay, maxCapacityPerDay, minCapacityPerHour, maxCapacityPerHour,
    minUtilizationRate, maxUtilizationRate, minEfficiencyRating, maxEfficiencyRating,
    maintenanceDue, warrantyExpiring
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(workTableSchema.ownerId, ownerId);

  // Add search filter (search in multiple fields)
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(workTableSchema.ownerId, ownerId),
      or(
        ilike(workTableSchema.tableName, searchTerm),
        ilike(workTableSchema.tableCode, searchTerm),
        ilike(workTableSchema.tableDetail, searchTerm),
        ilike(workTableSchema.department, searchTerm),
        ilike(workTableSchema.locationCode, searchTerm),
        ilike(workTableSchema.assignedOperator, searchTerm),
        ilike(workTableSchema.supervisor, searchTerm),
        ilike(workTableSchema.equipmentModel, searchTerm),
        ilike(workTableSchema.specialCapabilities, searchTerm),
        ilike(workTableSchema.note, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Add filter conditions
  if (tableType) {
    whereConditions = and(whereConditions, eq(workTableSchema.tableType, tableType));
  }

  if (status) {
    whereConditions = and(whereConditions, eq(workTableSchema.status, status));
  }

  if (department) {
    whereConditions = and(whereConditions, ilike(workTableSchema.department, `%${department}%`));
  }

  if (locationCode) {
    whereConditions = and(whereConditions, ilike(workTableSchema.locationCode, `%${locationCode}%`));
  }

  if (tableCategory) {
    whereConditions = and(whereConditions, eq(workTableSchema.tableCategory, tableCategory));
  }

  if (assignedOperator) {
    whereConditions = and(whereConditions, ilike(workTableSchema.assignedOperator, `%${assignedOperator}%`));
  }

  if (supervisor) {
    whereConditions = and(whereConditions, ilike(workTableSchema.supervisor, `%${supervisor}%`));
  }

  // Capacity range filters
  if (minCapacityPerDay) {
    whereConditions = and(whereConditions, gte(workTableSchema.capacityPerDay, minCapacityPerDay));
  }

  if (maxCapacityPerDay) {
    whereConditions = and(whereConditions, lte(workTableSchema.capacityPerDay, maxCapacityPerDay));
  }

  if (minCapacityPerHour) {
    whereConditions = and(whereConditions, gte(workTableSchema.capacityPerHour, minCapacityPerHour));
  }

  if (maxCapacityPerHour) {
    whereConditions = and(whereConditions, lte(workTableSchema.capacityPerHour, maxCapacityPerHour));
  }

  // Performance range filters (decimal comparison)
  if (minUtilizationRate !== undefined) {
    whereConditions = and(whereConditions, gte(workTableSchema.utilizationRate, minUtilizationRate.toString()));
  }

  if (maxUtilizationRate !== undefined) {
    whereConditions = and(whereConditions, lte(workTableSchema.utilizationRate, maxUtilizationRate.toString()));
  }

  if (minEfficiencyRating !== undefined) {
    whereConditions = and(whereConditions, gte(workTableSchema.efficiencyRating, minEfficiencyRating.toString()));
  }

  if (maxEfficiencyRating !== undefined) {
    whereConditions = and(whereConditions, lte(workTableSchema.efficiencyRating, maxEfficiencyRating.toString()));
  }

  // Date-based filters
  if (maintenanceDue) {
    const today = new Date();
    whereConditions = and(whereConditions, lte(workTableSchema.nextMaintenanceDate, today));
  }

  if (warrantyExpiring) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30); // 30 days from now
    whereConditions = and(
      whereConditions, 
      and(
        gte(workTableSchema.warrantyExpiryDate, today),
        lte(workTableSchema.warrantyExpiryDate, futureDate)
      )
    );
  }

  // Build sort order
  const sortColumn = workTableSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  return await db
    .select()
    .from(workTableSchema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get work table by code (for uniqueness validation)
 */
export async function getWorkTableByCode(tableCode: string, ownerId: string): Promise<WorkTableDb | null> {
  const [workTable] = await db
    .select()
    .from(workTableSchema)
    .where(
      and(
        eq(workTableSchema.tableCode, tableCode),
        eq(workTableSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return workTable ?? null;
}

/**
 * Get work table by ID with ownership check
 */
export async function getWorkTableById(id: number, ownerId: string): Promise<WorkTableDb | null> {
  const [workTable] = await db
    .select()
    .from(workTableSchema)
    .where(
      and(
        eq(workTableSchema.id, id),
        eq(workTableSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return workTable ?? null;
}

/**
 * Update work table with business validation
 */
export async function updateWorkTable(
  id: number,
  ownerId: string,
  data: UpdateWorkTableInput,
): Promise<WorkTableDb> {
  // Check ownership first
  const existingTable = await getWorkTableById(id, ownerId);
  if (!existingTable) {
    throw new Error('Work table not found or access denied');
  }

  // Check tableCode uniqueness if changed
  if (data.tableCode && data.tableCode !== existingTable.tableCode) {
    const existingCodeTable = await getWorkTableByCode(data.tableCode, ownerId);
    if (existingCodeTable) {
      throw new Error(`Table code '${data.tableCode}' already exists`);
    }
  }

  const [updatedTable] = await db
    .update(workTableSchema)
    .set({
      tableCode: data.tableCode ?? existingTable.tableCode,
      tableName: data.tableName ?? existingTable.tableName,
      tableDetail: data.tableDetail ?? existingTable.tableDetail,
      tableType: data.tableType ?? existingTable.tableType,
      tableCategory: data.tableCategory ?? existingTable.tableCategory,
      capacityPerDay: data.capacityPerDay ?? existingTable.capacityPerDay,
      capacityPerHour: data.capacityPerHour ?? existingTable.capacityPerHour,
      tableSizeLength: data.tableSizeLength?.toString() ?? existingTable.tableSizeLength,
      tableSizeWidth: data.tableSizeWidth?.toString() ?? existingTable.tableSizeWidth,
      locationCode: data.locationCode ?? existingTable.locationCode,
      department: data.department ?? existingTable.department,
      assignedOperator: data.assignedOperator ?? existingTable.assignedOperator,
      supervisor: data.supervisor ?? existingTable.supervisor,
      status: data.status ?? existingTable.status,
      availabilitySchedule: data.availabilitySchedule ?? existingTable.availabilitySchedule,
      lastMaintenanceDate: data.lastMaintenanceDate ? new Date(data.lastMaintenanceDate) : existingTable.lastMaintenanceDate,
      nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : existingTable.nextMaintenanceDate,
      equipmentModel: data.equipmentModel ?? existingTable.equipmentModel,
      installationDate: data.installationDate ? new Date(data.installationDate) : existingTable.installationDate,
      warrantyExpiryDate: data.warrantyExpiryDate ? new Date(data.warrantyExpiryDate) : existingTable.warrantyExpiryDate,
      utilizationRate: data.utilizationRate?.toString() ?? existingTable.utilizationRate,
      efficiencyRating: data.efficiencyRating?.toString() ?? existingTable.efficiencyRating,
      totalProcessedUnits: data.totalProcessedUnits ?? existingTable.totalProcessedUnits,
      specialCapabilities: data.specialCapabilities ?? existingTable.specialCapabilities,
      limitations: data.limitations ?? existingTable.limitations,
      note: data.note ?? existingTable.note,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workTableSchema.id, id),
        eq(workTableSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedTable) {
    throw new Error('Failed to update work table');
  }

  return updatedTable;
}

/**
 * Delete work table
 */
export async function deleteWorkTable(id: number, ownerId: string): Promise<boolean> {
  // Check ownership first
  const existingTable = await getWorkTableById(id, ownerId);
  if (!existingTable) {
    throw new Error('Work table not found or access denied');
  }

  await db
    .delete(workTableSchema)
    .where(
      and(
        eq(workTableSchema.id, id),
        eq(workTableSchema.ownerId, ownerId),
      ),
    );

  return true;
}

/**
 * Get work table metrics for dashboard
 */
export async function getWorkTableMetrics(ownerId: string): Promise<WorkTableMetrics> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 30);

  // Get overall statistics
  const [totalResult] = await db
    .select({
      totalTables: count(),
      averageUtilization: avg(workTableSchema.utilizationRate),
      averageEfficiency: avg(workTableSchema.efficiencyRating),
      totalCapacityPerDay: sum(workTableSchema.capacityPerDay),
      totalCapacityPerHour: sum(workTableSchema.capacityPerHour),
    })
    .from(workTableSchema)
    .where(eq(workTableSchema.ownerId, ownerId));

  // Get active tables count
  const [activeResult] = await db
    .select({ count: count() })
    .from(workTableSchema)
    .where(
      and(
        eq(workTableSchema.ownerId, ownerId),
        eq(workTableSchema.status, 'active')
      )
    );

  // Get maintenance tables count
  const [maintenanceResult] = await db
    .select({ count: count() })
    .from(workTableSchema)
    .where(
      and(
        eq(workTableSchema.ownerId, ownerId),
        or(
          eq(workTableSchema.status, 'maintenance'),
          eq(workTableSchema.status, 'repair')
        )
      )
    );

  // Get maintenance due count
  const [maintenanceDueResult] = await db
    .select({ count: count() })
    .from(workTableSchema)
    .where(
      and(
        eq(workTableSchema.ownerId, ownerId),
        lte(workTableSchema.nextMaintenanceDate, today)
      )
    );

  // Get warranty expiring count
  const [warrantyExpiringResult] = await db
    .select({ count: count() })
    .from(workTableSchema)
    .where(
      and(
        eq(workTableSchema.ownerId, ownerId),
        gte(workTableSchema.warrantyExpiryDate, today),
        lte(workTableSchema.warrantyExpiryDate, futureDate)
      )
    );

  return {
    totalTables: totalResult?.totalTables ?? 0,
    activeTables: activeResult?.count ?? 0,
    maintenanceTables: maintenanceResult?.count ?? 0,
    averageUtilization: Number(totalResult?.averageUtilization ?? 0),
    averageEfficiency: Number(totalResult?.averageEfficiency ?? 0),
    totalCapacityPerDay: Number(totalResult?.totalCapacityPerDay ?? 0),
    totalCapacityPerHour: Number(totalResult?.totalCapacityPerHour ?? 0),
    maintenanceDueCount: maintenanceDueResult?.count ?? 0,
    warrantyExpiringCount: warrantyExpiringResult?.count ?? 0,
  };
}

/**
 * Get maintenance schedule for all tables
 */
export async function getMaintenanceSchedule(ownerId: string): Promise<MaintenanceSchedule[]> {
  const today = new Date();
  
  const tables = await db
    .select({
      id: workTableSchema.id,
      tableCode: workTableSchema.tableCode,
      tableName: workTableSchema.tableName,
      lastMaintenanceDate: workTableSchema.lastMaintenanceDate,
      nextMaintenanceDate: workTableSchema.nextMaintenanceDate,
    })
    .from(workTableSchema)
    .where(eq(workTableSchema.ownerId, ownerId))
    .orderBy(asc(workTableSchema.nextMaintenanceDate));

  return tables.map(table => {
    const daysSinceLastMaintenance = table.lastMaintenanceDate 
      ? Math.floor((today.getTime() - table.lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    const daysUntilNextMaintenance = table.nextMaintenanceDate
      ? Math.floor((table.nextMaintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const isOverdue = table.nextMaintenanceDate ? table.nextMaintenanceDate < today : false;
    const isDueSoon = daysUntilNextMaintenance !== null && daysUntilNextMaintenance <= 7 && daysUntilNextMaintenance > 0;

    return {
      tableId: table.id,
      tableCode: table.tableCode,
      tableName: table.tableName ?? table.tableCode,
      lastMaintenanceDate: table.lastMaintenanceDate?.toISOString().split('T')[0] ?? null,
      nextMaintenanceDate: table.nextMaintenanceDate?.toISOString().split('T')[0] ?? null,
      daysSinceLastMaintenance,
      daysUntilNextMaintenance,
      isOverdue,
      isDueSoon,
    };
  });
}

// Additional utility functions for location summaries, operator workloads, etc.
// ... (following similar patterns)
```

---

### **LAYER 5: API ROUTES**
**Files to create**: 
- `src/app/api/work-tables/route.ts` (GET list, POST create)
- `src/app/api/work-tables/[id]/route.ts` (GET, PUT, DELETE by ID)
- `src/app/api/work-tables/metrics/route.ts` (GET metrics for dashboard)
- `src/app/api/work-tables/maintenance/route.ts` (GET maintenance schedule)

**Requirements**:
1. **Authentication**: Clerk integration
2. **Complex filtering**: Range filters, date filters, boolean filters
3. **Analytics endpoints**: Metrics, maintenance schedules, capacity reports
4. **Date handling**: Proper date serialization/deserialization
5. **Performance metrics**: Calculation and reporting endpoints

---

### **LAYER 6: API CLIENT**
**File to create**: `src/libs/api/workTables.ts`

**Requirements**:
1. **CRUD operations**: Full work table management
2. **Analytics functions**: Metrics, schedules, reports
3. **Complex filtering**: Range filters, date filters
4. **Date handling**: Proper date formatting in requests

---

### **LAYER 7: REACT HOOKS**
**Files to create**:
- `src/hooks/useWorkTables.ts` (data fetching with complex filtering)
- `src/hooks/useWorkTableMutations.ts` (CRUD mutations)
- `src/hooks/useWorkTableFilters.ts` (complex filtering with ranges)
- `src/hooks/useWorkTableMetrics.ts` (analytics and reporting)

**Requirements**:
1. **Complex state management**: Range filters, date filters, multiple options
2. **Analytics integration**: Real-time metrics and reporting
3. **Date handling**: Form date management and validation
4. **Performance optimization**: Efficient re-rendering with complex filters

---

### **LAYER 8: REACT COMPONENTS**
**Files to create**:
- `src/features/workTable/WorkTableForm.tsx` (comprehensive equipment form)
- `src/features/workTable/WorkTableList.tsx` (advanced filtering and analytics)
- `src/features/workTable/WorkTableSkeleton.tsx` (loading states)
- `src/features/workTable/WorkTableMetrics.tsx` (dashboard metrics)
- `src/features/workTable/MaintenanceSchedule.tsx` (maintenance overview)
- `src/app/[locale]/(auth)/dashboard/work-tables/page.tsx` (main page with tabs)

**Requirements**:
1. **Complex form handling**: Multiple input types, date pickers, range inputs
2. **Advanced filtering UI**: Range sliders, date pickers, multi-select dropdowns
3. **Analytics dashboard**: Charts, metrics, performance indicators
4. **Maintenance management**: Calendar views, due date alerts
5. **Responsive design**: Mobile-friendly complex interfaces

---

## 🔥 **CRITICAL IMPLEMENTATION NOTES**

### **1. Multiple Date Fields Management**
- **lastMaintenanceDate**: Optional, can be null
- **nextMaintenanceDate**: Optional, should be after lastMaintenanceDate
- **installationDate**: Optional, should be before warrantyExpiryDate
- **warrantyExpiryDate**: Optional, should be after installationDate
- **Forms**: Date pickers with validation relationships
- **API**: Proper date serialization to/from ISO strings

### **2. Decimal Performance Metrics**
- **utilizationRate**: 0-100% with 2 decimal precision
- **efficiencyRating**: 0-100% with 2 decimal precision
- **tableSizeLength/Width**: Positive decimals with 2 decimal precision
- **Storage**: As decimal strings in database
- **Forms**: Number inputs with step and range validation
- **Display**: Formatted percentages and dimensions

### **3. Capacity Management**
- **capacityPerDay**: Integer, reasonable maximum
- **capacityPerHour**: Integer, should be logical relative to daily
- **Business rule**: hourlyCapacity ≤ dailyCapacity / workingHours
- **Validation**: Cross-field validation in forms and API
- **Analytics**: Capacity utilization calculations

### **4. Status Workflow Management**
- **Status transitions**: Logical workflow (active → maintenance → active)
- **Business rules**: Maintenance status affects availability
- **Filtering**: Status-based queries for operational planning
- **UI**: Status badges with appropriate colors and meanings

### **5. Range Filtering (Complex)**
- **Capacity ranges**: Min/max for daily and hourly capacity
- **Performance ranges**: Min/max for utilization and efficiency
- **Date ranges**: Maintenance due, warranty expiring
- **UI**: Range sliders, dual inputs, date range pickers
- **API**: Proper range query handling with optional boundaries

### **6. Analytics and Reporting**
- **Real-time metrics**: Total capacity, average performance
- **Maintenance tracking**: Due dates, overdue equipment
- **Location summaries**: Department-wise analytics
- **Operator workloads**: Assignment and performance tracking
- **Performance**: Efficient aggregation queries

---

## 📋 **TESTING REQUIREMENTS**

### **Unit Tests**:
- [ ] Date calculation functions (age, days until maintenance)
- [ ] Performance metric calculations
- [ ] Capacity validation logic
- [ ] Range filtering functions
- [ ] Status transition validation
- [ ] Decimal precision handling

### **Integration Tests**:
- [ ] API routes with complex filtering
- [ ] Date-based query scenarios
- [ ] Analytics endpoint accuracy
- [ ] Range filter combinations
- [ ] Status workflow enforcement

### **Component Tests**:
- [ ] WorkTableForm with all input types and validations
- [ ] Range filter components (sliders, dual inputs)
- [ ] Date picker components with relationships
- [ ] Analytics dashboard components
- [ ] Maintenance schedule components
- [ ] Complex filtering interface

---

## 🎯 **SUCCESS CRITERIA**

After completing this implementation, the system should support:

✅ **Full equipment lifecycle management** with maintenance tracking
✅ **Complex filtering capabilities** with ranges and date-based filters
✅ **Performance analytics** with real-time metrics and reporting
✅ **Capacity planning** with utilization optimization
✅ **Maintenance scheduling** with due date tracking and alerts
✅ **Multi-dimensional data management** (dates, decimals, ranges, statuses)
✅ **Responsive analytics UI** with charts and performance indicators
✅ **Business logic enforcement** for equipment management workflows

---

This plan handles the equipment and resource management complexity of WorkTable, including multiple date fields, decimal performance metrics, range filtering, analytics, and maintenance tracking while maintaining the established todos pattern and providing a foundation for operational planning and optimization.