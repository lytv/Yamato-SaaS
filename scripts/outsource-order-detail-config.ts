/**
 * OutsourceOrderDetail Entity Configuration
 * For use with enhanced-generate-advanced-entity-V3-with-relations.ts
 */

type FieldConfig = {
  name: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'decimal' | 'relation';
  required: boolean;
  unique?: boolean;
  maxLength?: number;
  label: string;
  excelColumn?: string;
  dbColumnType?: 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'timestamp';
  
  relation?: {
    type: 'belongsTo' | 'hasMany' | 'manyToMany';
    entity: string;
    entityLower: string;
    foreignKey: string;
    referenceKey?: string;
    displayField: string;
    nullable?: boolean;
    onDelete?: 'cascade' | 'restrict' | 'setNull';
    
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

export const outsourceOrderDetailConfig: EntityConfig = {
  entityName: 'OutsourceOrderDetail',
  entityNameLower: 'outsourceOrderDetail',
  entityNamePlural: 'outsourceOrderDetails',
  tableName: 'outsource_order_detail',
  codeField: 'sequenceNumber',
  nameField: 'itemNotes',
  fields: [
    // ===== RELATIONSHIPS =====
    {
      name: 'outsourceOrder',
      type: 'relation',
      required: true,
      label: 'Outsource Order',
      excelColumn: 'Order Code',
      relation: {
        type: 'belongsTo',
        entity: 'OutsourceOrder',
        entityLower: 'outsourceOrder',
        foreignKey: 'outsourceOrderId',
        displayField: 'orderCode',
        onDelete: 'cascade'
      }
    },
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
        onDelete: 'restrict'
      }
    },
    {
      name: 'product',
      type: 'relation',
      required: true,
      label: 'Product',
      excelColumn: 'Product Code',
      relation: {
        type: 'belongsTo',
        entity: 'Product',
        entityLower: 'product',
        foreignKey: 'productId',
        displayField: 'productCode',
        onDelete: 'restrict'
      }
    },
    {
      name: 'productionStep',
      type: 'relation',
      required: true,
      label: 'Production Step',
      excelColumn: 'Step Code',
      relation: {
        type: 'belongsTo',
        entity: 'ProductionStep',
        entityLower: 'productionStep',
        foreignKey: 'productionStepId',
        displayField: 'stepCode',
        onDelete: 'restrict'
      }
    },

    // ===== DENORMALIZED FIELDS =====
    {
      name: 'planCode',
      type: 'string',
      required: true,
      maxLength: 50,
      label: 'Plan Code',
      excelColumn: 'Plan Code',
      dbColumnType: 'text',
    },
    {
      name: 'planName',
      type: 'string',
      required: true,
      maxLength: 255,
      label: 'Plan Name',
      excelColumn: 'Plan Name',
      dbColumnType: 'text',
    },
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
      name: 'productName',
      type: 'string',
      required: true,
      maxLength: 255,
      label: 'Product Name',
      excelColumn: 'Product Name',
      dbColumnType: 'text',
    },
    {
      name: 'stepCode',
      type: 'string',
      required: true,
      maxLength: 50,
      label: 'Step Code',
      excelColumn: 'Step Code',
      dbColumnType: 'text',
    },
    {
      name: 'stepName',
      type: 'string',
      required: true,
      maxLength: 255,
      label: 'Step Name',
      excelColumn: 'Step Name',
      dbColumnType: 'text',
    },

    // ===== QUANTITY FIELDS =====
    {
      name: 'orderedQuantity',
      type: 'number',
      required: true,
      label: 'Ordered Quantity',
      excelColumn: 'Ordered Quantity',
      dbColumnType: 'integer',
    },
    {
      name: 'completedQuantity',
      type: 'number',
      required: false,
      label: 'Completed Quantity',
      excelColumn: 'Completed Quantity',
      dbColumnType: 'integer',
    },

    // ===== DATE FIELDS =====
    {
      name: 'expectedCompletionDate',
      type: 'date',
      required: true,
      label: 'Expected Completion Date',
      excelColumn: 'Expected Completion Date',
      dbColumnType: 'date',
    },
    {
      name: 'actualCompletionDate',
      type: 'date',
      required: false,
      label: 'Actual Completion Date',
      excelColumn: 'Actual Completion Date',
      dbColumnType: 'date',
    },

    // ===== STATUS & MANAGEMENT =====
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
      name: 'sequenceNumber',
      type: 'number',
      required: false,
      label: 'Sequence Number',
      excelColumn: 'Sequence Number',
      dbColumnType: 'integer',
    },

    // ===== FINANCIAL FIELDS =====
    {
      name: 'unitPrice',
      type: 'decimal',
      required: false,
      label: 'Unit Price',
      excelColumn: 'Unit Price',
      dbColumnType: 'decimal',
    },
    {
      name: 'totalPrice',
      type: 'decimal',
      required: false,
      label: 'Total Price',
      excelColumn: 'Total Price',
      dbColumnType: 'decimal',
    },

    // ===== NOTES =====
    {
      name: 'itemNotes',
      type: 'text',
      required: false,
      label: 'Item Notes',
      excelColumn: 'Item Notes',
      dbColumnType: 'text',
    },

    // ===== OWNER FIELD =====
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
    uniqueCode: false, // Không có unique code field
    batchOperations: true,
    relationships: true,
  },
  uiType: 'table',
};
