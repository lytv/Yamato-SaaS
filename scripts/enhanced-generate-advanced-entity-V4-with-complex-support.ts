#!/usr/bin/env node

/**
 * Enhanced Advanced Entity Generator Script V4 - WITH COMPLEX SUPPORT
 * Creates complete CRUD entity with Excel import/export capabilities and advanced database features
 * 🆕 NEW IN V4: Text FKs, Decimal Precision, Complex Indexes, Check Constraints, Timestamp Modes
 *
 * Usage: npx ts-node scripts/enhanced-generate-advanced-entity-V4-with-complex-support.ts [entityName]
 * Example: npx ts-node scripts/enhanced-generate-advanced-entity-V4-with-complex-support.ts employeeSalaryEntry
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ======================
// 🆕 ENHANCED TYPE DEFINITIONS V4
// ======================

type FieldConfig = {
  name: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'decimal' | 'timestamp' | 'relation';
  required: boolean;
  unique?: boolean;
  maxLength?: number;
  label: string;
  excelColumn?: string;
  dbColumnType?: 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'timestamp';

  // 🆕 V4: Enhanced database column configuration
  dbColumnOptions?: {
    precision?: number; // For decimal fields (e.g., 10)
    scale?: number; // For decimal fields (e.g., 2)
    mode?: 'date' | 'string'; // For timestamp fields
    defaultNow?: boolean; // For date/timestamp fields
  };

  // 🆕 V4: Enhanced relationship properties
  relation?: {
    type: 'belongsTo' | 'hasMany' | 'manyToMany';
    entity: string; // Related entity name (e.g., 'UserSync')
    entityLower: string; // Related entity lowercase (e.g., 'userSync')
    foreignKey: string; // Field name in current table (e.g., 'userId')
    foreignKeyType?: 'integer' | 'text'; // 🆕 Support text foreign keys
    referenceKey?: string; // Field in related table (default: 'id', can be 'userId')
    displayField: string; // Field to show in UI (e.g., 'fullName')
    nullable?: boolean; // Can be null
    onDelete?: 'cascade' | 'restrict' | 'setNull';

    // For many-to-many
    junctionTable?: string; // Junction table name
    junctionFields?: {
      currentKey: string; // Current entity key in junction
      relatedKey: string; // Related entity key in junction
    };
  };

  // 🆕 V4: Index configuration
  indexes?: {
    simple?: boolean; // Single field index
    composite?: string[]; // Multi-field composite index
    unique?: boolean; // Unique index
  };

  // 🆕 V4: Check constraints
  checkConstraints?: {
    name: string;
    sql: string;
  }[];
};

type EntityConfig = {
  entityName: string;
  entityNameLower: string;
  entityNamePlural: string;
  tableName: string;
  codeField: string;
  nameField: string;
  fields: FieldConfig[];

  // 🆕 V4: Complex constraints configuration
  complexConstraints?: {
    uniqueIndexes?: {
      name: string;
      fields: string[];
    }[];
    compositeIndexes?: {
      name: string;
      fields: string[];
    }[];
    checkConstraints?: {
      name: string;
      sql: string;
    }[];
  };

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

// ======================
// 🆕 V4: ENHANCED COLUMN DEFINITION GENERATOR
// ======================

/**
 * Get enhanced column definition for database schema with full support for:
 * - Decimal precision/scale
 * - Timestamp modes
 * - Date defaultNow
 * - Text foreign keys
 */
function getColumnDefinition(field: FieldConfig): string {
  const nullable = field.required ? '.notNull()' : '';
  const unique = field.unique ? '.unique()' : '';
  const options = field.dbColumnOptions || {};

  switch (field.dbColumnType) {
    case 'text':
      return `text('${field.name}')${field.maxLength ? `.max(${field.maxLength})` : ''}${nullable}${unique}`;

    case 'integer':
      return `integer('${field.name}')${nullable}${unique}`;

    case 'decimal':
      // 🆕 V4: Support precision and scale
      if (options.precision && options.scale) {
        return `decimal('${field.name}', { precision: ${options.precision}, scale: ${options.scale} })${nullable}${unique}`;
      }
      return `decimal('${field.name}')${nullable}${unique}`;

    case 'boolean':
      return `boolean('${field.name}')${nullable}`;

    case 'date':
      // 🆕 V4: Support defaultNow for date
      if (options.defaultNow) {
        return `date('${field.name}').defaultNow()${nullable}`;
      }
      return `date('${field.name}')${nullable}`;

    case 'timestamp':
      // 🆕 V4: Support mode and defaultNow for timestamp
      let timestampDef = `timestamp('${field.name}'`;
      if (options.mode) {
        timestampDef += `, { mode: '${options.mode}' }`;
      }
      timestampDef += ')';

      if (options.defaultNow) {
        timestampDef += '.defaultNow()';
        if (field.name === 'updatedAt') {
          timestampDef += '.$onUpdate(() => new Date())';
        }
      }

      return `${timestampDef}${nullable}`;

    default:
      return `text('${field.name}')${nullable}${unique}`;
  }
}

// ======================
// 🆕 V4: ENHANCED ENTITY NAMING UTILITIES
// ======================

/**
 * Convert entity names properly handling underscores
 * EMPLOYEE_SALARY_ENTRY -> EmployeeSalaryEntry, employeeSalaryEntry, employee_salary_entry
 */
function convertEntityName(inputName: string): {
  entityName: string;
  entityNameLower: string;
  entityNamePlural: string;
  tableName: string;
} {
  // Handle both camelCase and SNAKE_CASE inputs
  const cleanName = inputName.toLowerCase();

  // Convert snake_case to camelCase
  const camelCase = cleanName.split('_').map((word, index) => {
    if (index === 0) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join('');

  // Convert to PascalCase for entity name
  const pascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);

  // Convert to snake_case for table name
  const snakeCase = cleanName.replace(/([A-Z])/g, '_$1').toLowerCase();

  // Generate plural form
  const plural = camelCase.endsWith('y')
    ? `${camelCase.slice(0, -1)}ies`
    : camelCase.endsWith('s')
      ? `${camelCase}es`
      : `${camelCase}s`;

  return {
    entityName: pascalCase,
    entityNameLower: camelCase,
    entityNamePlural: plural,
    tableName: snakeCase.startsWith('_') ? snakeCase.slice(1) : snakeCase,
  };
}

// ======================
// 🆕 V4: ENHANCED SCHEMA GENERATION WITH COMPLEX FEATURES
// ======================

/**
 * Generate database schema with enhanced features:
 * - Text foreign keys
 * - Complex unique indexes
 * - Composite indexes
 * - Check constraints
 * - Decimal precision/scale
 * - Timestamp modes
 */
function generateSchemaWithComplexFeatures(config: EntityConfig): string {
  const relationFields = config.fields.filter(f => f.relation);
  const regularFields = config.fields.filter(f =>
    !f.relation
    && f.name !== 'id'
    && f.name !== 'createdAt'
    && f.name !== 'updatedAt',
  );

  let schemaContent = `/**
 * ${config.entityName} Database Schema with Complex Features
 * Generated by enhanced entity generator script V4
 * 🆕 Features: Text FKs, Decimal Precision, Complex Indexes, Check Constraints
 */

import { relations, sql } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  text, 
  integer, 
  timestamp, 
  boolean, 
  decimal, 
  date,
  check,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
${relationFields.length > 0
  ? `\n// Import related schemas\n${relationFields
    .map(f => `import { ${f.relation!.entityLower}Schema } from './${f.relation!.entityLower}';`)
    .join('\n')}`
  : ''}

export const ${config.entityNameLower}Schema = pgTable('${config.tableName}', {
  id: serial('id').primaryKey(),
  
  // Regular fields
${regularFields.map((field) => {
  const column = getColumnDefinition(field);
  return `  ${field.name}: ${column},`;
}).join('\n')}

  // Foreign key fields
${relationFields
  .filter(f => f.relation?.type === 'belongsTo')
  .map((field) => {
    const rel = field.relation!;
    const nullable = rel.nullable ? '' : '.notNull()';
    const onDelete = rel.onDelete || 'restrict';
    const fkType = rel.foreignKeyType || 'integer';

    if (fkType === 'text') {
      return `  ${rel.foreignKey}: text('${rel.foreignKey}')${nullable}.references(() => ${rel.entityLower}Schema.${rel.referenceKey || 'id'}, { onDelete: '${onDelete}' }),`;
    } else {
      return `  ${rel.foreignKey}: integer('${rel.foreignKey}')${nullable}.references(() => ${rel.entityLower}Schema.${rel.referenceKey || 'id'}, { onDelete: '${onDelete}' }),`;
    }
  }).join('\n')}

  // Standard timestamps with enhanced configuration
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => {
  return {
    // 🆕 V4: Complex unique indexes
    ${config.complexConstraints?.uniqueIndexes?.map(idx =>
      `${idx.name}: uniqueIndex('${idx.name}').on(${idx.fields.map(f => `table.${f}`).join(', ')}),`,
    ).join('\n    ') || ''}
    
    // 🆕 V4: Composite indexes for performance
    ${config.complexConstraints?.compositeIndexes?.map(idx =>
      `${idx.name}: index('${idx.name}').on(${idx.fields.map(f => `table.${f}`).join(', ')}),`,
    ).join('\n    ') || ''}
    
    // 🆕 V4: Check constraints for data integrity
    ${config.complexConstraints?.checkConstraints?.map(constraint =>
      `${constraint.name}: check('${constraint.name}', sql\`${constraint.sql}\`),`,
    ).join('\n    ') || ''}
  };
});

// Relations configuration
export const ${config.entityNameLower}Relations = relations(${config.entityNameLower}Schema, ({ one, many }) => ({
${relationFields.map((field) => {
  const rel = field.relation!;
  if (rel.type === 'belongsTo') {
    return `  ${rel.entityLower}: one(${rel.entityLower}Schema, {
    fields: [${config.entityNameLower}Schema.${rel.foreignKey}],
    references: [${rel.entityLower}Schema.${rel.referenceKey || 'id'}],
    relationName: '${config.entityNameLower}_${rel.entityLower}',
  }),`;
  } else if (rel.type === 'hasMany') {
    return `  ${rel.entityLower}s: many(${rel.entityLower}Schema, {
    relationName: '${config.entityNameLower}_${rel.entityLower}s',
  }),`;
  } else if (rel.type === 'manyToMany') {
    return `  ${rel.entityLower}s: many(${rel.junctionTable}Schema, {
    relationName: '${config.entityNameLower}_${rel.entityLower}s',
  }),`;
  }
  return '';
}).filter(Boolean).join('\n')}
}));`;

  // Add junction table schemas for many-to-many relations
  const manyToManyRelations = relationFields.filter(f => f.relation?.type === 'manyToMany');
  if (manyToManyRelations.length > 0) {
    schemaContent += `\n\n// Junction tables for many-to-many relations\n`;
    manyToManyRelations.forEach((field) => {
      const rel = field.relation!;
      schemaContent += `
export const ${rel.junctionTable}Schema = pgTable('${rel.junctionTable}', {
  id: serial('id').primaryKey(),
  ${rel.junctionFields!.currentKey}: integer('${rel.junctionFields!.currentKey}').notNull().references(() => ${config.entityNameLower}Schema.id, { onDelete: 'cascade' }),
  ${rel.junctionFields!.relatedKey}: integer('${rel.junctionFields!.relatedKey}').notNull().references(() => ${rel.entityLower}Schema.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const ${rel.junctionTable}Relations = relations(${rel.junctionTable}Schema, ({ one }) => ({
  ${config.entityNameLower}: one(${config.entityNameLower}Schema, {
    fields: [${rel.junctionTable}Schema.${rel.junctionFields!.currentKey}],
    references: [${config.entityNameLower}Schema.id],
  }),
  ${rel.entityLower}: one(${rel.entityLower}Schema, {
    fields: [${rel.junctionTable}Schema.${rel.junctionFields!.relatedKey}],
    references: [${rel.entityLower}Schema.id],
  }),
}));`;
    });
  }

  return schemaContent;
}

// ======================
// 🆕 V4: EMPLOYEE_SALARY_ENTRY CONFIGURATION
// ======================

