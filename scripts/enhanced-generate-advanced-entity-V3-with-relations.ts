#!/usr/bin/env node

/**
 * Enhanced Advanced Entity Generator Script V3 - WITH RELATIONSHIPS SUPPORT
 * Creates complete CRUD entity with Excel import/export capabilities and database relationships
 * Enhanced to prevent common TypeScript and runtime errors + Full Relations Support
 *
 * Usage: npx ts-node scripts/enhanced-generate-advanced-entity-V3-with-relations.ts [entityName]
 * Example: npx ts-node scripts/enhanced-generate-advanced-entity-V3-with-relations.ts plan
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type FieldConfig = {
  name: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'decimal' | 'relation';
  required: boolean;
  unique?: boolean;
  maxLength?: number;
  label: string;
  excelColumn?: string;
  dbColumnType?: 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'timestamp';
  
  // 🆕 Relationship properties
  relation?: {
    type: 'belongsTo' | 'hasMany' | 'manyToMany';
    entity: string;           // Related entity name (e.g., 'Category')
    entityLower: string;      // Related entity lowercase (e.g., 'category')
    foreignKey: string;       // Field name in current table (e.g., 'categoryId')
    referenceKey?: string;    // Field in related table (default: 'id')
    displayField: string;     // Field to show in UI (e.g., 'categoryName')
    nullable?: boolean;       // Can be null
    onDelete?: 'cascade' | 'restrict' | 'setNull';
    
    // For many-to-many
    junctionTable?: string;   // Junction table name
    junctionFields?: {
      currentKey: string;     // Current entity key in junction
      relatedKey: string;     // Related entity key in junction
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
    relationships: boolean; // 🆕 New feature flag
  };
  uiType: 'table' | 'cards';
};

// Enhanced Plan configuration with relationships
const planConfigWithRelations: EntityConfig = {
  entityName: 'Plan',
  entityNameLower: 'plan',
  entityNamePlural: 'plans',
  tableName: 'plan',
  codeField: 'planCode',
  nameField: 'planName',
  fields: [
    {
      name: 'planCode',
      type: 'string',
      required: true,
      unique: true,
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
      name: 'planYear',
      type: 'number',
      required: true,
      label: 'Plan Year',
      excelColumn: 'Plan Year',
      dbColumnType: 'integer',
    },
    {
      name: 'planMonth',
      type: 'number',
      required: true,
      label: 'Plan Month',
      excelColumn: 'Plan Month',
      dbColumnType: 'integer',
    },
    // 🆕 Category relationship (belongsTo)
    {
      name: 'category',
      type: 'relation',
      required: true,
      label: 'Category',
      excelColumn: 'Category',
      relation: {
        type: 'belongsTo',
        entity: 'Category',
        entityLower: 'category',
        foreignKey: 'categoryId',
        displayField: 'categoryName',
        onDelete: 'restrict'
      }
    },
    // 🆕 Department relationship (belongsTo)
    {
      name: 'department',
      type: 'relation',
      required: false,
      label: 'Department',
      excelColumn: 'Department',
      relation: {
        type: 'belongsTo',
        entity: 'Department',
        entityLower: 'department',
        foreignKey: 'departmentId',
        displayField: 'departmentName',
        nullable: true,
        onDelete: 'setNull'
      }
    },
    // 🆕 Assigned Users (manyToMany)
    {
      name: 'assignedUsers',
      type: 'relation',
      required: false,
      label: 'Assigned Users',
      excelColumn: 'Assigned Users',
      relation: {
        type: 'manyToMany',
        entity: 'User',
        entityLower: 'user',
        displayField: 'userName',
        junctionTable: 'plan_users',
        junctionFields: {
          currentKey: 'planId',
          relatedKey: 'userId'
        }
      }
    },
    {
      name: 'totalTargetQuantity',
      type: 'number',
      required: false,
      label: 'Total Target Quantity',
      excelColumn: 'Total Target Quantity',
      dbColumnType: 'integer',
    },
    {
      name: 'totalActualQuantity',
      type: 'number',
      required: false,
      label: 'Total Actual Quantity',
      excelColumn: 'Total Actual Quantity',
      dbColumnType: 'integer',
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
      name: 'planStartDate',
      type: 'date',
      required: false,
      label: 'Plan Start Date',
      excelColumn: 'Plan Start Date',
      dbColumnType: 'date',
    },
    {
      name: 'planEndDate',
      type: 'date',
      required: false,
      label: 'Plan End Date',
      excelColumn: 'Plan End Date',
      dbColumnType: 'date',
    },
    {
      name: 'approvedBy',
      type: 'string',
      required: false,
      maxLength: 255,
      label: 'Approved By',
      excelColumn: 'Approved By',
      dbColumnType: 'text',
    },
    {
      name: 'approvedAt',
      type: 'date',
      required: false,
      label: 'Approved At',
      excelColumn: 'Approved At',
      dbColumnType: 'timestamp',
    },
    {
      name: 'note',
      type: 'text',
      required: false,
      label: 'Note',
      excelColumn: 'Note',
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
  features: {
    pagination: true,
    search: true,
    sorting: true,
    stats: true,
    excelImport: true,
    excelExport: true,
    uniqueCode: true,
    batchOperations: true,
    relationships: true, // 🆕 Enable relationships
  },
  uiType: 'table',
};

/**
 * 🆕 Generate database schema with relationships
 */
