#!/usr/bin/env node

/**
 * Enhanced Advanced Entity Generator Script - Error Prevention Version
 * Creates complete CRUD entity with Excel import/export capabilities
 * Enhanced to prevent common TypeScript and runtime errors
 *
 * Usage: npx ts-node scripts/generate-advanced-entity.ts [entityName]
 * Example: npx ts-node scripts/generate-advanced-entity.ts plan
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type FieldConfig = {
  name: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'decimal';
  required: boolean;
  unique?: boolean;
  maxLength?: number;
  label: string;
  excelColumn?: string;
  dbColumnType?: 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'timestamp'; // For proper DB mapping
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
  };
  uiType: 'table' | 'cards';
};

// Enhanced Plan configuration with proper DB column types
const planConfig: EntityConfig = {
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
  },
  uiType: 'table',
};

/**
 * Generate database insert values with proper type handling and date conversion
 */
function generateInsertValues(config: EntityConfig): string {
  return config.fields
    .filter(f => f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map((field) => {
      if (field.type === 'date') {
        return `${field.name}: data.${field.name} ? new Date(data.${field.name}) : null`;
      }
      return `${field.name}: data.${field.name}`;
    })
    .join(',\n      ');
}

/**
 * Generate database update values with proper date handling
 */
function generateUpdateValues(config: EntityConfig): string {
  const updateFields = config.fields
    .filter(f => f.name !== 'id' && f.name !== 'ownerId' && f.name !== 'createdAt' && f.name !== 'updatedAt');

  const conditionalUpdates = updateFields.map((field) => {
    if (field.type === 'date') {
      return `
  if (data.${field.name} !== undefined) {
    updateData.${field.name} = data.${field.name} ? new Date(data.${field.name}) : null;
  } else {
    updateData.${field.name} = existingEntity.${field.name};
  }`;
    }
    return `
  if (data.${field.name} !== undefined) {
    updateData.${field.name} = data.${field.name};
  } else {
    updateData.${field.name} = existingEntity.${field.name};
  }`;
  }).join('');

  return conditionalUpdates;
}

/**
 * Generate proper validation schema with enhanced date and number validation
 */
function generateValidationSchema(config: EntityConfig): string {
  return config.fields
    .filter(f => f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map((field) => {
      let validation = `${field.name}: `;

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
 * Generate TypeScript types with proper optional handling
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
 * Generate Excel helper functions
 */
function generateExcelHelpers(config: EntityConfig): string {
  const entityName = config.entityName;
  const entityNameLower = config.entityNameLower;
  const entityNamePlural = config.entityNamePlural;

  const excelMapping = config.fields
    .filter(f => f.excelColumn && f.name !== 'ownerId')
    .map((field) => {
      if (field.type === 'date') {
        return `    '${field.excelColumn}': ${entityNameLower}.${field.name} ? formatDateForExcel(${entityNameLower}.${field.name}) : '',`;
      }
      return `    '${field.excelColumn}': ${entityNameLower}.${field.name} || '',`;
    })
    .join('\n');

  return `import type { ${entityName} } from '@/types/${entityNameLower}';
import * as XLSX from 'xlsx';

/**
 * Generate ${entityName} Excel file
 */
export function generate${entityNamePlural}Excel(${entityNamePlural}: readonly ${entityName}[]): Buffer {
  const workbook = XLSX.utils.book_new();
  
  const excelData = ${entityNamePlural}.map(${entityNameLower} => ({
${excelMapping}
    'Created Date': formatDateForExcel(${entityNameLower}.createdAt),
    'Updated Date': formatDateForExcel(${entityNameLower}.updatedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  const columnWidths = [
    { wch: 15 }, // Code
    { wch: 30 }, // Name
    { wch: 12 }, // Year
    { wch: 10 }, // Month
    { wch: 20 }, // Target Qty
    { wch: 20 }, // Actual Qty
    { wch: 15 }, // Status
    { wch: 15 }, // Start Date
    { wch: 15 }, // End Date
    { wch: 20 }, // Approved By
    { wch: 15 }, // Approved At
    { wch: 30 }, // Note
    { wch: 20 }, // Created
    { wch: 20 }, // Updated
  ];
  worksheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, '${entityNamePlural}');
  
  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    compression: true,
  });
}

/**
 * Validate ${entityNamePlural} export data
 */
export function validate${entityNamePlural}ExportData(${entityNamePlural}: readonly ${entityName}[]): {
  isValid: boolean;
  error?: string;
} {
  if (!Array.isArray(${entityNamePlural})) {
    return { isValid: false, error: '${entityNamePlural} must be an array' };
  }

  if (${entityNamePlural}.length === 0) {
    return { isValid: false, error: 'No ${entityNamePlural} to export' };
  }

  if (${entityNamePlural}.length > 5000) {
    return { isValid: false, error: 'Too many ${entityNamePlural} to export (maximum 5000)' };
  }

  const invalid${entityNamePlural} = ${entityNamePlural}.filter(
    ${entityNameLower} => !${entityNameLower}.${config.codeField} || !${entityNameLower}.${config.nameField}${config.fields.some(f => f.required && f.name !== config.codeField && f.name !== config.nameField && f.name !== 'ownerId') ? ` || ${config.fields.filter(f => f.required && f.name !== config.codeField && f.name !== config.nameField && f.name !== 'ownerId').map(f => `!${entityNameLower}.${f.name}`).join(' || ')}` : ''},
  );

  if (invalid${entityNamePlural}.length > 0) {
    return {
      isValid: false,
      error: \`\${invalid${entityNamePlural}.length} ${entityNameLower}(s) missing required fields\`,
    };
  }

  return { isValid: true };
}`;
}

/**
 * Generate complete types file content with proper error prevention
 */
function generateCompleteTypesContent(config: EntityConfig): string {
  const formDataFields = generateTypeFields(config, false, false);
  const createInputFields = generateTypeFields(config, false, false);
  const updateInputFields = generateTypeFields(config, false, false, true); // All optional for update

  return `/**
 * ${config.entityName}-related TypeScript types and interfaces
 * Enhanced version with proper error handling and type safety
 * Generated by enhanced entity generator script
 */

import type { ${config.entityNameLower}Schema } from '@/models/Schema';

// Infer the ${config.entityName}Db type from Drizzle schema
export type ${config.entityName}Db = typeof ${config.entityNameLower}Schema.$inferSelect;

// Client-side ${config.entityName} type with proper date handling
export type ${config.entityName} = Omit<${config.entityName}Db, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

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

// API Response types
export type ${config.entityName}Response = {
  readonly success: true;
  readonly data: ${config.entityName};
  readonly message?: string;
};

export type ${config.entityName}sResponse = {
  readonly success: true;
  readonly data: readonly ${config.entityName}[];
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
 * Generate database queries with enhanced error handling
 */
function generateQueriesContent(config: EntityConfig): string {
  const insertValues = generateInsertValues(config);
  const updateLogic = generateUpdateValues(config);

  return `/**
 * ${config.entityName} database queries using Drizzle ORM
 * Enhanced version with proper error handling and type safety
 * Generated by enhanced entity generator script
 */

import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { ${config.entityNameLower}Schema } from '@/models/Schema';
import type {
  Create${config.entityName}Input,
  ${config.entityName}Db,
  ${config.entityName}ListParamsWithOwner,
  ${config.entityName}Stats,
  Update${config.entityName}Input,
} from '@/types/${config.entityNameLower}';

/**
 * Create a new ${config.entityNameLower} with proper date handling
 */
export async function create${config.entityName}(data: Create${config.entityName}Input): Promise<${config.entityName}Db> {
  const [${config.entityNameLower}] = await db
    .insert(${config.entityNameLower}Schema)
    .values({
      ${insertValues}
    } as any) // Type assertion to handle Drizzle ORM type inference limitations
    .returning();

  if (!${config.entityNameLower}) {
    throw new Error('Failed to create ${config.entityNameLower}');
  }

  return ${config.entityNameLower};
}

/**
 * Get ${config.entityNamePlural} by owner with enhanced filtering
 */
export async function get${config.entityName}sByOwner(params: ${config.entityName}ListParamsWithOwner): Promise<${config.entityName}Db[]> {
  const {
    ownerId,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  const offset = (page - 1) * limit;

  // Build where conditions safely
  let whereConditions = eq(${config.entityNameLower}Schema.ownerId, ownerId);

  if (search) {
    const searchTerm = \`%\${search}%\`;
    const searchCondition = or(
      ilike(${config.entityNameLower}Schema.${config.codeField}, searchTerm),
      ilike(${config.entityNameLower}Schema.${config.nameField}, searchTerm)
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

  return db
    .select()
    .from(${config.entityNameLower}Schema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get ${config.entityNameLower} by ID with ownership check
 */
export async function get${config.entityName}ById(id: number, ownerId: string): Promise<${config.entityName}Db | undefined> {
  const [${config.entityNameLower}] = await db
    .select()
    .from(${config.entityNameLower}Schema)
    .where(and(eq(${config.entityNameLower}Schema.id, id), eq(${config.entityNameLower}Schema.ownerId, ownerId)))
    .limit(1);

  return ${config.entityNameLower};
}

/**
 * Update ${config.entityNameLower} with proper date handling and type safety
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

  // Build update data with proper type handling
  const updateData: Record<string, unknown> = {};
  ${updateLogic}

  const [updated${config.entityName}] = await db
    .update(${config.entityNameLower}Schema)
    .set(updateData as any) // Type assertion for Drizzle ORM compatibility
    .where(and(eq(${config.entityNameLower}Schema.id, id), eq(${config.entityNameLower}Schema.ownerId, ownerId)))
    .returning();

  if (!updated${config.entityName}) {
    throw new Error('Failed to update ${config.entityNameLower}');
  }

  return updated${config.entityName};
}

/**
 * Delete ${config.entityNameLower} with ownership check
 */
export async function delete${config.entityName}(id: number, ownerId: string): Promise<void> {
  const result = await db
    .delete(${config.entityNameLower}Schema)
    .where(and(eq(${config.entityNameLower}Schema.id, id), eq(${config.entityNameLower}Schema.ownerId, ownerId)));

  if (result.rowCount === 0) {
    throw new Error('${config.entityName} not found or access denied');
  }
}

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
 * Generate validation file content
 */
function generateValidationContent(config: EntityConfig): string {
  const validationSchema = generateValidationSchema(config);

  return `/**
 * ${config.entityName} validation schemas
 * Enhanced version with proper error handling and type safety
 * Generated by enhanced entity generator script
 */

import { z } from 'zod';

// Form validation schema
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

// List parameters validation
export const ${config.entityNameLower}ListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(255).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', '${config.nameField}', '${config.codeField}']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  showAll: z.boolean().default(false),
});

// Export parameters validation
export type ${config.entityName}ExportParams = z.infer<typeof ${config.entityNameLower}ListParamsSchema>;

// Import row validation for Excel import
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
 * Enhanced file generation with better error handling
 */
function generateFile(sourcePath: string, targetPath: string, config: EntityConfig): void {
  try {
    // Special handling for types files
    if (targetPath.includes('/types/') && targetPath.endsWith('.ts')) {
      const generatedContent = generateCompleteTypesContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Complete Types): ${targetPath}`);
      return;
    }

    // Special handling for queries files
    if (targetPath.includes('queries/') && targetPath.endsWith('.ts')) {
      const generatedContent = generateQueriesContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Complete Queries): ${targetPath}`);
      return;
    }

    // Special handling for validation files
    if (targetPath.includes('validations/') && targetPath.endsWith('.ts')) {
      const generatedContent = generateValidationContent(config);
      writeFileToPath(targetPath, generatedContent);
      console.log(`✅ Generated (Complete Validation): ${targetPath}`);
      return;
    }

    // Special handling for Excel helpers
    if (targetPath.includes('excelHelpers.ts')) {
      const existingContent = readFileSync(targetPath, 'utf-8');
      const newFunctions = generateExcelHelpers(config);
      const updatedContent = `${existingContent}\n\n${newFunctions}`;
      writeFileToPath(targetPath, updatedContent);
      console.log(`✅ Updated (Excel Helpers): ${targetPath}`);
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
 * Main function with enhanced error prevention
 */
function main() {
  const args = process.argv.slice(2);
  const entityName = args[0];

  if (!entityName) {
    console.error('❌ Please provide entity name');
    console.log('Usage: npx ts-node scripts/generate-advanced-entity.ts [entityName]');
    console.log('Example: npx ts-node scripts/generate-advanced-entity.ts plan');
    process.exit(1);
  }

  let config: EntityConfig;
  if (entityName.toLowerCase() === 'plan' || entityName.toLowerCase() === 'plans') {
    config = planConfig;
  } else {
    // Use plan config as template for other entities
    config = {
      ...planConfig,
      entityName: capitalizeFirst(entityName),
      entityNameLower: entityName.toLowerCase(),
      entityNamePlural: `${entityName.toLowerCase()}s`,
      tableName: entityName.toLowerCase(),
    };
  }

  console.log(`🚀 Generating ${config.entityName} entity with enhanced error prevention...`);

  // Enhanced file mappings with error prevention
  const fileMappings = [
    // Core files - generate from scratch
    ['', `src/types/${config.entityNameLower}.ts`],
    ['', `src/libs/queries/${config.entityNameLower}.ts`],
    ['', `src/libs/validations/${config.entityNameLower}.ts`],

    // Template-based files
    ['src/libs/api/products.ts', `src/libs/api/${config.entityNamePlural}.ts`],
    ['src/hooks/useProducts.ts', `src/hooks/use${config.entityName}s.ts`],
    ['src/hooks/useProductMutations.ts', `src/hooks/use${config.entityName}Mutations.ts`],
    ['src/hooks/useProductFilters.ts', `src/hooks/use${config.entityName}Filters.ts`],
    ['src/hooks/useProductExport.ts', `src/hooks/use${config.entityName}Export.ts`],
    ['src/hooks/useProductImport.ts', `src/hooks/use${config.entityName}Import.ts`],

    // Components
    ['src/features/product/ProductForm.tsx', `src/features/${config.entityNameLower}/${config.entityName}Form.tsx`],
    ['src/features/product/ProductList.tsx', `src/features/${config.entityNameLower}/${config.entityName}List.tsx`],
    ['src/features/product/ProductSkeleton.tsx', `src/features/${config.entityNameLower}/${config.entityName}Skeleton.tsx`],
    ['src/features/product/ProductImportModal.tsx', `src/features/${config.entityNameLower}/${config.entityName}ImportModal.tsx`],

    // API routes
    ['src/app/api/products/route.ts', `src/app/api/${config.entityNamePlural}/route.ts`],
    ['src/app/api/products/[id]/route.ts', `src/app/api/${config.entityNamePlural}/[id]/route.ts`],
    ['src/app/api/products/stats/route.ts', `src/app/api/${config.entityNamePlural}/stats/route.ts`],
    ['src/app/api/products/export/route.ts', `src/app/api/${config.entityNamePlural}/export/route.ts`],
    ['src/app/api/products/import/route.ts', `src/app/api/${config.entityNamePlural}/import/route.ts`],

    // Pages
    ['src/app/[locale]/(auth)/dashboard/products/page.tsx', `src/app/[locale]/(auth)/dashboard/${config.entityNamePlural}/page.tsx`],
  ];

  // Generate all files
  fileMappings.forEach(([source, target]) => {
    generateFile(source, target, config);
  });

  // Update Excel helpers
  const excelHelpersPath = 'src/utils/excelHelpers.ts';
  if (existsSync(excelHelpersPath)) {
    generateFile('', excelHelpersPath, config);
  }

  console.log(`\n🎉 ${config.entityName} entity generated successfully with error prevention!`);
  console.log('\n📋 Enhanced Features:');
  console.log('✅ Proper date handling (prevents runtime errors)');
  console.log('✅ Type-safe database queries with Drizzle ORM compatibility');
  console.log('✅ Enhanced validation schemas');
  console.log('✅ Excel import/export functions generated');
  console.log('✅ Error-resistant API routes');
  console.log('✅ Comprehensive TypeScript types');
  console.log('\n📋 Next steps:');
  console.log('1. Update src/models/Schema.ts if needed');
  console.log('2. Run type check: npm run type-check');
  console.log('3. Test the generated entity');
}

if (require.main === module) {
  main();
}