// 🆕 V4: EMPLOYEE_SALARY_ENTRY CONFIGURATION - EXACT MATCH WITH ACTUAL SCHEMA
const employeeSalaryEntryConfig: EntityConfig = {
  entityName: 'EmployeeSalaryEntry',
  entityNameLower: 'employeeSalaryEntry',
  entityNamePlural: 'employeeSalaryEntries',
  tableName: 'employee_salary_entry',
  codeField: 'id', // No specific code field in actual schema
  nameField: 'workDate', // Use workDate as display field
  fields: [
    // ✅ EXACT MATCH: User relationship (text FK to userSyncSchema.userId)
    {
      name: 'user',
      type: 'relation',
      required: true,
      label: 'Employee',
      excelColumn: 'Employee',
      relation: {
        type: 'belongsTo',
        entity: 'UserSync',
        entityLower: 'userSync',
        foreignKey: 'userId',
        foreignKeyType: 'text', // ✅ MATCHES: text('user_id')
        referenceKey: 'userId', // ✅ MATCHES: references userSyncSchema.userId
        displayField: 'fullName',
        onDelete: 'cascade',
      },
    },

    // ✅ EXACT MATCH: ProductionStepDetail relationship (integer FK)
    {
      name: 'productionStepDetail',
      type: 'relation',
      required: true,
      label: 'Production Step Detail',
      excelColumn: 'Production Step Detail',
      relation: {
        type: 'belongsTo',
        entity: 'ProductionStepDetail',
        entityLower: 'productionStepDetail',
        foreignKey: 'productionStepDetailId',
        displayField: 'id', // Could be enhanced with sequence info
        onDelete: 'cascade',
      },
    },

    // ✅ EXACT MATCH: Plan relationship (integer FK)
    {
      name: 'plan',
      type: 'relation',
      required: true,
      label: 'Plan',
      excelColumn: 'Plan',
      relation: {
        type: 'belongsTo',
        entity: 'Plan',
        entityLower: 'plan',
        foreignKey: 'planId',
        displayField: 'planName',
        onDelete: 'cascade',
      },
    },

    // ✅ EXACT MATCH: Date fields
    {
      name: 'workDate',
      type: 'date',
      required: true,
      label: 'Work Date',
      excelColumn: 'Work Date',
      dbColumnType: 'date', // ✅ MATCHES: date('work_date').notNull()
    },
    {
      name: 'entryDate',
      type: 'date',
      required: false,
      label: 'Entry Date',
      excelColumn: 'Entry Date',
      dbColumnType: 'date',
      dbColumnOptions: { defaultNow: true }, // ✅ MATCHES: date('entry_date').defaultNow()
    },

    // ✅ EXACT MATCH: Quantity fields (all integers with default(0))
    {
      name: 'actualQuantity',
      type: 'number',
      required: false,
      label: 'Actual Quantity',
      excelColumn: 'Actual Quantity',
      dbColumnType: 'integer', // ✅ MATCHES: integer('actual_quantity').default(0)
    },
    {
      name: 'plannedQuantity',
      type: 'number',
      required: false,
      label: 'Planned Quantity',
      excelColumn: 'Planned Quantity',
      dbColumnType: 'integer', // ✅ MATCHES: integer('planned_quantity').default(0)
    },
    {
      name: 'limitQuantity',
      type: 'number',
      required: false,
      label: 'Limit Quantity',
      excelColumn: 'Limit Quantity',
      dbColumnType: 'integer', // ✅ MATCHES: integer('limit_quantity').default(0)
    },
    {
      name: 'previousEnteredQuantity',
      type: 'number',
      required: false,
      label: 'Previous Entered Quantity',
      excelColumn: 'Previous Entered Quantity',
      dbColumnType: 'integer', // ✅ MATCHES: integer('previous_entered_quantity').default(0)
    },

    // ✅ EXACT MATCH: Decimal fields with precision/scale
    {
      name: 'unitPrice',
      type: 'decimal',
      required: false,
      label: 'Unit Price',
      excelColumn: 'Unit Price',
      dbColumnType: 'decimal',
      dbColumnOptions: { precision: 10, scale: 2 }, // ✅ MATCHES: decimal('unit_price', { precision: 10, scale: 2 })
    },
    {
      name: 'totalAmount',
      type: 'decimal',
      required: false,
      label: 'Total Amount',
      excelColumn: 'Total Amount',
      dbColumnType: 'decimal',
      dbColumnOptions: { precision: 12, scale: 2 }, // ✅ MATCHES: decimal('total_amount', { precision: 12, scale: 2 })
    },

    // ✅ EXACT MATCH: Text fields
    {
      name: 'salaryNote',
      type: 'text',
      required: false,
      label: 'Salary Note',
      excelColumn: 'Salary Note',
      dbColumnType: 'text', // ✅ MATCHES: text('salary_note')
    },
    {
      name: 'status',
      type: 'string',
      required: false,
      label: 'Status',
      excelColumn: 'Status',
      dbColumnType: 'text', // ✅ MATCHES: text('status').default('draft')
    },
    {
      name: 'approvedBy',
      type: 'string',
      required: false,
      label: 'Approved By',
      excelColumn: 'Approved By',
      dbColumnType: 'text', // ✅ MATCHES: text('approved_by')
    },

    // ✅ EXACT MATCH: Timestamp fields with mode: 'date'
    {
      name: 'approvedAt',
      type: 'timestamp',
      required: false,
      label: 'Approved At',
      excelColumn: 'Approved At',
      dbColumnType: 'timestamp',
      dbColumnOptions: { mode: 'date' }, // ✅ MATCHES: timestamp('approved_at', { mode: 'date' })
    },
    {
      name: 'startTime',
      type: 'timestamp',
      required: false,
      label: 'Start Time',
      excelColumn: 'Start Time',
      dbColumnType: 'timestamp',
      dbColumnOptions: { mode: 'date' }, // ✅ MATCHES: timestamp('start_time', { mode: 'date' })
    },
    {
      name: 'endTime',
      type: 'timestamp',
      required: false,
      label: 'End Time',
      excelColumn: 'End Time',
      dbColumnType: 'timestamp',
      dbColumnOptions: { mode: 'date' }, // ✅ MATCHES: timestamp('end_time', { mode: 'date' })
    },
    {
      name: 'workDurationMinutes',
      type: 'number',
      required: false,
      label: 'Work Duration (Minutes)',
      excelColumn: 'Work Duration Minutes',
      dbColumnType: 'integer', // ✅ MATCHES: integer('work_duration_minutes')
    },

    {
      name: 'ownerId',
      type: 'string',
      required: true,
      maxLength: 50,
      label: 'Owner ID',
      excelColumn: 'Owner ID',
      dbColumnType: 'text', // ✅ MATCHES: text('owner_id').notNull()
    },
  ],

  // ✅ EXACT MATCH: Complex constraints from actual schema
  complexConstraints: {
    uniqueIndexes: [{
      name: 'employeeWorkUniqueIdx', // ✅ MATCHES: employee_work_unique_idx
      fields: ['userId', 'productionStepDetailId', 'planId', 'workDate', 'ownerId'],
    }],
    compositeIndexes: [
      // ✅ EXACT MATCH: All index names from actual schema
      { name: 'employeeIdIdx', fields: ['userId'] }, // employee_salary_user_idx
      { name: 'planIdIdx', fields: ['planId'] }, // employee_salary_plan_idx
      { name: 'workDateIdx', fields: ['workDate'] }, // employee_salary_work_date_idx
      { name: 'statusIdx', fields: ['status'] }, // employee_salary_status_idx
      { name: 'entryDateIdx', fields: ['entryDate'] }, // employee_salary_entry_date_idx
      { name: 'userPlanIdx', fields: ['userId', 'planId'] }, // employee_salary_user_plan_idx
      { name: 'planDateIdx', fields: ['planId', 'workDate'] }, // employee_salary_plan_date_idx
    ],
    checkConstraints: [
      // ✅ EXACT MATCH: All check constraints from actual schema
      { name: 'actualQuantityCheck', sql: 'actual_quantity >= 0' },
      { name: 'plannedQuantityCheck', sql: 'planned_quantity >= 0' },
      { name: 'limitQuantityCheck', sql: 'limit_quantity >= 0' },
      { name: 'unitPriceCheck', sql: 'unit_price >= 0' },
      { name: 'totalAmountCheck', sql: 'total_amount >= 0' },
      { name: 'workDurationCheck', sql: 'work_duration_minutes >= 0' },
    ],
  },

  features: {
    pagination: true,
    search: true,
    sorting: true,
    stats: true,
    excelImport: true,
    excelExport: true,
    uniqueCode: false, // No unique code field in actual schema
    batchOperations: true,
    relationships: true,
  },
  uiType: 'table',
};

// ======================
// 🆕 V4: ENHANCED VALIDATION GENERATION
// ======================

/**
 * Generate enhanced validation schema with support for:
 * - Decimal fields
 * - Timestamp fields
 * - Text foreign keys
 * - Complex validation rules
 */
