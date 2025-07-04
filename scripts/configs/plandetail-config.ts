/**
 * PlanDetail Entity Configuration for Enhanced Generator V3
 * Based on existing planDetailSchema in Schema.ts
 */

// Define types locally to avoid circular imports
type FieldConfig = {
  name: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'decimal' | 'relation';
  required: boolean;
  unique?: boolean;
  maxLength?: number;
  label: string;
  excelColumn?: string;
  dbColumnType?: 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'timestamp';
  
  // Relationship properties
  relation?: {
    type: 'belongsTo' | 'hasMany' | 'manyToMany';
    entity: string;
    entityLower: string;
    foreignKey: string;
    referenceKey?: string;
    displayField: string;
    nullable?: boolean;
    onDelete?: 'cascade' | 'restrict' | 'setNull';
    
    // For many-to-many
    junctionTable?: string;
    junctionFields?: {
      currentKey: string;
      relatedKey: string;
    };
  };
};

type EntityConfig = {
  entityName: string;
  entityNameLower: string;
  entityNamePlural: string;
  tableName: string;
  codeField: string;
  nameField: string;
  fields: FieldConfig[];
  features: {
    pagination: boolean;
    search: boolean;
    sorting: boolean;
    stats: boolean;
    excelImport: boolean;
    excelExport: boolean;
    uniqueCode: boolean;
    batchOperations: boolean;
    relationships: boolean;
  };
  uiType: 'table' | 'cards';
};

export const planDetailConfig: EntityConfig = {
  entityName: 'PlanDetail',
  entityNameLower: 'plandetail',
  entityNamePlural: 'plandetails',
  tableName: 'plan_detail',
  codeField: 'locationCode',
  nameField: 'productSubCode',
  fields: [
    // Plan Relationship (belongsTo - required)
    {
      name: 'plan',
      type: 'relation',
      required: true,
      label: 'Plan',
      excelColumn: 'Plan Code',
      relation: {
        type: 'belongsTo',
        entity: 'Plan',
        entityLower: 'plan',
        foreignKey: 'planId',
        displayField: 'planCode',
        onDelete: 'cascade'
      }
    },

    // Location & Resource Allocation
    {
      name: 'locationCode',
      type: 'string',
      required: true,
      maxLength: 50,
      label: 'Location Code',
      excelColumn: 'Location Code',
      dbColumnType: 'text',
    },
    {
      name: 'locationType',
      type: 'string',
      required: false,
      maxLength: 50,
      label: 'Location Type',
      excelColumn: 'Location Type',
      dbColumnType: 'text',
    },

    // Product Reference
    {
      name: 'productCode',
      type: 'string',
      required: true,
      maxLength: 50,
      label: 'Product Code',
      excelColumn: 'Product Code',
      dbColumnType: 'text',
    },
    {
      name: 'productSubCode',
      type: 'string',
      required: true,
      maxLength: 100,
      label: 'Product Sub Code',
      excelColumn: 'Product Sub Code',
      dbColumnType: 'text',
    },

    // Quantity Planning
    {
      name: 'plannedQuantity',
      type: 'number',
      required: true,
      label: 'Planned Quantity',
      excelColumn: 'Planned Quantity',
      dbColumnType: 'integer',
    },
    {
      name: 'actualQuantity',
      type: 'number',
      required: false,
      label: 'Actual Quantity',
      excelColumn: 'Actual Quantity',
      dbColumnType: 'integer',
    },

    // Scheduling
    {
      name: 'plannedStartDate',
      type: 'date',
      required: false,
      label: 'Planned Start Date',
      excelColumn: 'Planned Start Date',
      dbColumnType: 'date',
    },
    {
      name: 'plannedEndDate',
      type: 'date',
      required: false,
      label: 'Planned End Date',
      excelColumn: 'Planned End Date',
      dbColumnType: 'date',
    },
    {
      name: 'actualStartDate',
      type: 'date',
      required: false,
      label: 'Actual Start Date',
      excelColumn: 'Actual Start Date',
      dbColumnType: 'date',
    },
    {
      name: 'actualEndDate',
      type: 'date',
      required: false,
      label: 'Actual End Date',
      excelColumn: 'Actual End Date',
      dbColumnType: 'date',
    },

    // Status & Priority
    {
      name: 'status',
      type: 'string',
      required: false,
      maxLength: 50,
      label: 'Status',
      excelColumn: 'Status',
      dbColumnType: 'text',
    },
    {
      name: 'priority',
      type: 'number',
      required: false,
      label: 'Priority',
      excelColumn: 'Priority',
      dbColumnType: 'integer',
    },
    {
      name: 'note',
      type: 'text',
      required: false,
      label: 'Note',
      excelColumn: 'Note',
      dbColumnType: 'text',
    },

    // Owner (always required for multi-tenancy)
    {
      name: 'ownerId',
      type: 'string',
      required: true,
      maxLength: 50,
      label: 'Owner ID',
      excelColumn: 'Owner ID',
      dbColumnType: 'text',
    },
  ],
  features: {
    pagination: true,
    search: true,
    sorting: true,
    stats: true,
    excelImport: true,
    excelExport: true,
    uniqueCode: false, // No unique code constraint in schema
    batchOperations: true,
    relationships: true,
  },
  uiType: 'table',
};

