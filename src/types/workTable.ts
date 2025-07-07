import type { workTableSchema } from '@/models/Schema';

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
export type CreateWorkTableInput = {
  ownerId: string;
  tableCode: string;
  tableName: string;
  tableDetail?: string;
  tableType: TableType;
};
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
  tableDetail?: string;
  tableType: TableType;
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
  locationCode: string;
  tableCategory: number | 'all';
  assignedOperator: string;
  supervisor: string;
  // Capacity range filters
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