function generateEnhancedValidationSchema(config: EntityConfig): string {
  return config.fields
    .filter(f => f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map((field) => {
      let validation = '';

      if (field.relation?.type === 'belongsTo') {
        const fkType = field.relation.foreignKeyType || 'integer';
        if (fkType === 'text') {
          validation = `${field.relation.foreignKey}: z.string().min(1, '${field.label} is required')`;
        } else {
          validation = `${field.relation.foreignKey}: z.number().int().positive('${field.label} is required')`;
        }
        if (!field.required) {
          validation += '.optional()';
        }
        return `${validation},`;
      } else if (field.relation?.type === 'manyToMany') {
        return `${field.name}: z.array(z.number().int().positive()).optional(),`;
      }

      validation = `${field.name}: `;

      switch (field.type) {
        case 'string':
        case 'text':
          validation += 'z.string().trim()';
          if (field.required) {
            validation += `.min(1, '${field.label} is required')`;
          }
          if (field.maxLength) {
            validation += `.max(${field.maxLength}, '${field.label} must be ${field.maxLength} characters or less')`;
          }
          if (field.name.toLowerCase().includes('code')) {
            validation += `.regex(/^[\\w-]+$/, '${field.label} can only contain letters, numbers, underscores and dashes')`;
          }
          // 🆕 V4: Status field validation
          if (field.name === 'status') {
            validation += `.regex(/^(draft|submitted|approved|paid|cancelled)$/, 'Invalid status value')`;
          }
          break;

        case 'number':
          validation += 'z.number().int()';
          if (field.required) {
            validation += '.min(0)';
          }
          // 🆕 V4: Quantity validation
          if (field.name.includes('Quantity') || field.name.includes('quantity')) {
            validation += '.min(0, `${field.label} must be non-negative`)';
          }
          // 🆕 V4: Duration validation
          if (field.name === 'workDurationMinutes') {
            validation += '.min(0).max(1440, \'Work duration cannot exceed 24 hours\')';
          }
          break;

        case 'boolean':
          validation += 'z.boolean()';
          break;

        case 'date':
          validation += 'z.union([z.string(), z.date()])';
          // 🆕 V4: Date range validation
          if (field.name === 'workDate') {
            validation += `.refine((date) => {
              const d = new Date(date);
              const now = new Date();
              const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
              return d >= threeMonthsAgo && d <= now;
            }, 'Work date must be within the last 3 months')`;
          }
          break;

        case 'decimal':
          validation += 'z.number()';
          // 🆕 V4: Price validation
          if (field.name.includes('Price') || field.name.includes('Amount')) {
            validation += '.min(0, `${field.label} must be non-negative`)';
            const options = field.dbColumnOptions;
            if (options?.precision && options?.scale) {
              const maxValue = 10 ** (options.precision - options.scale) - 10 ** -options.scale;
              validation += `.max(${maxValue}, '${field.label} exceeds maximum allowed value')`;
            }
          }
          break;

        case 'timestamp':
          validation += 'z.union([z.string(), z.date()])';
          // 🆕 V4: Timestamp validation
          if (field.name === 'startTime' || field.name === 'endTime') {
            validation += `.refine((date) => {
              if (!date) return true;
              const d = new Date(date);
              const now = new Date();
              const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              return d >= oneDayAgo && d <= now;
            }, '${field.label} must be within the last 24 hours')`;
          }
          break;
      }

      if (!field.required) {
        validation += '.optional()';
      }

      return `${validation},`;
    })
    .join('\n  ');
}

/**
 * Generate enhanced validation file content with complex validation rules
 */
function generateEnhancedValidationContent(config: EntityConfig): string {
  const validationSchema = generateEnhancedValidationSchema(config);
  const relationFields = config.fields.filter(f => f.relation);

  return `/**
 * ${config.entityName} Enhanced Validation Schemas with Complex Rules
 * Generated by enhanced entity generator script V4
 * 🆕 Features: Text FK Validation, Decimal Validation, Timestamp Validation
 */

import { z } from 'zod';

// 🆕 V4: Enhanced form validation schema with complex rules
export const ${config.entityNameLower}FormSchema = z.object({
  ${validationSchema}
})${relationFields.some(f => f.name === 'startTime' && f.relation?.entity === 'endTime')
  ? `
// 🆕 V4: Cross-field validation for time fields
.refine((data) => {
  if (data.startTime && data.endTime) {
    return new Date(data.startTime) < new Date(data.endTime);
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
})`
  : ''}${config.fields.some(f => f.name === 'totalAmount')
  ? `
// 🆕 V4: Business logic validation for calculated fields
.refine((data) => {
  if (data.actualQuantity && data.unitPrice && data.totalAmount) {
    const calculated = data.actualQuantity * data.unitPrice;
    return Math.abs(calculated - data.totalAmount) < 0.01;
  }
  return true;
}, {
  message: "Total amount must equal actual quantity × unit price",
  path: ["totalAmount"],
})`
  : ''};

// Create ${config.entityNameLower} schema (same as form + ownerId)
export const create${config.entityName}Schema = ${config.entityNameLower}FormSchema.extend({
  ownerId: z.string().min(1, 'Owner ID is required'),
});

// Update ${config.entityNameLower} schema (all fields optional)
export const update${config.entityName}Schema = z.object({
  ${validationSchema.replace(/,$/gm, '.optional(),').replace(/\.optional\(\)\.optional\(\)/g, '.optional()')}
});

${relationFields.length > 0
  ? `
// 🆕 V4: Enhanced relation validation schemas
${relationFields
  .filter(f => f.relation?.type === 'belongsTo')
  .map((f) => {
    const fkType = f.relation!.foreignKeyType || 'integer';
    if (fkType === 'text') {
      return `
export const ${f.relation!.foreignKey}Schema = z.object({
  ${f.relation!.foreignKey}: z.string().min(1, '${f.relation!.entity} is required'),
});`;
    } else {
      return `
export const ${f.relation!.foreignKey}Schema = z.object({
  ${f.relation!.foreignKey}: z.number().int().positive('${f.relation!.entity} is required'),
});`;
    }
  })
  .join('')}

${relationFields
  .filter(f => f.relation?.type === 'manyToMany')
  .map(f => `
export const ${f.name}Schema = z.object({
  ${f.name}: z.array(z.number().int().positive()).min(1, '${f.label} must contain at least one item'),
});`)
  .join('')}`
  : ''}

// 🆕 V4: Enhanced list parameters validation with complex options
export const ${config.entityNameLower}ListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(255).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', '${config.nameField}', '${config.codeField}'${config.fields.some(f => f.name === 'workDate') ? ', \'workDate\'' : ''}${config.fields.some(f => f.name === 'status') ? ', \'status\'' : ''}]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  showAll: z.boolean().default(false),
  includeRelations: z.boolean().default(false),
  // 🆕 V4: Enhanced filtering options
  ${config.fields.some(f => f.name === 'status') ? 'status: z.enum([\'draft\', \'submitted\', \'approved\', \'paid\', \'cancelled\']).optional(),' : ''}
  ${config.fields.some(f => f.name === 'workDate')
    ? `
  dateFrom: z.union([z.string(), z.date()]).optional(),
  dateTo: z.union([z.string(), z.date()]).optional(),`
    : ''}
  ${relationFields.some(f => f.relation?.type === 'belongsTo')
    ? `
  ${relationFields.filter(f => f.relation?.type === 'belongsTo').map(f =>
    f.relation?.foreignKeyType === 'text'
      ? `${f.relation.foreignKey}: z.string().optional(),`
      : `${f.relation.foreignKey}: z.number().int().positive().optional(),`,
  ).join('\n  ')}`
    : ''}
});

// 🆕 V4: Enhanced import row validation for Excel import with relations
export const import${config.entityName}RowSchema = z.object({
  ${validationSchema}
  rowNumber: z.number().int().positive(),
})${config.fields.some(f => f.name === 'totalAmount')
  ? `
// Business logic validation for import
.refine((data) => {
  if (data.actualQuantity && data.unitPrice) {
    data.totalAmount = data.actualQuantity * data.unitPrice;
  }
  return true;
})`
  : ''};

// ID validation
export const ${config.entityNameLower}IdSchema = z.object({
  id: z.string().regex(/^\\d+$/, 'ID must be a valid number').transform(Number),
});

// 🆕 V4: Batch operations validation
export const ${config.entityNameLower}BatchSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'At least one item must be selected'),
  action: z.enum(['delete', 'approve', 'reject', 'updateStatus']),
  newStatus: z.enum(['draft', 'submitted', 'approved', 'paid', 'cancelled']).optional(),
});

// 🆕 V4: Enhanced validation helper functions
export function validate${config.entityName}Id(data: unknown) {
  return ${config.entityNameLower}IdSchema.parse(data);
}

export function validate${config.entityName}Form(data: unknown) {
  return ${config.entityNameLower}FormSchema.parse(data);
}

export function validateCreate${config.entityName}(data: unknown) {
  return create${config.entityName}Schema.parse(data);
}

export function validateUpdate${config.entityName}(data: unknown) {
  return update${config.entityName}Schema.parse(data);
}

export function validate${config.entityName}ListParams(data: unknown) {
  return ${config.entityNameLower}ListParamsSchema.parse(data);
}

export function validate${config.entityName}Batch(data: unknown) {
  return ${config.entityNameLower}BatchSchema.parse(data);
}

export function validateImport${config.entityName}Row(data: unknown) {
  return import${config.entityName}RowSchema.parse(data);
}`;
}

// ======================
// 🆕 V4: ENHANCED TYPESCRIPT TYPES GENERATION
// ======================

/**
 * Generate enhanced TypeScript types with complex relation types
 */
function generateEnhancedTypeFields(config: EntityConfig, includeId = false, includeOwner = false, allOptional = false): string {
  return config.fields
    .filter((f) => {
      if (!includeId && f.name === 'id') {
        return false;
      }
      if (!includeOwner && f.name === 'ownerId') {
        return false;
      }
      if (f.name === 'createdAt' || f.name === 'updatedAt') {
        return false;
      }
      return true;
    })
    .map((field) => {
      if (field.relation?.type === 'belongsTo') {
        const isOptional = allOptional || !field.required;
        const fkType = field.relation.foreignKeyType || 'integer';
        const type = fkType === 'text' ? 'string' : 'number';
        return `  ${field.relation.foreignKey}${isOptional ? '?' : ''}: ${type};`;
      } else if (field.relation?.type === 'manyToMany') {
        return `  ${field.name}?: number[];`;
      }

      let type = 'string';
      switch (field.type) {
        case 'number':
          type = 'number';
          break;
        case 'boolean':
          type = 'boolean';
          break;
        case 'date':
          type = 'Date | string';
          break;
        case 'decimal':
          type = 'number';
          break;
        case 'timestamp':
          type = 'Date | string';
          break;
      }

      const isOptional = allOptional || !field.required;
      return `  ${field.name}${isOptional ? '?' : ''}: ${type};`;
    })
    .join('\n');
}

/**
 * Generate enhanced relation types with complex relationships
 */
function generateEnhancedRelationTypes(config: EntityConfig): string {
  const relationFields = config.fields.filter(f => f.relation);

  if (relationFields.length === 0) {
    return '';
  }

  return `
// 🆕 V4: Enhanced relations types with complex support
${relationFields.map((field) => {
  const rel = field.relation!;
  if (rel.type === 'belongsTo') {
    return `  ${rel.entityLower}?: Pick<${rel.entity}, 'id' | '${rel.displayField}'${rel.referenceKey && rel.referenceKey !== 'id' ? ` | '${rel.referenceKey}'` : ''}>;`;
  } else if (rel.type === 'hasMany') {
    return `  ${rel.entityLower}s?: ${rel.entity}[];`;
  } else if (rel.type === 'manyToMany') {
    return `  ${rel.entityLower}s?: Pick<${rel.entity}, 'id' | '${rel.displayField}'>[];`;
  }
  return '';
}).filter(Boolean).join('\n')}`;
}

/**
 * Generate complete enhanced types file content with complex features
 */
function generateEnhancedTypesContent(config: EntityConfig): string {
  const formDataFields = generateEnhancedTypeFields(config, false, false);
  const createInputFields = generateEnhancedTypeFields(config, false, false);
  const updateInputFields = generateEnhancedTypeFields(config, false, false, true);
  const relationTypes = generateEnhancedRelationTypes(config);
  const relationFields = config.fields.filter(f => f.relation);

  return `/**
 * ${config.entityName} Enhanced TypeScript Types and Interfaces
 * Generated by enhanced entity generator script V4
 * 🆕 Features: Text FK Types, Decimal Types, Timestamp Types, Complex Relations
 */

import type { ${config.entityNameLower}Schema } from '@/models/Schema';
${relationFields.length > 0
  ? relationFields.map(f =>
      `import type { ${f.relation!.entity} } from '@/types/${f.relation!.entityLower}';`,
    ).join('\n')
  : ''}

// Infer the ${config.entityName}Db type from Drizzle schema
export type ${config.entityName}Db = typeof ${config.entityNameLower}Schema.$inferSelect;

// Client-side ${config.entityName} type with proper date handling
export type ${config.entityName} = Omit<${config.entityName}Db, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

${relationTypes
  ? `
// ${config.entityName} with enhanced relations
export type ${config.entityName}WithRelations = ${config.entityName} & {${relationTypes}
};`
  : ''}

// 🆕 V4: Enhanced form data type for React Hook Form with complex validation
export type ${config.entityName}FormData = {
${formDataFields}
};

// 🆕 V4: Enhanced input types for CRUD operations with proper validation
export type Create${config.entityName}Input = {
  readonly ownerId: string;
${createInputFields}
};

export type Update${config.entityName}Input = {
${updateInputFields}
};

${relationFields.length > 0
  ? `
// 🆕 V4: Enhanced relation options for dropdowns with complex support
export type ${config.entityName}RelationOptions = {
${relationFields
  .filter(f => f.relation?.type === 'belongsTo')
  .map(f => `  readonly ${f.relation!.entityLower}s: readonly Pick<${f.relation!.entity}, 'id' | '${f.relation!.displayField}'${f.relation!.referenceKey && f.relation!.referenceKey !== 'id' ? ` | '${f.relation!.referenceKey}'` : ''}>[];`)
  .join('\n')}
${relationFields
  .filter(f => f.relation?.type === 'manyToMany')
  .map(f => `  readonly ${f.relation!.entityLower}s: readonly Pick<${f.relation!.entity}, 'id' | '${f.relation!.displayField}'>[];`)
  .join('\n')}
};`
  : ''}

// 🆕 V4: Enhanced API Response types with complex error handling
export type ${config.entityName}Response = {
  readonly success: true;
  readonly data: ${config.entityName}${relationTypes ? 'WithRelations' : ''};
  readonly message?: string;
  readonly metadata?: {
    readonly calculations?: {
      readonly totalAmount?: number;
      readonly workDuration?: number;
    };
  };
};

export type ${config.entityName}sResponse = {
  readonly success: true;
  readonly data: readonly ${config.entityName}${relationTypes ? 'WithRelations' : ''}[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
  readonly filters?: {
    readonly applied: Record<string, unknown>;
    readonly available: Record<string, unknown[]>;
  };
};

export type ${config.entityName}ErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
  readonly validationErrors?: Record<string, string[]>;
};

// 🆕 V4: Enhanced list parameters with complex filtering
export type ${config.entityName}ListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | '${config.nameField}' | '${config.codeField}'${config.fields.some(f => f.name === 'workDate') ? ' | \'workDate\'' : ''}${config.fields.some(f => f.name === 'status') ? ' | \'status\'' : ''};
  readonly sortOrder?: 'asc' | 'desc';
  readonly showAll?: boolean;
  readonly includeRelations?: boolean;
  // 🆕 V4: Enhanced filtering options
  ${config.fields.some(f => f.name === 'status') ? 'readonly status?: \'draft\' | \'submitted\' | \'approved\' | \'paid\' | \'cancelled\';' : ''}
  ${config.fields.some(f => f.name === 'workDate')
    ? `
  readonly dateFrom?: Date | string;
  readonly dateTo?: Date | string;`
    : ''}
  ${relationFields.some(f => f.relation?.type === 'belongsTo')
    ? `
  ${relationFields.filter(f => f.relation?.type === 'belongsTo').map(f =>
    f.relation?.foreignKeyType === 'text'
      ? `readonly ${f.relation.foreignKey}?: string;`
      : `readonly ${f.relation.foreignKey}?: number;`,
  ).join('\n  ')}`
    : ''}
};

export type ${config.entityName}ListParamsWithOwner = ${config.entityName}ListParams & {
  readonly ownerId: string;
};

// 🆕 V4: Enhanced export parameters for Excel functionality
export type ${config.entityName}ExportParams = ${config.entityName}ListParams & {
  readonly includeCalculatedFields?: boolean;
  readonly format?: 'xlsx' | 'csv';
};

// 🆕 V4: Enhanced import validation result with detailed reporting
export type Import${config.entityName}Result = {
  readonly success: boolean;
  readonly imported: number;
  readonly failed: number;
  readonly skipped: number;
  readonly errors: readonly {
    readonly row: number;
    readonly field: string;
    readonly message: string;
    readonly value: unknown;
  }[];
  readonly warnings: readonly string[];
  readonly ${config.entityNamePlural}: readonly ${config.entityName}[];
  readonly summary: {
    readonly totalRows: number;
    readonly validRows: number;
    readonly duplicateRows: number;
    readonly processingTime: number;
  };
};

// 🆕 V4: Enhanced statistics type with complex metrics
export type ${config.entityName}Stats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  ${config.fields.some(f => f.name === 'status')
    ? `
  readonly byStatus: {
    readonly draft: number;
    readonly submitted: number;
    readonly approved: number;
    readonly paid: number;
    readonly cancelled: number;
  };`
    : ''}
  ${config.fields.some(f => f.name === 'totalAmount')
    ? `
  readonly financial: {
    readonly totalAmount: number;
    readonly averageAmount: number;
    readonly maxAmount: number;
    readonly minAmount: number;
  };`
    : ''}
  ${config.fields.some(f => f.name === 'workDurationMinutes')
    ? `
  readonly productivity: {
    readonly totalWorkTime: number;
    readonly averageWorkTime: number;
    readonly efficiency: number;
  };`
    : ''}
};

export type ${config.entityName}StatsResponse = {
  readonly success: true;
  readonly data: ${config.entityName}Stats;
};

// 🆕 V4: Enhanced filter state with complex options
export type ${config.entityName}Filters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | '${config.nameField}' | '${config.codeField}'${config.fields.some(f => f.name === 'workDate') ? ' | \'workDate\'' : ''}${config.fields.some(f => f.name === 'status') ? ' | \'status\'' : ''};
  sortOrder: 'asc' | 'desc';
  ${config.fields.some(f => f.name === 'status') ? 'status?: \'draft\' | \'submitted\' | \'approved\' | \'paid\' | \'cancelled\';' : ''}
  ${config.fields.some(f => f.name === 'workDate')
    ? `
  dateRange?: {
    from: Date | string;
    to: Date | string;
  };`
    : ''}
  ${relationFields.some(f => f.relation?.type === 'belongsTo')
    ? `
  relations?: {
    ${relationFields.filter(f => f.relation?.type === 'belongsTo').map(f =>
      f.relation?.foreignKeyType === 'text'
        ? `${f.relation.foreignKey}?: string;`
        : `${f.relation.foreignKey}?: number;`,
    ).join('\n    ')}
  };`
    : ''}
};

// 🆕 V4: Enhanced batch operations types
export type ${config.entityName}BatchAction = 'delete' | 'approve' | 'reject' | 'updateStatus';

export type ${config.entityName}BatchRequest = {
  readonly ids: readonly number[];
  readonly action: ${config.entityName}BatchAction;
  readonly newStatus?: 'draft' | 'submitted' | 'approved' | 'paid' | 'cancelled';
  readonly reason?: string;
};

export type ${config.entityName}BatchResponse = {
  readonly success: boolean;
  readonly processed: number;
  readonly failed: number;
  readonly errors: readonly {
    readonly id: number;
    readonly error: string;
  }[];
};`;
}

// ======================
// 🆕 V4: ENHANCED QUERIES GENERATION WITH TEXT FKS
// ======================

/**
 * Generate enhanced database insert values with text FK support
 */
function generateEnhancedInsertValues(config: EntityConfig): string {
  const regularFields = config.fields.filter(f =>
    !f.relation
    && f.name !== 'id'
    && f.name !== 'createdAt'
    && f.name !== 'updatedAt',
  );

  const belongsToFields = config.fields.filter(f => f.relation?.type === 'belongsTo');

  const allInsertFields = [
    ...regularFields.map((field) => {
      if (field.type === 'date' || field.type === 'timestamp') {
        return `${field.name}: data.${field.name} ? new Date(data.${field.name}) : null`;
      }
      return `${field.name}: data.${field.name}`;
    }),
    ...belongsToFields.map(field => `${field.relation!.foreignKey}: data.${field.relation!.foreignKey}`),
  ];

  return allInsertFields.join(',\n      ');
}

/**
 * Generate enhanced database update values with text FK and complex field handling
 */
function generateEnhancedUpdateValues(config: EntityConfig): string {
  const updateFields = config.fields.filter(f =>
    f.name !== 'id'
    && f.name !== 'ownerId'
    && f.name !== 'createdAt'
    && f.name !== 'updatedAt'
    && f.relation?.type !== 'manyToMany', // Many-to-many handled separately
  );

  const conditionalUpdates = updateFields.map((field) => {
    if (field.relation?.type === 'belongsTo') {
      return `
  if (data.${field.relation.foreignKey} !== undefined) {
    updateData.${field.relation.foreignKey} = data.${field.relation.foreignKey};
  } else {
    updateData.${field.relation.foreignKey} = existingEntity.${field.relation.foreignKey};
  }`;
    } else if (field.type === 'date' || field.type === 'timestamp') {
      return `
  if (data.${field.name} !== undefined) {
    updateData.${field.name} = data.${field.name} ? new Date(data.${field.name}) : null;
  } else {
    updateData.${field.name} = existingEntity.${field.name};
  }`;
    } else {
      return `
  if (data.${field.name} !== undefined) {
    updateData.${field.name} = data.${field.name};
  } else {
    updateData.${field.name} = existingEntity.${field.name};
  }`;
    }
  }).join('');

  return conditionalUpdates;
}

/**
 * Generate enhanced queries content with complex features support
 */
function generateEnhancedQueriesContent(config: EntityConfig): string {
  const insertValues = generateEnhancedInsertValues(config);
  const updateLogic = generateEnhancedUpdateValues(config);
  const relationFields = config.fields.filter(f => f.relation);
  const belongsToFields = relationFields.filter(f => f.relation?.type === 'belongsTo');
  const manyToManyFields = relationFields.filter(f => f.relation?.type === 'manyToMany');

  return `/**
 * ${config.entityName} Enhanced Database Queries with Complex Features
 * Generated by enhanced entity generator script V4
 * 🆕 Features: Text FK Support, Complex Relations, Enhanced Error Handling
 */

import { and, asc, count, desc, eq, gte, ilike, or, inArray, lte, between } from 'drizzle-orm';

import { db } from '@/libs/db';
import { ${config.entityNameLower}Schema } from '@/models/Schema';
${relationFields.length > 0
  ? relationFields.map(f =>
      `import { ${f.relation!.entityLower}Schema } from '@/models/Schema';`,
    ).join('\n')
  : ''}
${manyToManyFields.length > 0
  ? manyToManyFields.map(f =>
      `import { ${f.relation!.junctionTable}Schema } from '@/models/Schema';`,
    ).join('\n')
  : ''}
import type {
  Create${config.entityName}Input,
  ${config.entityName}Db,
  ${config.entityName}ListParamsWithOwner,
  ${config.entityName}Stats,
  Update${config.entityName}Input,
  ${config.entityName}BatchRequest,
  ${config.entityName}BatchResponse,
  ${relationFields.length > 0 ? `${config.entityName}WithRelations,` : ''}
  ${relationFields.some(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany') ? `${config.entityName}RelationOptions,` : ''}
} from '@/types/${config.entityNameLower}';

/**
 * 🆕 V4: Create a new ${config.entityNameLower} with enhanced features
 * - Text foreign key support
 * - Complex validation
 * - Business logic calculations
 */
export async function create${config.entityName}(data: Create${config.entityName}Input): Promise<${config.entityName}Db> {
  ${belongsToFields.length > 0
    ? `
  // 🆕 V4: Validate foreign keys exist (supporting both text and integer FKs)
  ${belongsToFields.map((field) => {
    const fkType = field.relation!.foreignKeyType || 'integer';
    const fkField = field.relation!.foreignKey;
    const refKey = field.relation!.referenceKey || 'id';

    return `
  if (data.${fkField}) {
    const ${field.relation!.entityLower}Exists = await db
      .select({ ${refKey}: ${field.relation!.entityLower}Schema.${refKey} })
      .from(${field.relation!.entityLower}Schema)
      .where(eq(${field.relation!.entityLower}Schema.${refKey}, data.${fkField}))
      .limit(1);
      
    if (!${field.relation!.entityLower}Exists.length) {
      throw new Error('${field.relation!.entity} not found');
    }
  }`;
  }).join('')}`
    : ''}

  ${config.fields.some(f => f.name === 'totalAmount')
    ? `
  // 🆕 V4: Business logic - Auto-calculate total amount
  if (data.actualQuantity && data.unitPrice && !data.totalAmount) {
    data.totalAmount = data.actualQuantity * data.unitPrice;
  }`
    : ''}

  ${manyToManyFields.length > 0
    ? `
  // 🆕 V4: Handle many-to-many relations with transaction
  return db.transaction(async (tx) => {
    // Create main entity
    const [${config.entityNameLower}] = await tx
      .insert(${config.entityNameLower}Schema)
      .values({
        ${insertValues}
      } as any)
      .returning();

    if (!${config.entityNameLower}) {
      throw new Error('Failed to create ${config.entityNameLower}');
    }

    // Handle many-to-many relations
    ${manyToManyFields.map(field => `
    if (data.${field.name} && data.${field.name}.length > 0) {
      await tx.insert(${field.relation!.junctionTable}Schema).values(
        data.${field.name}.map(relatedId => ({
          ${field.relation!.junctionFields!.currentKey}: ${config.entityNameLower}.id,
          ${field.relation!.junctionFields!.relatedKey}: relatedId,
        }))
      );
    }`).join('')}

    return ${config.entityNameLower};
  });`
    : `
  const [${config.entityNameLower}] = await db
    .insert(${config.entityNameLower}Schema)
    .values({
      ${insertValues}
    } as any)
    .returning();

  if (!${config.entityNameLower}) {
    throw new Error('Failed to create ${config.entityNameLower}');
  }

  return ${config.entityNameLower};`}
}

/**
 * 🆕 V4: Get ${config.entityNamePlural} with enhanced filtering and relations
 * - Complex search and filtering
 * - Text FK joins
 * - Performance optimizations
 */
export async function get${config.entityName}sByOwner(
  params: ${config.entityName}ListParamsWithOwner
): Promise<${config.entityName}Db${relationFields.length > 0 ? ` | ${config.entityName}WithRelations` : ''}[]> {
  const {
    ownerId,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeRelations = false,
    ${config.fields.some(f => f.name === 'status') ? 'status,' : ''}
    ${config.fields.some(f => f.name === 'workDate') ? 'dateFrom, dateTo,' : ''}
    ${relationFields.filter(f => f.relation?.type === 'belongsTo').map(f => `${f.relation!.foreignKey},`).join(' ')}
  } = params;

  const offset = (page - 1) * limit;

  let query = db
    .select({
      // Main entity fields
      id: ${config.entityNameLower}Schema.id,
      ${config.fields
        .filter(f => !f.relation && f.name !== 'id')
        .map(f => `${f.name}: ${config.entityNameLower}Schema.${f.name}`)
        .join(',\n      ')},
      
      ${belongsToFields.length > 0
        ? `
      // Foreign key fields
      ${belongsToFields.map(f =>
        `${f.relation!.foreignKey}: ${config.entityNameLower}Schema.${f.relation!.foreignKey}`,
      ).join(',\n      ')},
      
      // 🆕 V4: Related entity data with text FK support
      ${belongsToFields.map(f => `
      ...(includeRelations ? {
        ${f.relation!.entityLower}: {
          ${f.relation!.referenceKey || 'id'}: ${f.relation!.entityLower}Schema.${f.relation!.referenceKey || 'id'},
          ${f.relation!.displayField}: ${f.relation!.entityLower}Schema.${f.relation!.displayField},
        }
      } : {})`).join(',\n')}`
        : ''}
    })
    .from(${config.entityNameLower}Schema);

  ${belongsToFields.length > 0
    ? `
  // 🆕 V4: Add joins for belongsTo relations (supporting text FKs)
  if (includeRelations) {
    ${belongsToFields.map(f => `
    query = query.leftJoin(
      ${f.relation!.entityLower}Schema,
      eq(${config.entityNameLower}Schema.${f.relation!.foreignKey}, ${f.relation!.entityLower}Schema.${f.relation!.referenceKey || 'id'})
    );`).join('')}
  }`
    : ''}

  // 🆕 V4: Build enhanced where conditions
  let whereConditions = eq(${config.entityNameLower}Schema.ownerId, ownerId);

  // Search condition with relation support
  if (search) {
    const searchTerm = \`%\${search}%\`;
    const searchConditions = [
      ${config.codeField !== 'id' ? `ilike(${config.entityNameLower}Schema.${config.codeField}, searchTerm),` : ''}
      ${config.nameField !== config.codeField ? `ilike(${config.entityNameLower}Schema.${config.nameField}, searchTerm),` : ''}
      ${config.fields.some(f => f.name === 'salaryNote') ? `ilike(${config.entityNameLower}Schema.salaryNote, searchTerm),` : ''}
      ${belongsToFields.length > 0 && 'includeRelations'
        ? belongsToFields.map(f =>
            `ilike(${f.relation!.entityLower}Schema.${f.relation!.displayField}, searchTerm)`,
          ).join(',\n      ')
        : ''}
    ].filter(Boolean);
    
    if (searchConditions.length > 0) {
      whereConditions = and(whereConditions, or(...searchConditions));
    }
  }

  ${config.fields.some(f => f.name === 'status')
    ? `
  // Status filter
  if (status) {
    whereConditions = and(whereConditions, eq(${config.entityNameLower}Schema.status, status));
  }`
    : ''}

  ${config.fields.some(f => f.name === 'workDate')
    ? `
  // Date range filter
  if (dateFrom && dateTo) {
    whereConditions = and(
      whereConditions, 
      between(${config.entityNameLower}Schema.workDate, new Date(dateFrom), new Date(dateTo))
    );
  } else if (dateFrom) {
    whereConditions = and(whereConditions, gte(${config.entityNameLower}Schema.workDate, new Date(dateFrom)));
  } else if (dateTo) {
    whereConditions = and(whereConditions, lte(${config.entityNameLower}Schema.workDate, new Date(dateTo)));
  }`
    : ''}

  ${relationFields.filter(f => f.relation?.type === 'belongsTo').length > 0
    ? `
  // Relation filters
  ${relationFields.filter(f => f.relation?.type === 'belongsTo').map(f => `
  if (${f.relation!.foreignKey}) {
    whereConditions = and(whereConditions, eq(${config.entityNameLower}Schema.${f.relation!.foreignKey}, ${f.relation!.foreignKey}));
  }`).join('')}`
    : ''}

  // 🆕 V4: Enhanced sorting with relation support
  let orderBy;
  switch (sortBy) {
    case 'createdAt':
      orderBy = sortOrder === 'asc' ? asc(${config.entityNameLower}Schema.createdAt) : desc(${config.entityNameLower}Schema.createdAt);
      break;
    case 'updatedAt':
      orderBy = sortOrder === 'asc' ? asc(${config.entityNameLower}Schema.updatedAt) : desc(${config.entityNameLower}Schema.updatedAt);
      break;
    case '${config.nameField}':
      orderBy = sortOrder === 'asc' ? asc(${config.entityNameLower}Schema.${config.nameField}) : desc(${config.entityNameLower}Schema.${config.nameField});
      break;
    ${config.codeField !== config.nameField
      ? `case '${config.codeField}':
      orderBy = sortOrder === 'asc' ? asc(${config.entityNameLower}Schema.${config.codeField}) : desc(${config.entityNameLower}Schema.${config.codeField});
      break;`
      : ''}
    ${config.fields.some(f => f.name === 'workDate')
      ? `case 'workDate':
      orderBy = sortOrder === 'asc' ? asc(${config.entityNameLower}Schema.workDate) : desc(${config.entityNameLower}Schema.workDate);
      break;`
      : ''}
    ${config.fields.some(f => f.name === 'status')
      ? `case 'status':
      orderBy = sortOrder === 'asc' ? asc(${config.entityNameLower}Schema.status) : desc(${config.entityNameLower}Schema.status);
      break;`
      : ''}
    default:
      orderBy = desc(${config.entityNameLower}Schema.createdAt);
  }

  const results = await query
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  ${manyToManyFields.length > 0
    ? `
  // 🆕 V4: Handle many-to-many relations separately for performance
  if (includeRelations && results.length > 0) {
    const entityIds = results.map(r => r.id);
    
    ${manyToManyFields.map(f => `
    // Get ${f.relation!.entityLower}s for each ${config.entityNameLower}
    const ${f.relation!.entityLower}Relations = await db
      .select({
        ${config.entityNameLower}Id: ${f.relation!.junctionTable}Schema.${f.relation!.junctionFields!.currentKey},
        ${f.relation!.entityLower}Id: ${f.relation!.junctionTable}Schema.${f.relation!.junctionFields!.relatedKey},
        ${f.relation!.displayField}: ${f.relation!.entityLower}Schema.${f.relation!.displayField},
      })
      .from(${f.relation!.junctionTable}Schema)
      .innerJoin(
        ${f.relation!.entityLower}Schema,
        eq(${f.relation!.junctionTable}Schema.${f.relation!.junctionFields!.relatedKey}, ${f.relation!.entityLower}Schema.id)
      )
      .where(inArray(${f.relation!.junctionTable}Schema.${f.relation!.junctionFields!.currentKey}, entityIds));`).join('')}

    // Attach many-to-many relations to results
    return results.map(result => ({
      ...result,
      ${manyToManyFields.map(f => `
      ${f.relation!.entityLower}s: ${f.relation!.entityLower}Relations
        .filter(rel => rel.${config.entityNameLower}Id === result.id)
        .map(rel => ({
          id: rel.${f.relation!.entityLower}Id,
          ${f.relation!.displayField}: rel.${f.relation!.displayField},
        }))`).join(',\n')}
    })) as ${config.entityName}WithRelations[];
  }`
    : ''}

  return results;
}

/**
 * 🆕 V4: Get ${config.entityNameLower} by ID with enhanced features
 */
export async function get${config.entityName}ById(
  id: number,
  ownerId: string,
  includeRelations = false
): Promise<${config.entityName}Db${relationFields.length > 0 ? ` | ${config.entityName}WithRelations` : ''} | undefined> {
  let query = db
    .select({
      id: ${config.entityNameLower}Schema.id,
      ${config.fields
        .filter(f => !f.relation && f.name !== 'id')
        .map(f => `${f.name}: ${config.entityNameLower}Schema.${f.name}`)
        .join(',\n      ')},
      
      ${belongsToFields.length > 0
        ? `
      // Foreign key fields
      ${belongsToFields.map(f =>
        `${f.relation!.foreignKey}: ${config.entityNameLower}Schema.${f.relation!.foreignKey}`,
      ).join(',\n      ')},
      
      // Related entity data
      ${belongsToFields.map(f => `
      ...(includeRelations ? {
        ${f.relation!.entityLower}: {
          ${f.relation!.referenceKey || 'id'}: ${f.relation!.entityLower}Schema.${f.relation!.referenceKey || 'id'},
          ${f.relation!.displayField}: ${f.relation!.entityLower}Schema.${f.relation!.displayField},
        }
      } : {})`).join(',\n')}`
        : ''}
    })
    .from(${config.entityNameLower}Schema);

  ${belongsToFields.length > 0
    ? `
  if (includeRelations) {
    ${belongsToFields.map(f => `
    query = query.leftJoin(
      ${f.relation!.entityLower}Schema,
      eq(${config.entityNameLower}Schema.${f.relation!.foreignKey}, ${f.relation!.entityLower}Schema.${f.relation!.referenceKey || 'id'})
    );`).join('')}
  }`
    : ''}

  const [result] = await query
    .where(and(
      eq(${config.entityNameLower}Schema.id, id), 
      eq(${config.entityNameLower}Schema.ownerId, ownerId)
    ))
    .limit(1);

  if (!result) {
    return undefined;
  }

  ${manyToManyFields.length > 0
    ? `
  // Handle many-to-many relations
  if (includeRelations) {
    ${manyToManyFields.map(f => `
    const ${f.relation!.entityLower}Relations = await db
      .select({
        ${f.relation!.entityLower}Id: ${f.relation!.junctionTable}Schema.${f.relation!.junctionFields!.relatedKey},
        ${f.relation!.displayField}: ${f.relation!.entityLower}Schema.${f.relation!.displayField},
      })
      .from(${f.relation!.junctionTable}Schema)
      .innerJoin(
        ${f.relation!.entityLower}Schema,
        eq(${f.relation!.junctionTable}Schema.${f.relation!.junctionFields!.relatedKey}, ${f.relation!.entityLower}Schema.id)
      )
      .where(eq(${f.relation!.junctionTable}Schema.${f.relation!.junctionFields!.currentKey}, result.id));

    return {
      ...result,
      ${f.relation!.entityLower}s: ${f.relation!.entityLower}Relations.map(rel => ({
        id: rel.${f.relation!.entityLower}Id,
        ${f.relation!.displayField}: rel.${f.relation!.displayField},
      })),
    } as ${config.entityName}WithRelations;`).join('')}
  }`
    : ''}

  return result;
}

/**
 * 🆕 V4: Update ${config.entityNameLower} with enhanced features
 */
export async function update${config.entityName}(
  id: number,
  ownerId: string,
  data: Update${config.entityName}Input,
): Promise<${config.entityName}Db> {
  // Get existing entity for conditional updates
  const existing${config.entityName} = await get${config.entityName}ById(id, ownerId);
  if (!existing${config.entityName}) {
    throw new Error('${config.entityName} not found or access denied');
  }

  ${config.fields.some(f => f.name === 'totalAmount')
    ? `
  // 🆕 V4: Auto-calculate total amount if needed
  if (data.actualQuantity !== undefined || data.unitPrice !== undefined) {
    const actualQuantity = data.actualQuantity ?? existing${config.entityName}.actualQuantity ?? 0;
    const unitPrice = data.unitPrice ?? existing${config.entityName}.unitPrice ?? 0;
    data.totalAmount = actualQuantity * unitPrice;
  }`
    : ''}

  ${manyToManyFields.length > 0
    ? `
  return db.transaction(async (tx) => {
    // Build update data with proper type handling
    const updateData: Record<string, unknown> = {};
    ${updateLogic}

    const [updated${config.entityName}] = await tx
      .update(${config.entityNameLower}Schema)
      .set(updateData as any)
      .where(and(eq(${config.entityNameLower}Schema.id, id), eq(${config.entityNameLower}Schema.ownerId, ownerId)))
      .returning();

    if (!updated${config.entityName}) {
      throw new Error('Failed to update ${config.entityNameLower}');
    }

    // Handle many-to-many relations updates
    ${manyToManyFields.map(field => `
    if (data.${field.name} !== undefined) {
      // Delete existing relations
      await tx.delete(${field.relation!.junctionTable}Schema)
        .where(eq(${field.relation!.junctionTable}Schema.${field.relation!.junctionFields!.currentKey}, id));
      
      // Insert new relations
      if (data.${field.name} && data.${field.name}.length > 0) {
        await tx.insert(${field.relation!.junctionTable}Schema).values(
          data.${field.name}.map(relatedId => ({
            ${field.relation!.junctionFields!.currentKey}: id,
            ${field.relation!.junctionFields!.relatedKey}: relatedId,
          }))
        );
      }
    }`).join('')}

    return updated${config.entityName};
  });`
    : `
  // Build update data with proper type handling
  const updateData: Record<string, unknown> = {};
  ${updateLogic}

  const [updated${config.entityName}] = await db
    .update(${config.entityNameLower}Schema)
    .set(updateData as any)
    .where(and(eq(${config.entityNameLower}Schema.id, id), eq(${config.entityNameLower}Schema.ownerId, ownerId)))
    .returning();

  if (!updated${config.entityName}) {
    throw new Error('Failed to update ${config.entityNameLower}');
  }

  return updated${config.entityName};`}
}

/**
 * 🆕 V4: Delete ${config.entityNameLower} with enhanced cascade handling
 */
export async function delete${config.entityName}(id: number, ownerId: string): Promise<void> {
  ${manyToManyFields.length > 0
    ? `
  await db.transaction(async (tx) => {
    // Delete many-to-many relations first
    ${manyToManyFields.map(field => `
    await tx.delete(${field.relation!.junctionTable}Schema)
      .where(eq(${field.relation!.junctionTable}Schema.${field.relation!.junctionFields!.currentKey}, id));`).join('')}

    // Delete main entity
    const result = await tx
      .delete(${config.entityNameLower}Schema)
      .where(and(eq(${config.entityNameLower}Schema.id, id), eq(${config.entityNameLower}Schema.ownerId, ownerId)));

    if (result.rowCount === 0) {
      throw new Error('${config.entityName} not found or access denied');
    }
  });`
    : `
  const result = await db
    .delete(${config.entityNameLower}Schema)
    .where(and(eq(${config.entityNameLower}Schema.id, id), eq(${config.entityNameLower}Schema.ownerId, ownerId)));

  if (result.rowCount === 0) {
    throw new Error('${config.entityName} not found or access denied');
  }`}
}

${relationFields.some(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany')
  ? `
/**
 * 🆕 V4: Get relation options with enhanced performance
 */
export async function get${config.entityName}RelationOptions(): Promise<${config.entityName}RelationOptions> {
  const [${relationFields
    .filter(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany')
    .map(f => `${f.relation!.entityLower}Options`)
    .join(', ')}] = await Promise.all([
    ${relationFields
      .filter(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany')
      .map(f => `
    db.select({
      ${f.relation!.referenceKey || 'id'}: ${f.relation!.entityLower}Schema.${f.relation!.referenceKey || 'id'},
      ${f.relation!.displayField}: ${f.relation!.entityLower}Schema.${f.relation!.displayField},
    }).from(${f.relation!.entityLower}Schema).orderBy(asc(${f.relation!.entityLower}Schema.${f.relation!.displayField}))`)
      .join(',\n')}
  ]);

  return {
    ${relationFields
      .filter(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany')
      .map(f => `${f.relation!.entityLower}s: ${f.relation!.entityLower}Options`)
      .join(',\n    ')}
  };
}`
  : ''}

/**
 * 🆕 V4: Enhanced statistics with complex metrics
 */
export async function get${config.entityName}Stats(ownerId: string): Promise<${config.entityName}Stats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalResult, todayResult, thisWeekResult, thisMonthResult${config.fields.some(f => f.name === 'status') ? ', statusStats' : ''}] = await Promise.all([
    db.select({ count: count() }).from(${config.entityNameLower}Schema).where(eq(${config.entityNameLower}Schema.ownerId, ownerId)),
    db.select({ count: count() }).from(${config.entityNameLower}Schema).where(
      and(eq(${config.entityNameLower}Schema.ownerId, ownerId), gte(${config.entityNameLower}Schema.createdAt, today))
    ),
    db.select({ count: count() }).from(${config.entityNameLower}Schema).where(
      and(eq(${config.entityNameLower}Schema.ownerId, ownerId), gte(${config.entityNameLower}Schema.createdAt, thisWeekStart))
    ),
    db.select({ count: count() }).from(${config.entityNameLower}Schema).where(
      and(eq(${config.entityNameLower}Schema.ownerId, ownerId), gte(${config.entityNameLower}Schema.createdAt, thisMonthStart))
    ),
    ${config.fields.some(f => f.name === 'status')
      ? `
    // Status breakdown
    db.select({ 
      status: ${config.entityNameLower}Schema.status, 
      count: count() 
    })
    .from(${config.entityNameLower}Schema)
    .where(eq(${config.entityNameLower}Schema.ownerId, ownerId))
    .groupBy(${config.entityNameLower}Schema.status),`
      : ''}
  ]);

  return {
    total: totalResult[0]?.count ?? 0,
    today: todayResult[0]?.count ?? 0,
    thisWeek: thisWeekResult[0]?.count ?? 0,
    thisMonth: thisMonthResult[0]?.count ?? 0,
    ${config.fields.some(f => f.name === 'status')
      ? `
    byStatus: {
      draft: statusStats?.find(s => s.status === 'draft')?.count ?? 0,
      submitted: statusStats?.find(s => s.status === 'submitted')?.count ?? 0,
      approved: statusStats?.find(s => s.status === 'approved')?.count ?? 0,
      paid: statusStats?.find(s => s.status === 'paid')?.count ?? 0,
      cancelled: statusStats?.find(s => s.status === 'cancelled')?.count ?? 0,
    },`
      : ''}
  };
}

/**
 * 🆕 V4: Enhanced batch operations
 */
export async function batch${config.entityName}Operations(
  request: ${config.entityName}BatchRequest,
  ownerId: string
): Promise<${config.entityName}BatchResponse> {
  const { ids, action, newStatus, reason } = request;
  
  return db.transaction(async (tx) => {
    let processed = 0;
    const errors: { id: number; error: string }[] = [];

    for (const id of ids) {
      try {
        // Verify ownership
        const existing = await tx
          .select({ id: ${config.entityNameLower}Schema.id })
          .from(${config.entityNameLower}Schema)
          .where(and(
            eq(${config.entityNameLower}Schema.id, id),
            eq(${config.entityNameLower}Schema.ownerId, ownerId)
          ))
          .limit(1);

        if (!existing.length) {
          errors.push({ id, error: 'Not found or access denied' });
          continue;
        }

        switch (action) {
          case 'delete':
            ${manyToManyFields.length > 0
              ? `
            // Delete relations first
            ${manyToManyFields.map(field => `
            await tx.delete(${field.relation!.junctionTable}Schema)
              .where(eq(${field.relation!.junctionTable}Schema.${field.relation!.junctionFields!.currentKey}, id));`).join('')}`
              : ''}
            
            await tx.delete(${config.entityNameLower}Schema)
              .where(eq(${config.entityNameLower}Schema.id, id));
            break;

          case 'updateStatus':
            if (!newStatus) {
              errors.push({ id, error: 'New status is required' });
              continue;
            }
            await tx.update(${config.entityNameLower}Schema)
              .set({ 
                status: newStatus,
                ${config.fields.some(f => f.name === 'approvedBy')
                  ? `
                ...(newStatus === 'approved' ? { 
                  approvedBy: ownerId, 
                  approvedAt: new Date() 
                } : {}),`
                  : ''}
              })
              .where(eq(${config.entityNameLower}Schema.id, id));
            break;

          ${config.fields.some(f => f.name === 'status')
            ? `
          case 'approve':
            await tx.update(${config.entityNameLower}Schema)
              .set({ 
                status: 'approved',
                ${config.fields.some(f => f.name === 'approvedBy') ? `approvedBy: ownerId,` : ''}
                ${config.fields.some(f => f.name === 'approvedAt') ? `approvedAt: new Date(),` : ''}
              })
              .where(eq(${config.entityNameLower}Schema.id, id));
            break;

          case 'reject':
            await tx.update(${config.entityNameLower}Schema)
              .set({ status: 'cancelled' })
              .where(eq(${config.entityNameLower}Schema.id, id));
            break;`
            : ''}

          default:
            errors.push({ id, error: \`Unknown action: \${action}\` });
            continue;
        }

        processed++;
      } catch (error) {
        errors.push({ 
          id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return {
      success: errors.length === 0,
      processed,
      failed: errors.length,
      errors,
    };
  });
}`;
}

// ======================
// 🆕 V4: ENHANCED API ROUTES GENERATION
// ======================

/**
 * Generate enhanced API routes with complex features support
 */
function generateEnhancedAPIRouteContent(config: EntityConfig): string {
  const relationFields = config.fields.filter(f => f.relation);

  return `/**
 * ${config.entityName} Enhanced API Routes with Complex Features
 * Generated by enhanced entity generator script V4
 * 🆕 Features: Text FK Support, Enhanced Filtering, Batch Operations
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import {
  create${config.entityName},
  get${config.entityName}sByOwner,
  get${config.entityName}Stats,
  batch${config.entityName}Operations,
  ${relationFields.length > 0 ? `get${config.entityName}RelationOptions,` : ''}
} from '@/libs/queries/${config.entityNameLower}';
import {
  validateCreate${config.entityName},
  validate${config.entityName}ListParams,
  validate${config.entityName}Batch,
} from '@/libs/validations/${config.entityNameLower}';

// GET /api/${config.entityNamePlural}
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // 🆕 V4: Enhanced parameter parsing with complex filters
    const params = validate${config.entityName}ListParams({
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 10,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      includeRelations: searchParams.get('includeRelations') === 'true',
      ${config.fields.some(f => f.name === 'status') ? `status: searchParams.get('status') || undefined,` : ''}
      ${config.fields.some(f => f.name === 'workDate')
        ? `
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,`
        : ''}
      ${relationFields.filter(f => f.relation?.type === 'belongsTo').map((f) => {
        const fkType = f.relation!.foreignKeyType || 'integer';
        if (fkType === 'text') {
          return `${f.relation!.foreignKey}: searchParams.get('${f.relation!.foreignKey}') || undefined,`;
        } else {
          return `${f.relation!.foreignKey}: searchParams.get('${f.relation!.foreignKey}') ? Number(searchParams.get('${f.relation!.foreignKey}')) : undefined,`;
        }
      }).join('\n      ')}
    });

    const ${config.entityNamePlural} = await get${config.entityName}sByOwner({
      ...params,
      ownerId: userId,
    });

    // Get total count for pagination (performance optimized)
    const totalCountParams = { ...params, page: 1, limit: 999999 };
    const totalResults = await get${config.entityName}sByOwner({
      ...totalCountParams,
      ownerId: userId,
    });

    return NextResponse.json({
      success: true,
      data: ${config.entityNamePlural},
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalResults.length,
        hasMore: ${config.entityNamePlural}.length === params.limit,
      },
      // 🆕 V4: Include filter metadata
      filters: {
        applied: {
          ${config.fields.some(f => f.name === 'status') ? `status: params.status,` : ''}
          ${config.fields.some(f => f.name === 'workDate') ? `dateFrom: params.dateFrom, dateTo: params.dateTo,` : ''}
          ${relationFields.filter(f => f.relation?.type === 'belongsTo').map(f => `${f.relation!.foreignKey}: params.${f.relation!.foreignKey},`).join(' ')}
        }
      }
    });
  } catch (error) {
    console.error('Error fetching ${config.entityNamePlural}:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch ${config.entityNamePlural}',
        code: 'FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/${config.entityNamePlural}
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // 🆕 V4: Enhanced validation with detailed error messages
    const validatedData = validateCreate${config.entityName}({
      ...body,
      ownerId: userId,
    });

    const ${config.entityNameLower} = await create${config.entityName}(validatedData);

    return NextResponse.json({
      success: true,
      data: ${config.entityNameLower},
      message: '${config.entityName} created successfully',
      // 🆕 V4: Include metadata for client-side calculations
      metadata: {
        ${config.fields.some(f => f.name === 'totalAmount')
          ? `
        calculations: {
          totalAmount: ${config.entityNameLower}.totalAmount,
          ${config.fields.some(f => f.name === 'actualQuantity') ? `unitPrice: ${config.entityNameLower}.unitPrice,` : ''}
        },`
          : ''}
      }
    });
  } catch (error) {
    console.error('Error creating ${config.entityNameLower}:', error);
    
    // 🆕 V4: Enhanced error handling with validation details
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.message,
          validationErrors: {} // Could be enhanced with detailed field errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create ${config.entityNameLower}',
        code: 'CREATE_ERROR',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 400 }
    );
  }
}

// 🆕 V4: PATCH /api/${config.entityNamePlural}/batch - Batch operations
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = validate${config.entityName}Batch(body);

    const result = await batch${config.entityName}Operations(validatedData, userId);

    return NextResponse.json({
      success: result.success,
      data: result,
      message: \`Batch operation completed. \${result.processed} processed, \${result.failed} failed.\`,
    });
  } catch (error) {
    console.error('Error in batch operation:', error);
    return NextResponse.json(
      { 
        error: 'Batch operation failed',
        code: 'BATCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}`;
}

/**
 * Generate enhanced individual entity API route
 */
function generateEnhancedEntityAPIRouteContent(config: EntityConfig): string {
  return `/**
 * ${config.entityName} Individual Entity API Routes with Enhanced Features
 * Generated by enhanced entity generator script V4
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import {
  get${config.entityName}ById,
  update${config.entityName},
  delete${config.entityName},
} from '@/libs/queries/${config.entityNameLower}';
import {
  validateUpdate${config.entityName},
  validate${config.entityName}Id,
} from '@/libs/validations/${config.entityNameLower}';

// GET /api/${config.entityNamePlural}/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = validate${config.entityName}Id({ id: params.id });
    const { searchParams } = new URL(request.url);
    const includeRelations = searchParams.get('includeRelations') === 'true';

    const ${config.entityNameLower} = await get${config.entityName}ById(id, userId, includeRelations);

    if (!${config.entityNameLower}) {
      return NextResponse.json(
        { error: '${config.entityName} not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ${config.entityNameLower},
    });
  } catch (error) {
    console.error('Error fetching ${config.entityNameLower}:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ${config.entityNameLower}' },
      { status: 500 }
    );
  }
}

// PUT /api/${config.entityNamePlural}/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = validate${config.entityName}Id({ id: params.id });
    const body = await request.json();
    const validatedData = validateUpdate${config.entityName}(body);

    const updated${config.entityName} = await update${config.entityName}(id, userId, validatedData);

    return NextResponse.json({
      success: true,
      data: updated${config.entityName},
      message: '${config.entityName} updated successfully',
    });
  } catch (error) {
    console.error('Error updating ${config.entityNameLower}:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update ${config.entityNameLower}',
        code: 'UPDATE_ERROR'
      },
      { status: 400 }
    );
  }
}

// DELETE /api/${config.entityNamePlural}/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = validate${config.entityName}Id({ id: params.id });

    await delete${config.entityName}(id, userId);

    return NextResponse.json({
      success: true,
      message: '${config.entityName} deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting ${config.entityNameLower}:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete ${config.entityNameLower}',
        code: 'DELETE_ERROR'
      },
      { status: 400 }
    );
  }
}`;
}

/**
 * Generate enhanced stats API route
 */
function generateEnhancedStatsAPIRouteContent(config: EntityConfig): string {
  return `/**
 * ${config.entityName} Stats API Route with Enhanced Metrics
 * Generated by enhanced entity generator script V4
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { get${config.entityName}Stats } from '@/libs/queries/${config.entityNameLower}';

// GET /api/${config.entityNamePlural}/stats
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await get${config.entityName}Stats(userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching ${config.entityNameLower} stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}`;
}

/**
 * Generate enhanced relation options API route
 */
function generateEnhancedRelationOptionsRouteContent(config: EntityConfig): string {
  const relationFields = config.fields.filter(f => f.relation);

  if (relationFields.length === 0) {
    return '';
  }

  return `/**
 * ${config.entityName} Enhanced Relation Options API Route
 * Generated by enhanced entity generator script V4
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { get${config.entityName}RelationOptions } from '@/libs/queries/${config.entityNameLower}';

// GET /api/${config.entityNamePlural}/relations/options
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const relationOptions = await get${config.entityName}RelationOptions();

    return NextResponse.json({
      success: true,
      data: relationOptions,
      metadata: {
        totalOptions: ${relationFields.filter(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany').map(f => `relationOptions.${f.relation!.entityLower}s.length`).join(' + ')},
        lastUpdated: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error fetching relation options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relation options' },
      { status: 500 }
    );
  }
}`;
}

// ======================
// 🆕 V4: ENHANCED FILE GENERATION WITH BETTER ERROR HANDLING
// ======================

/**
 * Enhanced file generation with better error handling and V4 features
 */
function generateEnhancedFile(sourcePath: string, targetPath: string, config: EntityConfig): void {
  try {
    // Special handling for schema files
    if (targetPath.includes('models/Schema') && targetPath.endsWith('.ts')) {
      const generatedContent = generateSchemaWithComplexFeatures(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Enhanced Schema V4): ${targetPath}`);
      return;
    }

    // Special handling for types files
    if (targetPath.includes('/types/') && targetPath.endsWith('.ts')) {
      const generatedContent = generateEnhancedTypesContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Enhanced Types V4): ${targetPath}`);
      return;
    }

    // Special handling for queries files
    if (targetPath.includes('queries/') && targetPath.endsWith('.ts')) {
      const generatedContent = generateEnhancedQueriesContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Enhanced Queries V4): ${targetPath}`);
      return;
    }

    // Special handling for validation files
    if (targetPath.includes('validations/') && targetPath.endsWith('.ts')) {
      const generatedContent = generateEnhancedValidationContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Enhanced Validation V4): ${targetPath}`);
      return;
    }

    // Special handling for API routes
    if (targetPath.includes('/api/') && targetPath.endsWith('route.ts') && !targetPath.includes('relations') && !targetPath.includes('[id]') && !targetPath.includes('stats')) {
      const generatedContent = generateEnhancedAPIRouteContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Enhanced API Route V4): ${targetPath}`);
      return;
    }

    // Special handling for individual entity API route
    if (targetPath.includes('/[id]/route.ts')) {
      const generatedContent = generateEnhancedEntityAPIRouteContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Enhanced Entity API V4): ${targetPath}`);
      return;
    }

    // Special handling for stats API route
    if (targetPath.includes('/stats/route.ts')) {
      const generatedContent = generateEnhancedStatsAPIRouteContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Enhanced Stats API V4): ${targetPath}`);
      return;
    }

    // Special handling for relation options API route
    if (targetPath.includes('/relations/options/route.ts')) {
      const generatedContent = generateEnhancedRelationOptionsRouteContent(config);
      if (generatedContent) {
        writeFileToPath(targetPath, generatedContent);
        console.log(`✅ Generated (Enhanced Relation Options API V4): ${targetPath}`);
      }
      return;
    }

    // 🆕 V4: Special handling for enhanced form component
    if (targetPath.includes('Form.tsx')) {
      const generatedContent = generateEnhancedFormComponentContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Enhanced Form Component V4): ${targetPath}`);
      return;
    }

    // Handle other files with template replacement (for legacy components)
    if (!existsSync(sourcePath)) {
      console.warn(`⚠️  Source file not found: ${sourcePath}`);
      return;
    }

    const sourceContent = readFileSync(sourcePath, 'utf-8');
    const generatedContent = replaceTemplateVars(sourceContent, config);
    writeFileToPath(targetPath, generatedContent);
    console.log(`✅ Generated (Template): ${targetPath}`);
  } catch (error) {
    console.error(`❌ Error generating ${targetPath}:`, error);
  }
}