/**
 * Alternative config with additional relationships (if needed)
 * This version includes potential Product and ProductSub relationships
 */
export const planDetailConfigWithMoreRelations: EntityConfig = {
  ...planDetailConfig,
  fields: [
    // Plan Relationship (belongsTo - required)
    {
      name: 'plan',
      type: 'relation',
      required: true,
      label: 'Plan',
      excelColumn: 'Plan Code',
      relation: {
        type: 'belongsTo',
        entity: 'Plan',
        entityLower: 'plan',
        foreignKey: 'planId',
        displayField: 'planCode',
        onDelete: 'cascade'
      }
    },

    // Product Relationship (potential belongsTo)
    {
      name: 'product',
      type: 'relation',
      required: false,
      label: 'Product',
      excelColumn: 'Product',
      relation: {
        type: 'belongsTo',
        entity: 'Product',
        entityLower: 'product',
        foreignKey: 'productId',
        displayField: 'productName',
        nullable: true,
        onDelete: 'setNull'
      }
    },

    // Location & Resource Allocation
    {
      name: 'locationCode',
      type: 'string',
      required: true,
      maxLength: 50,
      label: 'Location Code',
      excelColumn: 'Location Code',
      dbColumnType: 'text',
    },
    {
      name: 'locationType',
      type: 'string',
      required: false,
      maxLength: 50,
      label: 'Location Type',
      excelColumn: 'Location Type',
      dbColumnType: 'text',
    },

    // Product Reference (text fields)
    {
      name: 'productCode',
      type: 'string',
      required: true,
      maxLength: 50,
      label: 'Product Code',
      excelColumn: 'Product Code',
      dbColumnType: 'text',
    },
    {
      name: 'productSubCode',
      type: 'string',
      required: true,
      maxLength: 100,
      label: 'Product Sub Code',
      excelColumn: 'Product Sub Code',
      dbColumnType: 'text',
    },

    // Quantity Planning
    {
      name: 'plannedQuantity',
      type: 'number',
      required: true,
      label: 'Planned Quantity',
      excelColumn: 'Planned Quantity',
      dbColumnType: 'integer',
    },
    {
      name: 'actualQuantity',
      type: 'number',
      required: false,
      label: 'Actual Quantity',
      excelColumn: 'Actual Quantity',
      dbColumnType: 'integer',
    },

    // Scheduling
    {
      name: 'plannedStartDate',
      type: 'date',
      required: false,
      label: 'Planned Start Date',
      excelColumn: 'Planned Start Date',
      dbColumnType: 'date',
    },
    {
      name: 'plannedEndDate',
      type: 'date',
      required: false,
      label: 'Planned End Date',
      excelColumn: 'Planned End Date',
      dbColumnType: 'date',
    },
    {
      name: 'actualStartDate',
      type: 'date',
      required: false,
      label: 'Actual Start Date',
      excelColumn: 'Actual Start Date',
      dbColumnType: 'date',
    },
    {
      name: 'actualEndDate',
      type: 'date',
      required: false,
      label: 'Actual End Date',
      excelColumn: 'Actual End Date',
      dbColumnType: 'date',
    },

    // Status & Priority
    {
      name: 'status',
      type: 'string',
      required: false,
      maxLength: 50,
      label: 'Status',
      excelColumn: 'Status',
      dbColumnType: 'text',
    },
    {
      name: 'priority',
      type: 'number',
      required: false,
      label: 'Priority',
      excelColumn: 'Priority',
      dbColumnType: 'integer',
    },
    {
      name: 'note',
      type: 'text',
      required: false,
      label: 'Note',
      excelColumn: 'Note',
      dbColumnType: 'text',
    },

    // Owner (always required for multi-tenancy)
    {
      name: 'ownerId',
      type: 'string',
      required: true,
      maxLength: 50,
      label: 'Owner ID',
      excelColumn: 'Owner ID',
      dbColumnType: 'text',
    },
  ],
};