function generateSchemaWithRelations(config: EntityConfig): string {
  const relationFields = config.fields.filter(f => f.relation);
  const regularFields = config.fields.filter(f => !f.relation && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt');
  
  let schemaContent = `/**
 * ${config.entityName} Database Schema with Relations
 * Generated by enhanced entity generator script V3
 */

import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp, boolean, decimal, date } from 'drizzle-orm/pg-core';
${relationFields.length > 0 ? `\n// Import related schemas\n${relationFields
    .map(f => `import { ${f.relation!.entityLower}Schema } from './${f.relation!.entityLower}';`)
    .join('\n')}` : ''}

export const ${config.entityNameLower}Schema = pgTable('${config.tableName}', {
  id: serial('id').primaryKey(),
  
  // Regular fields
${regularFields.map(field => {
    const column = getColumnDefinition(field);
    return `  ${field.name}: ${column},`;
  }).join('\n')}

  // Foreign key fields
${relationFields
    .filter(f => f.relation?.type === 'belongsTo')
    .map(field => {
      const nullable = field.relation?.nullable ? '' : '.notNull()';
      const onDelete = field.relation?.onDelete || 'restrict';
      return `  ${field.relation!.foreignKey}: integer('${field.relation!.foreignKey}')${nullable}.references(() => ${field.relation!.entityLower}Schema.id, { onDelete: '${onDelete}' }),`;
    }).join('\n')}

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations configuration
export const ${config.entityNameLower}Relations = relations(${config.entityNameLower}Schema, ({ one, many }) => ({
${relationFields.map(field => {
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
    manyToManyRelations.forEach(field => {
      const rel = field.relation!;
      schemaContent += `
export const ${rel.junctionTable}Schema = pgTable('${rel.junctionTable}', {
  id: serial('id').primaryKey(),
  ${rel.junctionFields!.currentKey}: integer('${rel.junctionFields!.currentKey}').notNull().references(() => ${config.entityNameLower}Schema.id, { onDelete: 'cascade' }),
  ${rel.junctionFields!.relatedKey}: integer('${rel.junctionFields!.relatedKey}').notNull().references(() => ${rel.entityLower}Schema.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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

/**
 * Get column definition for database schema
 */
function getColumnDefinition(field: FieldConfig): string {
  const nullable = field.required ? '.notNull()' : '';
  const unique = field.unique ? '.unique()' : '';
  
  switch (field.dbColumnType) {
    case 'text':
      return `text('${field.name}')${field.maxLength ? `.max(${field.maxLength})` : ''}${nullable}${unique}`;
    case 'integer':
      return `integer('${field.name}')${nullable}${unique}`;
    case 'decimal':
      return `decimal('${field.name}')${nullable}${unique}`;
    case 'boolean':
      return `boolean('${field.name}')${nullable}`;
    case 'date':
      return `date('${field.name}')${nullable}`;
    case 'timestamp':
      return `timestamp('${field.name}')${nullable}`;
    default:
      return `text('${field.name}')${nullable}${unique}`;
  }
}

/**
 * Generate database insert values with proper type handling and relations
 */
function generateInsertValues(config: EntityConfig): string {
  const regularFields = config.fields.filter(f => 
    !f.relation && 
    f.name !== 'id' && 
    f.name !== 'createdAt' && 
    f.name !== 'updatedAt'
  );
  
  const belongsToFields = config.fields.filter(f => f.relation?.type === 'belongsTo');
  
  const allInsertFields = [
    ...regularFields.map(field => {
      if (field.type === 'date') {
        return `${field.name}: data.${field.name} ? new Date(data.${field.name}) : null`;
      }
      return `${field.name}: data.${field.name}`;
    }),
    ...belongsToFields.map(field => `${field.relation!.foreignKey}: data.${field.relation!.foreignKey}`)
  ];
  
  return allInsertFields.join(',\n      ');
}

/**
 * Generate database update values with proper date and relation handling
 */
function generateUpdateValues(config: EntityConfig): string {
  const updateFields = config.fields.filter(f => 
    f.name !== 'id' && 
    f.name !== 'ownerId' && 
    f.name !== 'createdAt' && 
    f.name !== 'updatedAt' &&
    f.relation?.type !== 'manyToMany' // Many-to-many handled separately
  );

  const conditionalUpdates = updateFields.map((field) => {
    if (field.relation?.type === 'belongsTo') {
      return `
  if (data.${field.relation.foreignKey} !== undefined) {
    updateData.${field.relation.foreignKey} = data.${field.relation.foreignKey};
  } else {
    updateData.${field.relation.foreignKey} = existingEntity.${field.relation.foreignKey};
  }`;
    } else if (field.type === 'date') {
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
 * Generate proper validation schema with enhanced date, number and relation validation
 */
function generateValidationSchema(config: EntityConfig): string {
  return config.fields
    .filter(f => f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map((field) => {
      let validation = '';

      if (field.relation?.type === 'belongsTo') {
        validation = `${field.relation.foreignKey}: z.number().int().positive()`;
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
          break;

        case 'number':
          validation += 'z.number().int()';
          if (field.required) {
            validation += '.min(0)';
          }
          // Special validation for year and month fields
          if (field.name === 'planYear') {
            validation += '.min(2020).max(2030)';
          } else if (field.name === 'planMonth') {
            validation += '.min(1).max(12)';
          }
          break;

        case 'boolean':
          validation += 'z.boolean()';
          break;

        case 'date':
          validation += 'z.union([z.string(), z.date()])';
          break;

        case 'decimal':
          validation += 'z.number()';
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
 * Generate TypeScript types with proper optional handling and relations
 */
function generateTypeFields(config: EntityConfig, includeId = false, includeOwner = false, allOptional = false): string {
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
        return `  ${field.relation.foreignKey}${isOptional ? '?' : ''}: number;`;
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
      }

      const isOptional = allOptional || !field.required;
      return `  ${field.name}${isOptional ? '?' : ''}: ${type};`;
    })
    .join('\n');
}

/**
 * 🆕 Generate relation types
 */
function generateRelationTypes(config: EntityConfig): string {
  const relationFields = config.fields.filter(f => f.relation);
  
  if (relationFields.length === 0) {
    return '';
  }

  return `
// Relations types
${relationFields.map(field => {
    const rel = field.relation!;
    if (rel.type === 'belongsTo') {
      return `  ${rel.entityLower}?: Pick<${rel.entity}, 'id' | '${rel.displayField}'>;`;
    } else if (rel.type === 'hasMany') {
      return `  ${rel.entityLower}s?: ${rel.entity}[];`;
    } else if (rel.type === 'manyToMany') {
      return `  ${rel.entityLower}s?: Pick<${rel.entity}, 'id' | '${rel.displayField}'>[];`;
    }
    return '';
  }).filter(Boolean).join('\n')}`;
}

/**
 * Generate complete types file content with relations support
 */
function generateCompleteTypesContent(config: EntityConfig): string {
  const formDataFields = generateTypeFields(config, false, false);
  const createInputFields = generateTypeFields(config, false, false);
  const updateInputFields = generateTypeFields(config, false, false, true);
  const relationTypes = generateRelationTypes(config);
  const relationFields = config.fields.filter(f => f.relation);

  return `/**
 * ${config.entityName}-related TypeScript types and interfaces
 * Enhanced version with proper error handling, type safety and relationships support
 * Generated by enhanced entity generator script V3
 */

import type { ${config.entityNameLower}Schema } from '@/models/Schema';
${relationFields.length > 0 ? relationFields.map(f => 
    `import type { ${f.relation!.entity} } from '@/types/${f.relation!.entityLower}';`
  ).join('\n') : ''}

// Infer the ${config.entityName}Db type from Drizzle schema
export type ${config.entityName}Db = typeof ${config.entityNameLower}Schema.$inferSelect;

// Client-side ${config.entityName} type with proper date handling
export type ${config.entityName} = Omit<${config.entityName}Db, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

${relationTypes ? `
// ${config.entityName} with relations
export type ${config.entityName}WithRelations = ${config.entityName} & {${relationTypes}
};` : ''}

// Form data type for React Hook Form
export type ${config.entityName}FormData = {
${formDataFields}
};

// Input types for CRUD operations with proper validation
export type Create${config.entityName}Input = {
  readonly ownerId: string;
${createInputFields}
};

export type Update${config.entityName}Input = {
${updateInputFields}
};

${relationFields.length > 0 ? `
// Relation options for dropdowns
export type ${config.entityName}RelationOptions = {
${relationFields
  .filter(f => f.relation?.type === 'belongsTo')
  .map(f => `  readonly ${f.relation!.entityLower}s: readonly Pick<${f.relation!.entity}, 'id' | '${f.relation!.displayField}'>[];`)
  .join('\n')}
${relationFields
  .filter(f => f.relation?.type === 'manyToMany')
  .map(f => `  readonly ${f.relation!.entityLower}s: readonly Pick<${f.relation!.entity}, 'id' | '${f.relation!.displayField}'>[];`)
  .join('\n')}
};` : ''}

// API Response types
export type ${config.entityName}Response = {
  readonly success: true;
  readonly data: ${config.entityName}${relationTypes ? 'WithRelations' : ''};
  readonly message?: string;
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
};

export type ${config.entityName}ErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// List parameters
export type ${config.entityName}ListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | '${config.nameField}' | '${config.codeField}';
  readonly sortOrder?: 'asc' | 'desc';
  readonly showAll?: boolean;
  readonly includeRelations?: boolean; // 🆕 Include relations flag
};

export type ${config.entityName}ListParamsWithOwner = ${config.entityName}ListParams & {
  readonly ownerId: string;
};

// Export parameters for Excel functionality
export type ${config.entityName}ExportParams = ${config.entityName}ListParams;

// Import validation result
export type Import${config.entityName}Result = {
  readonly success: boolean;
  readonly imported: number;
  readonly failed: number;
  readonly errors: readonly string[];
  readonly ${config.entityNamePlural}: readonly ${config.entityName}[];
};

// Statistics type
export type ${config.entityName}Stats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
};

export type ${config.entityName}StatsResponse = {
  readonly success: true;
  readonly data: ${config.entityName}Stats;
};

// Filter state
export type ${config.entityName}Filters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | '${config.nameField}' | '${config.codeField}';
  sortOrder: 'asc' | 'desc';
};`;
}

/**
 * 🆕 Generate database queries with enhanced error handling and relations
 */
function generateQueriesContent(config: EntityConfig): string {
  const insertValues = generateInsertValues(config);
  const updateLogic = generateUpdateValues(config);
  const relationFields = config.fields.filter(f => f.relation);
  const belongsToFields = relationFields.filter(f => f.relation?.type === 'belongsTo');
  const manyToManyFields = relationFields.filter(f => f.relation?.type === 'manyToMany');

  return `/**
 * ${config.entityName} database queries using Drizzle ORM with Relations Support
 * Enhanced version with proper error handling, type safety and relationships
 * Generated by enhanced entity generator script V3
 */

import { and, asc, count, desc, eq, gte, ilike, or, inArray } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { ${config.entityNameLower}Schema } from '@/models/Schema';
${relationFields.length > 0 ? relationFields.map(f => 
    `import { ${f.relation!.entityLower}Schema } from '@/models/Schema';`
  ).join('\n') : ''}
${manyToManyFields.length > 0 ? manyToManyFields.map(f => 
    `import { ${f.relation!.junctionTable}Schema } from '@/models/Schema';`
  ).join('\n') : ''}
import type {
  Create${config.entityName}Input,
  ${config.entityName}Db,
  ${config.entityName}ListParamsWithOwner,
  ${config.entityName}Stats,
  Update${config.entityName}Input,
  ${relationFields.length > 0 ? `${config.entityName}WithRelations,` : ''}
} from '@/types/${config.entityNameLower}';

/**
 * Create a new ${config.entityNameLower} with proper date and relation handling
 */
export async function create${config.entityName}(data: Create${config.entityName}Input): Promise<${config.entityName}Db> {
  ${belongsToFields.length > 0 ? `
  // Validate foreign keys exist
  ${belongsToFields.map(field => `
  if (data.${field.relation!.foreignKey}) {
    const ${field.relation!.entityLower}Exists = await db
      .select({ id: ${field.relation!.entityLower}Schema.id })
      .from(${field.relation!.entityLower}Schema)
      .where(eq(${field.relation!.entityLower}Schema.id, data.${field.relation!.foreignKey}))
      .limit(1);
      
    if (!${field.relation!.entityLower}Exists.length) {
      throw new Error('${field.relation!.entity} not found');
    }
  }`).join('')}` : ''}

  ${manyToManyFields.length > 0 ? `
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
  });` : `
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
 * Get ${config.entityNamePlural} by owner with enhanced filtering and relations
 */
export async function get${config.entityName}sByOwner(
  params: ${config.entityName}ListParamsWithOwner
): Promise<${config.entityName}Db${relationFields.length > 0 ? ' | ' + config.entityName + 'WithRelations' : ''}[]> {
  const {
    ownerId,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeRelations = false,
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
      
      ${belongsToFields.length > 0 ? `
      // Foreign key fields
      ${belongsToFields.map(f => 
        `${f.relation!.foreignKey}: ${config.entityNameLower}Schema.${f.relation!.foreignKey}`
      ).join(',\n      ')},
      
      // Related entity data (only if includeRelations is true)
      ${belongsToFields.map(f => `
      ${f.relation!.entityLower}: includeRelations ? {
        id: ${f.relation!.entityLower}Schema.id,
        ${f.relation!.displayField}: ${f.relation!.entityLower}Schema.${f.relation!.displayField},
      } : null`).join(',\n')}` : ''}
    })
    .from(${config.entityNameLower}Schema);

  ${belongsToFields.length > 0 ? `
  // Add joins for belongsTo relations
  if (includeRelations) {
    ${belongsToFields.map(f => `
    query = query.leftJoin(
      ${f.relation!.entityLower}Schema,
      eq(${config.entityNameLower}Schema.${f.relation!.foreignKey}, ${f.relation!.entityLower}Schema.id)
    );`).join('')}
  }` : ''}

  // Build where conditions safely
  let whereConditions = eq(${config.entityNameLower}Schema.ownerId, ownerId);

  if (search) {
    const searchTerm = \`%\${search}%\`;
    const searchCondition = or(
      ilike(${config.entityNameLower}Schema.${config.codeField}, searchTerm),
      ilike(${config.entityNameLower}Schema.${config.nameField}, searchTerm)${belongsToFields.length > 0 ? `,
      ${belongsToFields.map(f => 
        `ilike(${f.relation!.entityLower}Schema.${f.relation!.displayField}, searchTerm)`
      ).join(',\n      ')}` : ''}
    );
    
    if (searchCondition) {
      whereConditions = and(whereConditions, searchCondition);
    }
  }

  // Safe sorting with switch statement
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
    case '${config.codeField}':
      orderBy = sortOrder === 'asc' ? asc(${config.entityNameLower}Schema.${config.codeField}) : desc(${config.entityNameLower}Schema.${config.codeField});
      break;
    default:
      orderBy = desc(${config.entityNameLower}Schema.createdAt);
  }

  const results = await query
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  ${manyToManyFields.length > 0 ? `
  // Handle many-to-many relations separately
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
  }` : ''}

  return results;
}

/**
 * Get ${config.entityNameLower} by ID with ownership check and relations
 */
export async function get${config.entityName}ById(
  id: number,
  ownerId: string,
  includeRelations = false
): Promise<${config.entityName}Db${relationFields.length > 0 ? ' | ' + config.entityName + 'WithRelations' : ''} | undefined> {
  let query = db
    .select({
      id: ${config.entityNameLower}Schema.id,
      ${config.fields
        .filter(f => !f.relation && f.name !== 'id')
        .map(f => `${f.name}: ${config.entityNameLower}Schema.${f.name}`)
        .join(',\n      ')},
      
      ${belongsToFields.length > 0 ? `
      // Foreign key fields
      ${belongsToFields.map(f => 
        `${f.relation!.foreignKey}: ${config.entityNameLower}Schema.${f.relation!.foreignKey}`
      ).join(',\n      ')},
      
      // Related entity data
      ${belongsToFields.map(f => `
      ${f.relation!.entityLower}: includeRelations ? {
        id: ${f.relation!.entityLower}Schema.id,
        ${f.relation!.displayField}: ${f.relation!.entityLower}Schema.${f.relation!.displayField},
      } : null`).join(',\n')}` : ''}
    })
    .from(${config.entityNameLower}Schema);

  ${belongsToFields.length > 0 ? `
  if (includeRelations) {
    ${belongsToFields.map(f => `
    query = query.leftJoin(
      ${f.relation!.entityLower}Schema,
      eq(${config.entityNameLower}Schema.${f.relation!.foreignKey}, ${f.relation!.entityLower}Schema.id)
    );`).join('')}
  }` : ''}

  const [result] = await query
    .where(and(
      eq(${config.entityNameLower}Schema.id, id), 
      eq(${config.entityNameLower}Schema.ownerId, ownerId)
    ))
    .limit(1);

  if (!result) {
    return undefined;
  }

  ${manyToManyFields.length > 0 ? `
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
  }` : ''}

  return result;
}

/**
 * Update ${config.entityNameLower} with proper date handling, type safety and relations
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

  ${manyToManyFields.length > 0 ? `
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
  });` : `
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
 * Delete ${config.entityNameLower} with ownership check and cascade handling
 */
export async function delete${config.entityName}(id: number, ownerId: string): Promise<void> {
  ${manyToManyFields.length > 0 ? `
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
  });` : `
  const result = await db
    .delete(${config.entityNameLower}Schema)
    .where(and(eq(${config.entityNameLower}Schema.id, id), eq(${config.entityNameLower}Schema.ownerId, ownerId)));

  if (result.rowCount === 0) {
    throw new Error('${config.entityName} not found or access denied');
  }`}
}

${relationFields.length > 0 ? `
/**
 * Get relation options for dropdowns
 */
export async function get${config.entityName}RelationOptions(): Promise<{
${relationFields
  .filter(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany')
  .map(f => `  ${f.relation!.entityLower}s: Array<{ id: number; ${f.relation!.displayField}: string }>;`)
  .join('\n')}
}> {
  const [${relationFields
    .filter(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany')
    .map(f => `${f.relation!.entityLower}Options`)
    .join(', ')}] = await Promise.all([
    ${relationFields
      .filter(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany')
      .map(f => `
    db.select({
      id: ${f.relation!.entityLower}Schema.id,
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
}` : ''}

/**
 * Get ${config.entityNameLower} statistics
 */
export async function get${config.entityName}Stats(ownerId: string): Promise<${config.entityName}Stats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalResult, todayResult, thisWeekResult, thisMonthResult] = await Promise.all([
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
  ]);

  return {
    total: totalResult[0]?.count ?? 0,
    today: todayResult[0]?.count ?? 0,
    thisWeek: thisWeekResult[0]?.count ?? 0,
    thisMonth: thisMonthResult[0]?.count ?? 0,
  };
}`;
}

/**
 * Generate validation file content with relations support
 */
function generateValidationContent(config: EntityConfig): string {
  const validationSchema = generateValidationSchema(config);
  const relationFields = config.fields.filter(f => f.relation);

  return `/**
 * ${config.entityName} validation schemas with Relations Support
 * Enhanced version with proper error handling, type safety and relationships
 * Generated by enhanced entity generator script V3
 */

import { z } from 'zod';

// Form validation schema with relations
export const ${config.entityNameLower}FormSchema = z.object({
  ${validationSchema}
});

// Create ${config.entityNameLower} schema (same as form + ownerId)
export const create${config.entityName}Schema = ${config.entityNameLower}FormSchema.extend({
  ownerId: z.string().min(1, 'Owner ID is required'),
});

// Update ${config.entityNameLower} schema (all fields optional)
export const update${config.entityName}Schema = z.object({
  ${validationSchema.replace(/,$/gm, '.optional(),').replace(/\.optional\(\)\.optional\(\)/g, '.optional()')}
});

${relationFields.length > 0 ? `
// Relation validation schemas
${relationFields
  .filter(f => f.relation?.type === 'belongsTo')
  .map(f => `
export const ${f.relation!.foreignKey}Schema = z.object({
  ${f.relation!.foreignKey}: z.number().int().positive('${f.relation!.entity} is required'),
});`)
  .join('')}

${relationFields
  .filter(f => f.relation?.type === 'manyToMany')
  .map(f => `
export const ${f.name}Schema = z.object({
  ${f.name}: z.array(z.number().int().positive()).min(1, '${f.label} must contain at least one item'),
});`)
  .join('')}` : ''}

// List parameters validation
export const ${config.entityNameLower}ListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(255).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', '${config.nameField}', '${config.codeField}']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  showAll: z.boolean().default(false),
  includeRelations: z.boolean().default(false), // 🆕 Include relations validation
});

// Export parameters validation
export type ${config.entityName}ExportParams = z.infer<typeof ${config.entityNameLower}ListParamsSchema>;

// Import row validation for Excel import with relations
export const import${config.entityName}RowSchema = z.object({
  ${validationSchema}
  rowNumber: z.number().int().positive(),
});

// ID validation
export const ${config.entityNameLower}IdSchema = z.object({
  id: z.string().regex(/^\\d+$/, 'ID must be a valid number').transform(Number),
});

// Validation helper functions
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
}`;
}

/**
 * 🆕 Generate API routes with relations support
 */
function generateAPIRouteContent(config: EntityConfig): string {
  const relationFields = config.fields.filter(f => f.relation);
  
  return `/**
 * ${config.entityName} API Routes with Relations Support
 * Generated by enhanced entity generator script V3
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import {
  create${config.entityName},
  get${config.entityName}sByOwner,
  ${relationFields.length > 0 ? `get${config.entityName}RelationOptions,` : ''}
} from '@/libs/queries/${config.entityNameLower}';
import {
  validateCreate${config.entityName},
  validate${config.entityName}ListParams,
} from '@/libs/validations/${config.entityNameLower}';

// GET /api/${config.entityNamePlural}
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = validate${config.entityName}ListParams({
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 10,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      includeRelations: searchParams.get('includeRelations') === 'true',
    });

    const ${config.entityNamePlural} = await get${config.entityName}sByOwner({
      ...params,
      ownerId: userId,
    });

    // Get total count for pagination
    const total = await get${config.entityName}sByOwner({
      ...params,
      ownerId: userId,
      page: 1,
      limit: 999999,
    });

    return NextResponse.json({
      success: true,
      data: ${config.entityNamePlural},
      pagination: {
        page: params.page,
        limit: params.limit,
        total: total.length,
        hasMore: ${config.entityNamePlural}.length === params.limit,
      },
    });
  } catch (error) {
    console.error('Error fetching ${config.entityNamePlural}:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ${config.entityNamePlural}' },
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
    const validatedData = validateCreate${config.entityName}({
      ...body,
      ownerId: userId,
    });

    const ${config.entityNameLower} = await create${config.entityName}(validatedData);

    return NextResponse.json({
      success: true,
      data: ${config.entityNameLower},
      message: '${config.entityName} created successfully',
    });
  } catch (error) {
    console.error('Error creating ${config.entityNameLower}:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create ${config.entityNameLower}',
        code: 'CREATE_ERROR'
      },
      { status: 400 }
    );
  }
}`;
}

/**
 * 🆕 Generate relation options API route
 */
function generateRelationOptionsRouteContent(config: EntityConfig): string {
  const relationFields = config.fields.filter(f => f.relation);
  
  if (relationFields.length === 0) {
    return '';
  }

  return `/**
 * ${config.entityName} Relation Options API Route
 * Generated by enhanced entity generator script V3
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

/**
 * 🆕 Generate React form component with relations
 */
function generateFormComponentContent(config: EntityConfig): string {
  const relationFields = config.fields.filter(f => f.relation);
  const belongsToFields = relationFields.filter(f => f.relation?.type === 'belongsTo');
  const manyToManyFields = relationFields.filter(f => f.relation?.type === 'manyToMany');
  const regularFields = config.fields.filter(f => !f.relation && f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt');

  return `/**
 * ${config.entityName} Form Component with Relations Support
 * Generated by enhanced entity generator script V3
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
${belongsToFields.length > 0 || manyToManyFields.length > 0 ? `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';` : ''}
${manyToManyFields.length > 0 ? `import { Checkbox } from '@/components/ui/checkbox';` : ''}

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
}

export function ${config.entityName}Form({ ${config.entityNameLower}, onSubmit, isLoading }: ${config.entityName}FormProps) {
  ${relationFields.length > 0 ? `const [relationOptions, setRelationOptions] = useState<${config.entityName}RelationOptions>({
    ${relationFields
      .filter(f => f.relation?.type === 'belongsTo' || f.relation?.type === 'manyToMany')
      .map(f => `${f.relation!.entityLower}s: []`)
      .join(',\n    ')}
  });` : ''}

  const form = useForm<${config.entityName}FormData>({
    resolver: zodResolver(${config.entityNameLower}FormSchema),
    defaultValues: {
      ${regularFields.map(field => {
        if (field.type === 'boolean') {
          return `${field.name}: ${config.entityNameLower}?.${field.name} ?? false,`;
        } else if (field.type === 'number') {
          return `${field.name}: ${config.entityNameLower}?.${field.name} ?? 0,`;
        } else if (field.type === 'date') {
          return `${field.name}: ${config.entityNameLower}?.${field.name} ? new Date(${config.entityNameLower}.${field.name}).toISOString().split('T')[0] : '',`;
        } else {
          return `${field.name}: ${config.entityNameLower}?.${field.name} ?? '',`;
        }
      }).join('\n      ')}
      ${belongsToFields.map(field => 
        `${field.relation!.foreignKey}: ${config.entityNameLower}?.${field.relation!.foreignKey} ?? undefined,`
      ).join('\n      ')}
      ${manyToManyFields.map(field => 
        `${field.name}: ${config.entityNameLower}?.${field.relation!.entityLower}s?.map(rel => rel.id) ?? [],`
      ).join('\n      ')}
    },
  });

  ${relationFields.length > 0 ? `
  // Load relation options
  useEffect(() => {
    const loadRelationOptions = async () => {
      try {
        const response = await fetch('/api/${config.entityNamePlural}/relations/options');
        if (response.ok) {
          const data = await response.json();
          setRelationOptions(data.data);
        }
      } catch (error) {
        console.error('Failed to load relation options:', error);
      }
    };

    loadRelationOptions();
  }, []);` : ''}

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Regular Fields */}
          ${regularFields.map(field => {
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
                <FormControl>
                  <Input
                    type="date"
                    {...formField}
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
                    onChange={(e) => formField.onChange(Number(e.target.value))}
                  />
                </FormControl>
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

          {/* BelongsTo Relation Fields */}
          ${belongsToFields.map(field => `
          <FormField
            control={form.control}
            name="${field.relation!.foreignKey}"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>${field.label}</FormLabel>
                <Select 
                  onValueChange={(value) => formField.onChange(Number(value))}
                  value={formField.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ${field.label}" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationOptions.${field.relation!.entityLower}s?.map((option) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.${field.relation!.displayField}}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />`).join('\n')}
        </div>

        {/* Many-to-Many Relation Fields */}
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

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : ${config.entityNameLower} ? 'Update ${config.entityName}' : 'Create ${config.entityName}'}
          </Button>
        </div>
      </form>
    </Form>
  );
}`;
}

/**
 * Enhanced file generation with better error handling and relations support
 */
function generateFile(sourcePath: string, targetPath: string, config: EntityConfig): void {
  try {
    // Special handling for schema files
    if (targetPath.includes('models/Schema') && targetPath.endsWith('.ts')) {
      const generatedContent = generateSchemaWithRelations(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Schema with Relations): ${targetPath}`);
      return;
    }

    // Special handling for types files
    if (targetPath.includes('/types/') && targetPath.endsWith('.ts')) {
      const generatedContent = generateCompleteTypesContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Complete Types with Relations): ${targetPath}`);
      return;
    }

    // Special handling for queries files
    if (targetPath.includes('queries/') && targetPath.endsWith('.ts')) {
      const generatedContent = generateQueriesContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Complete Queries with Relations): ${targetPath}`);
      return;
    }

    // Special handling for validation files
    if (targetPath.includes('validations/') && targetPath.endsWith('.ts')) {
      const generatedContent = generateValidationContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Complete Validation with Relations): ${targetPath}`);
      return;
    }

    // Special handling for API routes
    if (targetPath.includes('/api/') && targetPath.endsWith('route.ts') && !targetPath.includes('relations')) {
      const generatedContent = generateAPIRouteContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (API Route with Relations): ${targetPath}`);
      return;
    }

    // Special handling for relation options API route
    if (targetPath.includes('/relations/options/route.ts')) {
      const generatedContent = generateRelationOptionsRouteContent(config);
      if (generatedContent) {
        writeFileToPath(targetPath, generatedContent);
        console.log(`✅ Generated (Relation Options API): ${targetPath}`);
      }
      return;
    }

    // Special handling for form components
    if (targetPath.includes('Form.tsx')) {
      const generatedContent = generateFormComponentContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Form Component with Relations): ${targetPath}`);
      return;
    }

    // Handle other files with template replacement
    if (!existsSync(sourcePath)) {
      console.warn(`⚠️  Source file not found: ${sourcePath}`);
      return;
    }

    const sourceContent = readFileSync(sourcePath, 'utf-8');
    const generatedContent = replaceTemplateVars(sourceContent, config);
    writeFileToPath(targetPath, generatedContent);
    console.log(`✅ Generated: ${targetPath}`);
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
 * Basic template replacement for other files
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

/**
 * Main function with enhanced error prevention and relations support
 */
function main() {
  const args = process.argv.slice(2);
  const entityName = args[0];

  if (!entityName) {
    console.error('❌ Please provide entity name');
    console.log('Usage: npx ts-node scripts/enhanced-generate-advanced-entity-V3-with-relations.ts [entityName]');
    console.log('Example: npx ts-node scripts/enhanced-generate-advanced-entity-V3-with-relations.ts plan');
    process.exit(1);
  }

  let config: EntityConfig;
  if (entityName.toLowerCase() === 'plan' || entityName.toLowerCase() === 'plans') {
    config = planConfigWithRelations;
  } else {
    // Use plan config as template for other entities
    config = {
      ...planConfigWithRelations,
      entityName: capitalizeFirst(entityName),
      entityNameLower: entityName.toLowerCase(),
      entityNamePlural: `${entityName.toLowerCase()}s`,
      tableName: entityName.toLowerCase(),
    };
  }

  console.log(`🚀 Generating ${config.entityName} entity with Relations Support...`);

  // Enhanced file mappings with relations support
  const fileMappings = [
    // Core files - generate from scratch with relations
    ['', `src/models/Schema/${config.entityNameLower}.ts`], // 🆕 Schema with relations
    ['', `src/types/${config.entityNameLower}.ts`],
    ['', `src/libs/queries/${config.entityNameLower}.ts`],
    ['', `src/libs/validations/${config.entityNameLower}.ts`],

    // API routes with relations support
    ['', `src/app/api/${config.entityNamePlural}/route.ts`],
    ['', `src/app/api/${config.entityNamePlural}/[id]/route.ts`],
    ['', `src/app/api/${config.entityNamePlural}/stats/route.ts`],
    ['', `src/app/api/${config.entityNamePlural}/export/route.ts`],
    ['', `src/app/api/${config.entityNamePlural}/import/route.ts`],
    
    // 🆕 Relations API routes
    ['', `src/app/api/${config.entityNamePlural}/relations/options/route.ts`],
    ['', `src/app/api/${config.entityNamePlural}/[id]/relations/route.ts`],

    // React components with relations support
    ['', `src/features/${config.entityNameLower}/${config.entityName}Form.tsx`], // 🆕 Form with relations
    ['src/features/product/ProductList.tsx', `src/features/${config.entityNameLower}/${config.entityName}List.tsx`],
    ['src/features/product/ProductSkeleton.tsx', `src/features/${config.entityNameLower}/${config.entityName}Skeleton.tsx`],
    ['src/features/product/ProductImportModal.tsx', `src/features/${config.entityNameLower}/${config.entityName}ImportModal.tsx`],

    // Hooks with relations support
    ['src/hooks/useProducts.ts', `src/hooks/use${config.entityName}s.ts`],
    ['src/hooks/useProductMutations.ts', `src/hooks/use${config.entityName}Mutations.ts`],
    ['src/hooks/useProductFilters.ts', `src/hooks/use${config.entityName}Filters.ts`],
    ['src/hooks/useProductExport.ts', `src/hooks/use${config.entityName}Export.ts`],
    ['src/hooks/useProductImport.ts', `src/hooks/use${config.entityName}Import.ts`],

    // 🆕 Relations-specific hooks
    ['', `src/hooks/use${config.entityName}Relations.ts`],

    // Pages
    ['src/app/[locale]/(auth)/dashboard/products/page.tsx', `src/app/[locale]/(auth)/dashboard/${config.entityNamePlural}/page.tsx`],
  ];

  // Generate all files
  fileMappings.forEach(([source, target]) => {
    generateFile(source, target, config);
  });

  console.log(`\n🎉 ${config.entityName} entity generated successfully with Relations Support!`);
  console.log('\n📋 Enhanced Features V3:');
  console.log('✅ Full Database Relationships Support (belongsTo, hasMany, manyToMany)');
  console.log('✅ Foreign Key Constraints with proper cascade handling');
  console.log('✅ Junction Tables for many-to-many relationships');
  console.log('✅ Type-safe relation queries with Drizzle ORM');
  console.log('✅ Relation validation and form components');
  console.log('✅ Excel import/export with relation mapping');
  console.log('✅ API endpoints for relation options');
  console.log('✅ Enhanced error prevention and type safety');
  console.log('✅ Comprehensive TypeScript types with relations');
  
  console.log('\n📋 Relations Generated:');
  const relationFields = config.fields.filter(f => f.relation);
  relationFields.forEach(field => {
    const rel = field.relation!;
    console.log(`✅ ${rel.type}: ${config.entityName} -> ${rel.entity} (${rel.displayField})`);
  });

  console.log('\n📋 Next steps:');
  console.log('1. Update src/models/Schema.ts to export new schemas');
  console.log('2. Run database migration if needed');
  console.log('3. Run type check: npm run type-check');
  console.log('4. Test the generated entity with relations');
  console.log('5. Customize relation validation rules if needed');
}

if (require.main === module) {
  main();
}