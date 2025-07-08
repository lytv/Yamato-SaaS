/**
 * OutsourceOrder Entity Configuration for Enhanced Generator V4
 * Generated for: Outsource Order management system
 * 
 * Based on existing schema: outsourceOrderSchema with relations to userSyncSchema
 */

import type { EntityConfig } from '../enhanced-generate-advanced-entity-V4-improved';

export const outsourceOrderConfig: EntityConfig = {
  // ===== ENTITY IDENTITY =====
  entityName: 'OutsourceOrder',
  entityNameLower: 'outsourceOrder',
  entityNamePlural: 'outsourceOrders',
  tableName: 'outsource_order', // Existing table name
  codeField: 'orderCode', // Primary identifier field
  nameField: 'orderTitle', // Display name field

  // ===== FIELD DEFINITIONS =====
  fields: [
    // ===== BASIC IDENTITY =====
    {
      name: 'orderCode',
      type: 'string',
      required: true,
      unique: true,
      maxLength: 50,
      label: 'Order Code',
      excelColumn: 'Order Code',
      dbColumnType: 'text',
    },
    {
      name: 'orderTitle',
      type: 'string',
      required: false,
      maxLength: 200,
      label: 'Order Title',
      excelColumn: 'Order Title',
      dbColumnType: 'text',
    },

    // ===== USER RELATIONS =====
    {
      name: 'createdByUser',
      type: 'relation',
      required: true,
      label: 'Created By',
      excelColumn: 'Created By',
      relation: {
        type: 'belongsTo',
        entity: 'UserSync',
        entityLower: 'userSync',
        foreignKey: 'createdByUserId',
        referenceKey: 'userId', // userSync primary key is userId (text), not id
        displayField: 'fullName',
        nullable: false,
        onDelete: 'restrict',
        optionsEndpoint: '/api/users/options',
        searchField: 'fullName',
      },
    },
    {
      name: 'assignedToUser',
      type: 'relation',
      required: true,
      label: 'Assigned To',
      excelColumn: 'Assigned To',
      relation: {
        type: 'belongsTo',
        entity: 'UserSync',
        entityLower: 'userSync',
        foreignKey: 'assignedToUserId',
        referenceKey: 'userId',
        displayField: 'fullName',
        nullable: false,
        onDelete: 'restrict',
        optionsEndpoint: '/api/users/options',
        searchField: 'fullName',
      },
    },

    // ===== DATE FIELDS =====
    {
      name: 'orderDate',
      type: 'date',
      required: true,
      label: 'Order Date',
      excelColumn: 'Order Date',
      dbColumnType: 'date',
    },
    {
      name: 'expectedCompletionDate',
      type: 'date',
      required: false,
      label: 'Expected Completion Date',
      excelColumn: 'Expected Completion',
      dbColumnType: 'date',
    },
    {
      name: 'actualCompletionDate',
      type: 'date',
      required: false,
      label: 'Actual Completion Date',
      excelColumn: 'Actual Completion',
      dbColumnType: 'date',
    },

    // ===== STATUS & MANAGEMENT =====
    {
      name: 'status',
      type: 'string',
      required: true,
      label: 'Status',
      excelColumn: 'Status',
      dbColumnType: 'text',
    },
    {
      name: 'priority',
      type: 'number',
      required: true,
      label: 'Priority',
      excelColumn: 'Priority',
      dbColumnType: 'integer',
    },

    // ===== FINANCIAL =====
    {
      name: 'totalAmount',
      type: 'decimal',
      required: false,
      label: 'Total Amount',
      excelColumn: 'Total Amount',
      dbColumnType: 'decimal',
    },
    {
      name: 'currency',
      type: 'string',
      required: false,
      maxLength: 10,
      label: 'Currency',
      excelColumn: 'Currency',
      dbColumnType: 'text',
    },

    // ===== DOCUMENTATION =====
    {
      name: 'notes',
      type: 'text',
      required: false,
      label: 'Notes',
      excelColumn: 'Notes',
      dbColumnType: 'text',
    },
    {
      name: 'attachment',
      type: 'string',
      required: false,
      label: 'Attachment',
      excelColumn: 'Attachment',
      dbColumnType: 'text',
    },
  ],

  // ===== FEATURE CONFIGURATION =====
  features: {
    // Core Features
    pagination: true,
    search: true, // Search by orderCode, orderTitle
    sorting: true, // Sort by date, status, priority
    stats: true, // Statistics by status, user, time
    
    // Excel Features
    excelImport: false, // Orders usually created manually
    excelExport: true, // Export for reporting
    
    // Code Features
    uniqueCode: true, // orderCode must be unique per owner
    
    // Batch Features
    batchOperations: false, // Orders rarely deleted/updated in batch
    
    // Relationship Features
    relationships: true, // Has user relations
    relationOptions: true, // Dropdown for user selection
    
    // UI Features
    filters: true, // Filter by status, user, date range
    importModal: false, // Not needed
    exportModal: true, // Export with options
  },

  // ===== UI CONFIGURATION =====
  uiType: 'table', // Table view best for orders with many columns

  // ===== CUSTOM TEMPLATES =====
  templates: {
    customValidations: `
      // Custom business logic validation for OutsourceOrder
      
      // Date validation
      if (data.expectedCompletionDate && data.orderDate) {
        if (new Date(data.expectedCompletionDate) < new Date(data.orderDate)) {
          errors.push('Expected completion date must be after order date');
        }
      }
      
      if (data.actualCompletionDate && data.orderDate) {
        if (new Date(data.actualCompletionDate) < new Date(data.orderDate)) {
          errors.push('Actual completion date must be after order date');
        }
      }
      
      // Status workflow validation
      const validStatuses = ['draft', 'sent', 'in_progress', 'completed', 'cancelled'];
      if (data.status && !validStatuses.includes(data.status)) {
        errors.push('Invalid status value');
      }
      
      // Priority range validation
      if (data.priority && (data.priority < 1 || data.priority > 10)) {
        errors.push('Priority must be between 1 and 10');
      }
      
      // Financial validation
      if (data.totalAmount && data.totalAmount < 0) {
        errors.push('Total amount cannot be negative');
      }
      
      // Business rule: Cannot assign to self
      if (data.createdByUserId && data.assignedToUserId && 
          data.createdByUserId === data.assignedToUserId) {
        errors.push('Cannot assign order to yourself');
      }
      
      // Completion date only when completed
      if (data.actualCompletionDate && data.status !== 'completed') {
        errors.push('Actual completion date can only be set when status is completed');
      }
    `,

    customQueries: `
      // Custom query helpers for OutsourceOrder
      
      /**
       * Get orders assigned to specific user
       */
      export async function getOrdersAssignedToUser(
        userId: string,
        ownerId: string
      ): Promise<OutsourceOrderWithRelations[]> {
        return await db
          .select({
            ...outsourceOrderSchema,
            createdByUser: {
              userId: userSyncSchema.userId,
              fullName: userSyncSchema.fullName,
              email: userSyncSchema.email,
            },
            assignedToUser: {
              userId: assignedUserSchema.userId,
              fullName: assignedUserSchema.fullName,
              email: assignedUserSchema.email,
            },
          })
          .from(outsourceOrderSchema)
          .leftJoin(userSyncSchema, eq(outsourceOrderSchema.createdByUserId, userSyncSchema.userId))
          .leftJoin(assignedUserSchema, eq(outsourceOrderSchema.assignedToUserId, assignedUserSchema.userId))
          .where(and(
            eq(outsourceOrderSchema.assignedToUserId, userId),
            eq(outsourceOrderSchema.ownerId, ownerId)
          ))
          .orderBy(desc(outsourceOrderSchema.orderDate));
      }
      
      /**
       * Get orders by status with user details
       */
      export async function getOrdersByStatus(
        status: string,
        ownerId: string
      ): Promise<OutsourceOrderWithRelations[]> {
        return await db
          .select({
            ...outsourceOrderSchema,
            createdByUser: {
              userId: userSyncSchema.userId,
              fullName: userSyncSchema.fullName,
            },
            assignedToUser: {
              userId: assignedUserSchema.userId,
              fullName: assignedUserSchema.fullName,
            },
          })
          .from(outsourceOrderSchema)
          .leftJoin(userSyncSchema, eq(outsourceOrderSchema.createdByUserId, userSyncSchema.userId))
          .leftJoin(assignedUserSchema, eq(outsourceOrderSchema.assignedToUserId, assignedUserSchema.userId))
          .where(and(
            eq(outsourceOrderSchema.status, status),
            eq(outsourceOrderSchema.ownerId, ownerId)
          ))
          .orderBy(desc(outsourceOrderSchema.orderDate));
      }
    `,
  },
};

// Export with multiple naming conventions for flexibility
export const OutsourceOrderConfig = outsourceOrderConfig;
export const outsourceOrderConfiguration = outsourceOrderConfig;
export const config = outsourceOrderConfig;
export default outsourceOrderConfig;