/**
 * Validation rules specific to PlanDetail
 */
export const planDetailValidationRules = {
  // Status options
  statusOptions: ['planned', 'in_progress', 'completed', 'cancelled'],
  
  // Priority range
  priorityMin: 1,
  priorityMax: 10,
  
  // Location code patterns
  locationCodePatterns: {
    alpha: /^[A-Z]\d{2,3}$/, // K04, K01, K31
    numeric: /^\d{1,2}$/, // 2, 7, 4, 10, 5
  },
  
  // Quantity validations
  quantityMin: 0,
  quantityMax: 999999,
  
  // Date validations
  dateValidations: {
    plannedStartShouldBeforeEnd: true,
    actualStartShouldBeforeEnd: true,
    actualDatesShouldBeAfterPlanned: false, // Can be flexible
  }
};

/**
 * Business logic helpers for PlanDetail
 */
export const planDetailHelpers = {
  // Generate location code based on type
  generateLocationCode: (type: 'alpha' | 'numeric', sequence: number): string => {
    if (type === 'alpha') {
      return `K${sequence.toString().padStart(2, '0')}`;
    }
    return sequence.toString();
  },
  
  // Calculate progress percentage
  calculateProgress: (planned: number, actual: number): number => {
    if (planned === 0) return 0;
    return Math.min(100, Math.round((actual / planned) * 100));
  },
  
  // Determine status based on dates and quantities
  determineStatus: (
    plannedStart?: Date,
    _plannedEnd?: Date,
    actualStart?: Date,
    actualEnd?: Date,
    _plannedQty?: number,
    _actualQty?: number
  ): string => {
    const now = new Date();
    
    if (actualEnd) return 'completed';
    if (actualStart) return 'in_progress';
    if (plannedStart && plannedStart <= now) return 'in_progress';
    return 'planned';
  },
  
  // Validate product codes format
  validateProductCodes: (productCode: string, productSubCode: string): boolean => {
    // Product code pattern: NHA01, NHA02A
    const productPattern = /^[A-Z]{3}\d{2}[A-Z]?$/;
    // Product sub code pattern: NHA_01_CM, NHA_02_CO
    const subPattern = /^[A-Z]{3}_\d{2}_[A-Z]{2,4}$/;
    
    return productPattern.test(productCode) && subPattern.test(productSubCode);
  }
};

// Export aliases for compatibility
export const plandetailConfig = planDetailConfig; // lowercase version
export default planDetailConfig; // default export