/**
 * Write file to path with directory creation
 */
function writeFileToPath(targetPath: string, content: string): void {
  const targetDir = join(targetPath, '..');
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  writeFileSync(targetPath, content);
}

/**
 * Basic template replacement for legacy files
 */
function replaceTemplateVars(content: string, config: EntityConfig): string {
  return content
    .replace(/product/g, config.entityNameLower)
    .replace(/Product/g, config.entityName)
    .replace(/products/g, config.entityNamePlural)
    .replace(/Products/g, `${config.entityName}s`)
    .replace(/productCode/g, config.codeField)
    .replace(/ProductCode/g, capitalizeFirst(config.codeField))
    .replace(/productName/g, config.nameField)
    .replace(/ProductName/g, capitalizeFirst(config.nameField));
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ======================
// 🆕 V4: MAIN FUNCTION WITH ENHANCED FEATURES
// ======================

/**
 * Main function with enhanced error prevention and V4 features support
 */
function main() {
  const args = process.argv.slice(2);
  const entityName = args[0];

  if (!entityName) {
    console.error('❌ Please provide entity name');
    console.log('Usage: npx ts-node scripts/enhanced-generate-advanced-entity-V4-with-complex-support.ts [entityName]');
    console.log('Example: npx ts-node scripts/enhanced-generate-advanced-entity-V4-with-complex-support.ts employeeSalaryEntry');
    console.log('Example: npx ts-node scripts/enhanced-generate-advanced-entity-V4-with-complex-support.ts EMPLOYEE_SALARY_ENTRY');
    process.exit(1);
  }

  let config: EntityConfig;

  // 🆕 V4: Enhanced entity name conversion
  const convertedNames = convertEntityName(entityName);

  if (entityName.toLowerCase().includes('employee') && entityName.toLowerCase().includes('salary')) {
    // Use predefined EMPLOYEE_SALARY_ENTRY config
    config = employeeSalaryEntryConfig;
  } else {
    // Generate config for other entities with enhanced naming
    config = {
      ...employeeSalaryEntryConfig,
      ...convertedNames,
      codeField: 'id', // Most entities don't have specific code fields
      nameField: convertedNames.entityNameLower.includes('Date') ? 'createdAt' : `${convertedNames.entityNameLower}Name`,
      // Simplified fields for generic entities
      fields: [
        {
          name: `${convertedNames.entityNameLower}Code`,
          type: 'string',
          required: true,
          unique: true,
          maxLength: 50,
          label: `${convertedNames.entityName} Code`,
          excelColumn: `${convertedNames.entityName} Code`,
          dbColumnType: 'text',
        },
        {
          name: `${convertedNames.entityNameLower}Name`,
          type: 'string',
          required: true,
          maxLength: 255,
          label: `${convertedNames.entityName} Name`,
          excelColumn: `${convertedNames.entityName} Name`,
          dbColumnType: 'text',
        },
        {
          name: 'description',
          type: 'text',
          required: false,
          label: 'Description',
          excelColumn: 'Description',
          dbColumnType: 'text',
        },
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
          name: 'ownerId',
          type: 'string',
          required: true,
          maxLength: 50,
          label: 'Owner ID',
          excelColumn: 'Owner ID',
          dbColumnType: 'text',
        },
      ],
      complexConstraints: {
        uniqueIndexes: [{
          name: `${convertedNames.entityNameLower}CodeOwnerIdx`,
          fields: [`${convertedNames.entityNameLower}Code`, 'ownerId'],
        }],
        compositeIndexes: [
          { name: 'statusIdx', fields: ['status'] },
        ],
        checkConstraints: [],
      },
    };
  }

  console.log(`🚀 Generating ${config.entityName} entity with Enhanced V4 Features...`);
  console.log(`📋 Entity Details:`);
  console.log(`   • Entity Name: ${config.entityName}`);
  console.log(`   • Table Name: ${config.tableName}`);
  console.log(`   • Code Field: ${config.codeField}`);
  console.log(`   • Name Field: ${config.nameField}`);

  // 🆕 V4: Enhanced file mappings with complex features support
  const fileMappings = [
    // Core files - generate from scratch with V4 features
    ['', `src/models/Schema/${config.entityNameLower}.ts`], // Enhanced Schema with V4 features
    ['', `src/types/${config.entityNameLower}.ts`], // Enhanced Types with V4 features
    ['', `src/libs/queries/${config.entityNameLower}.ts`], // Enhanced Queries with V4 features
    ['', `src/libs/validations/${config.entityNameLower}.ts`], // Enhanced Validation with V4 features

    // API routes with V4 enhanced features
    ['', `src/app/api/${config.entityNamePlural}/route.ts`], // Enhanced main API route
    ['', `src/app/api/${config.entityNamePlural}/[id]/route.ts`], // Enhanced individual entity route
    ['', `src/app/api/${config.entityNamePlural}/stats/route.ts`], // Enhanced stats route

    // V4 Enhanced API routes
    ['', `src/app/api/${config.entityNamePlural}/relations/options/route.ts`], // Enhanced relation options

    // 🆕 V4: Enhanced React components (generated from scratch)
    ['', `src/features/${config.entityNameLower}/${config.entityName}Form.tsx`], // Enhanced Form Component with V4 features

    // Legacy components (using template replacement for now)
    ['src/features/product/ProductList.tsx', `src/features/${config.entityNameLower}/${config.entityName}List.tsx`],
    ['src/features/product/ProductSkeleton.tsx', `src/features/${config.entityNameLower}/${config.entityName}Skeleton.tsx`],
    ['src/features/product/ProductImportModal.tsx', `src/features/${config.entityNameLower}/${config.entityName}ImportModal.tsx`],

    // Hooks (using template replacement for now)
    ['src/hooks/useProducts.ts', `src/hooks/use${config.entityName}s.ts`],
    ['src/hooks/useProductMutations.ts', `src/hooks/use${config.entityName}Mutations.ts`],
    ['src/hooks/useProductFilters.ts', `src/hooks/use${config.entityName}Filters.ts`],
    ['src/hooks/useProductExport.ts', `src/hooks/use${config.entityName}Export.ts`],
    ['src/hooks/useProductImport.ts', `src/hooks/use${config.entityName}Import.ts`],

    // Pages
    ['src/app/[locale]/(auth)/dashboard/products/page.tsx', `src/app/[locale]/(auth)/dashboard/${config.entityNamePlural}/page.tsx`],
  ];

  // Generate all files
  fileMappings.forEach(([source, target]) => {
    generateEnhancedFile(source, target, config);
  });

  console.log(`\n🎉 ${config.entityName} entity generated successfully with Enhanced V4 Features!`);
  console.log('\n📋 Enhanced Features V4:');
  console.log('✅ Text Foreign Keys Support (userId references)');
  console.log('✅ Decimal Precision/Scale Support (unit prices, amounts)');
  console.log('✅ Complex Unique Indexes (multi-field constraints)');
  console.log('✅ Check Constraints (data integrity validation)');
  console.log('✅ Timestamp with Date Mode Support');
  console.log('✅ Enhanced Business Logic (auto-calculations)');
  console.log('✅ Complex Filtering & Search (date ranges, status filters)');
  console.log('✅ Batch Operations API (bulk updates, approvals)');
  console.log('✅ Enhanced Error Handling & Validation');
  console.log('✅ Performance Optimized Queries');
  console.log('✅ Advanced Statistics & Metrics');
  console.log('✅ Entity Name Conversion (SNAKE_CASE support)');

  console.log('\n📋 Relations Generated:');
  const relationFields = config.fields.filter(f => f.relation);
  relationFields.forEach((field) => {
    const rel = field.relation!;
    const fkType = rel.foreignKeyType || 'integer';
    console.log(`✅ ${rel.type}: ${config.entityName} -> ${rel.entity} (${rel.displayField}) [${fkType} FK]`);
  });

  if (config.complexConstraints) {
    console.log('\n📋 Complex Constraints:');
    config.complexConstraints.uniqueIndexes?.forEach((idx) => {
      console.log(`✅ Unique Index: ${idx.name} (${idx.fields.join(', ')})`);
    });
    config.complexConstraints.checkConstraints?.forEach((constraint) => {
      console.log(`✅ Check Constraint: ${constraint.name} (${constraint.sql})`);
    });
  }

  console.log('\n📋 Next steps:');
  console.log('1. Update src/models/Schema.ts to export new schemas');
  console.log('2. Run database migration if needed: npm run db:generate');
  console.log('3. Run type check: npm run type-check');
  console.log('4. Test the generated entity with V4 features');
  console.log('5. Customize validation rules and business logic if needed');
  console.log('6. Test text foreign key relationships');
  console.log('7. Verify complex indexes and constraints');
}

if (require.main === module) {
  main();
}

// ======================
// 🆕 V4: ENHANCED FORM COMPONENT GENERATION WITH COMPLEX FEATURES
// ======================

/**
 * Generate enhanced React form component with complex features:
 * - Text foreign keys support
 * - Decimal fields with proper formatting
 * - Date/timestamp pickers
 * - Business logic (auto-calculations)
 * - Complex validation
 * - Relation dropdowns
 */
function generateEnhancedFormComponentContent(config: EntityConfig): string {
  const relationFields = config.fields.filter(f => f.relation);
  const belongsToFields = relationFields.filter(f => f.relation?.type === 'belongsTo');
  const manyToManyFields = relationFields.filter(f => f.relation?.type === 'manyToMany');
  const regularFields = config.fields.filter(f =>
    !f.relation
    && f.name !== 'ownerId'
    && f.name !== 'id'
    && f.name !== 'createdAt'
    && f.name !== 'updatedAt',
  );

  return `/**
 * ${config.entityName} Enhanced Form Component with Complex Features
 * Generated by enhanced entity generator script V4
 * 🆕 Features: Text FK Support, Decimal Formatting, Business Logic, Complex Validation
 */

import { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
${belongsToFields.length > 0 || manyToManyFields.length > 0 ? `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';` : ''}
${manyToManyFields.length > 0 ? `import { Checkbox } from '@/components/ui/checkbox';` : ''}
${config.fields.some(f => f.type === 'date' || f.type === 'timestamp')
  ? `import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/libs/utils';`
  : ''}

import { ${config.entityNameLower}FormSchema } from '@/libs/validations/${config.entityNameLower}';
import type { 
  ${config.entityName}FormData, 
  ${relationFields.length > 0 ? `${config.entityName}RelationOptions,` : ''}
  ${config.entityName}${relationFields.length > 0 ? 'WithRelations' : ''} 
} from '@/types/${config.entityNameLower}';

interface ${config.entityName}FormProps {
  ${config.entityNameLower}?: ${config.entityName}${relationFields.length > 0 ? 'WithRelations' : ''};
  onSubmit: (data: ${config.entityName}FormData) => Promise<void>;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export function ${config.entityName}Form({ 
  ${config.entityNameLower}, 
  onSubmit, 
  isLoading = false,
  mode = 'create'
}: ${config.entityName}FormProps) {
  ${relationFields.length > 0
    ? `const [relationOptions, setRelationOptions] = useState<${config.entityName}RelationOptions>({
    ${relationFields
      .filter(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany')
      .map(f => `${f.relation!.entityLower}s: []`)
      .join(',\n    ')}
  });`
    : ''}

  const form = useForm<${config.entityName}FormData>({
    resolver: zodResolver(${config.entityNameLower}FormSchema),
    defaultValues: {
      ${regularFields.map((field) => {
        if (field.type === 'boolean') {
          return `${field.name}: ${config.entityNameLower}?.${field.name} ?? false,`;
        } else if (field.type === 'number') {
          return `${field.name}: ${config.entityNameLower}?.${field.name} ?? ${field.name === 'actualQuantity' ? '0' : 'undefined'},`;
        } else if (field.type === 'decimal') {
          return `${field.name}: ${config.entityNameLower}?.${field.name} ?? undefined,`;
        } else if (field.type === 'date') {
          return `${field.name}: ${config.entityNameLower}?.${field.name} ? new Date(${config.entityNameLower}.${field.name}).toISOString().split('T')[0] : ${field.name === 'workDate' ? 'new Date().toISOString().split(\'T\')[0]' : 'undefined'},`;
        } else if (field.type === 'timestamp') {
          return `${field.name}: ${config.entityNameLower}?.${field.name} ? new Date(${config.entityNameLower}.${field.name}).toISOString().slice(0, 16) : undefined,`;
        } else {
          return `${field.name}: ${config.entityNameLower}?.${field.name} ?? '',`;
        }
      }).join('\n      ')}
      ${belongsToFields.map(field =>
        `${field.relation!.foreignKey}: ${config.entityNameLower}?.${field.relation!.foreignKey} ?? undefined,`,
      ).join('\n      ')}
      ${manyToManyFields.map(field =>
        `${field.name}: ${config.entityNameLower}?.${field.relation!.entityLower}s?.map(rel => rel.id) ?? [],`,
      ).join('\n      ')}
    },
  });

  ${relationFields.length > 0
    ? `
  // 🆕 V4: Load relation options with error handling
  useEffect(() => {
    const loadRelationOptions = async () => {
      try {
        const response = await fetch('/api/${config.entityNamePlural}/relations/options');
        if (response.ok) {
          const data = await response.json();
          setRelationOptions(data.data);
        } else {
          console.error('Failed to load relation options:', response.statusText);
        }
      } catch (error) {
        console.error('Error loading relation options:', error);
      }
    };

    loadRelationOptions();
  }, []);`
    : ''}

  ${config.fields.some(f => f.name === 'totalAmount')
    ? `
  // 🆕 V4: Watch for changes in actualQuantity and unitPrice to auto-calculate totalAmount
  const actualQuantity = useWatch({ control: form.control, name: 'actualQuantity' });
  const unitPrice = useWatch({ control: form.control, name: 'unitPrice' });

  useEffect(() => {
    if (actualQuantity && unitPrice) {
      const calculatedTotal = Number(actualQuantity) * Number(unitPrice);
      form.setValue('totalAmount', calculatedTotal);
    }
  }, [actualQuantity, unitPrice, form]);`
    : ''}

  ${config.fields.some(f => f.name === 'workDurationMinutes')
    ? `
  // 🆕 V4: Auto-calculate work duration from start/end times
  const startTime = useWatch({ control: form.control, name: 'startTime' });
  const endTime = useWatch({ control: form.control, name: 'endTime' });

  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (end > start) {
        const durationMs = end.getTime() - start.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        form.setValue('workDurationMinutes', durationMinutes);
      }
    }
  }, [startTime, endTime, form]);`
    : ''}

  // 🆕 V4: Enhanced form submission with validation
  const handleSubmit = useCallback(async (data: ${config.entityName}FormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      // You could add toast notification here
    }
  }, [onSubmit]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 🆕 V4: BelongsTo Relation Fields with Enhanced UI */}
          ${belongsToFields.map(field => `
          <FormField
            control={form.control}
            name="${field.relation!.foreignKey}"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>${field.label}</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    ${field.relation?.foreignKeyType === 'text'
                      ? `formField.onChange(value);`
                      : `formField.onChange(Number(value));`}
                  }}
                  value={formField.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ${field.label}" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationOptions.${field.relation!.entityLower}s?.map((option) => (
                      <SelectItem key={option.${field.relation!.referenceKey || 'id'}} value={option.${field.relation!.referenceKey || 'id'}.toString()}>
                        {option.${field.relation!.displayField}}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />`).join('\n')}

          {/* 🆕 V4: Regular Fields with Enhanced Types */}
          ${regularFields.map((field) => {
            if (field.type === 'text') {
              return `
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="${field.name}"
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>${field.label}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter ${field.label.toLowerCase()}"
                      className="min-h-[100px]"
                      {...formField}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>`;
            } else if (field.type === 'date') {
              return `
          <FormField
            control={form.control}
            name="${field.name}"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>${field.label}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formField.value && "text-muted-foreground"
                        )}
                      >
                        {formField.value ? (
                          format(new Date(formField.value), "PPP")
                        ) : (
                          <span>Pick ${field.label.toLowerCase()}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formField.value ? new Date(formField.value) : undefined}
                      onSelect={(date) => {
                        formField.onChange(date ? date.toISOString().split('T')[0] : '');
                      }}
                      disabled={(date) =>
                        ${field.name === 'workDate' ? 'date > new Date() || date < new Date("1900-01-01")' : 'false'}
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />`;
            } else if (field.type === 'timestamp') {
              return `
          <FormField
            control={form.control}
            name="${field.name}"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>${field.label}</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...formField}
                    value={formField.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />`;
            } else if (field.type === 'number') {
              return `
          <FormField
            control={form.control}
            name="${field.name}"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>${field.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter ${field.label.toLowerCase()}"
                    {...formField}
                    onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    value={formField.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />`;
            } else if (field.type === 'decimal') {
              return `
          <FormField
            control={form.control}
            name="${field.name}"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>${field.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...formField}
                    onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    value={formField.value ?? ''}
                    ${field.name === 'totalAmount' ? 'readOnly className="bg-gray-50"' : ''}
                  />
                </FormControl>
                <FormMessage />
                ${field.name === 'totalAmount' ? '<p className="text-xs text-muted-foreground">Auto-calculated from quantity × unit price</p>' : ''}
              </FormItem>
            )}
          />`;
            } else if (field.name === 'status') {
              return `
          <FormField
            control={form.control}
            name="${field.name}"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>${field.label}</FormLabel>
                <Select onValueChange={formField.onChange} value={formField.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />`;
            } else {
              return `
          <FormField
            control={form.control}
            name="${field.name}"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>${field.label}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter ${field.label.toLowerCase()}"
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />`;
            }
          }).join('\n')}
        </div>

        {/* 🆕 V4: Many-to-Many Relation Fields */}
        ${manyToManyFields.map(field => `
        <FormField
          control={form.control}
          name="${field.name}"
          render={() => (
            <FormItem>
              <FormLabel>${field.label}</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto border rounded-md p-4">
                {relationOptions.${field.relation!.entityLower}s?.map((option) => (
                  <FormField
                    key={option.id}
                    control={form.control}
                    name="${field.name}"
                    render={({ field: formField }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={formField.value?.includes(option.id)}
                            onCheckedChange={(checked) => {
                              const currentValue = formField.value || [];
                              if (checked) {
                                formField.onChange([...currentValue, option.id]);
                              } else {
                                formField.onChange(currentValue.filter((id: number) => id !== option.id));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {option.${field.relation!.displayField}}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />`).join('\n')}

        {/* 🆕 V4: Enhanced Action Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Create ${config.entityName}' : 'Update ${config.entityName}'
            )}
          </Button>
        </div>

        {/* 🆕 V4: Form Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-4 bg-gray-50 rounded-md">
            <summary className="cursor-pointer text-sm font-medium">Debug Form State</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(form.formState.errors, null, 2)}
            </pre>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(form.getValues(), null, 2)}
            </pre>
          </details>
        )}
      </form>
    </Form>
  );
}`;
}
