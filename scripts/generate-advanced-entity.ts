#!/usr/bin/env node

/**
 * Advanced Entity Generator Script - Based on Products Pattern
 * Creates complete CRUD entity with Excel import/export capabilities
 * Usage: npx ts-node scripts/generate-advanced-entity.ts [entityName]
 *
 * Example: npx ts-node scripts/generate-advanced-entity.ts tasks
 * This will create Tasks entity with all advanced features
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
  excelColumn?: string; // For Excel import/export
};

type EntityConfig = {
  entityName: string; // 'Task'
  entityNameLower: string; // 'task'
  entityNamePlural: string; // 'tasks'
  tableName: string; // 'task'
  codeField: string; // 'taskCode' (unique identifier field)
  nameField: string; // 'taskName' (display name field)
  fields: FieldConfig[];
  features: {
    pagination: boolean;
    search: boolean;
    sorting: boolean;
    stats: boolean;
    excelImport: boolean;
    excelExport: boolean;
    uniqueCode: boolean; // Whether to enforce unique code per owner
    batchOperations: boolean;
  };
  uiType: 'table' | 'cards'; // UI display type
};

// Example: Tasks configuration based on Products pattern
const tasksConfig: EntityConfig = {
  entityName: 'Task',
  entityNameLower: 'task',
  entityNamePlural: 'tasks',
  tableName: 'task',
  codeField: 'taskCode',
  nameField: 'taskName',
  fields: [
    {
      name: 'taskCode',
      type: 'string',
      required: true,
      unique: true,
      maxLength: 50,
      label: 'Task Code',
      excelColumn: 'Task Code',
    },
    {
      name: 'taskName',
      type: 'string',
      required: true,
      maxLength: 255,
      label: 'Task Name',
      excelColumn: 'Task Name',
    },
    {
      name: 'description',
      type: 'text',
      required: false,
      label: 'Description',
      excelColumn: 'Description',
    },
    {
      name: 'priority',
      type: 'string',
      required: false,
      maxLength: 20,
      label: 'Priority',
      excelColumn: 'Priority',
    },
    {
      name: 'status',
      type: 'string',
      required: false,
      maxLength: 20,
      label: 'Status',
      excelColumn: 'Status',
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

// ProductSub configuration based on Schema.ts
const productSubConfig: EntityConfig = {
  entityName: 'ProductSub',
  entityNameLower: 'productsub',
  entityNamePlural: 'productsubs',
  tableName: 'product_sub',
  codeField: 'productSubCode',
  nameField: 'productSubDetail',
  fields: [
    { name: 'productSubCode', type: 'string', required: true, unique: true, maxLength: 50, label: 'Product Sub Code', excelColumn: 'Product Sub Code' },
    { name: 'productSubDetail', type: 'string', required: true, maxLength: 255, label: 'Product Sub Detail', excelColumn: 'Product Sub Detail' },
    { name: 'subCategory', type: 'string', required: true, maxLength: 50, label: 'Sub Category', excelColumn: 'Sub Category' },
    { name: 'colorCode', type: 'string', required: false, maxLength: 50, label: 'Color Code', excelColumn: 'Color Code' },
    { name: 'barcode', type: 'string', required: false, maxLength: 100, label: 'Barcode', excelColumn: 'Barcode' },
    { name: 'description', type: 'text', required: false, label: 'Description', excelColumn: 'Description' },
    { name: 'note', type: 'text', required: false, label: 'Note', excelColumn: 'Note' },
    { name: 'productId', type: 'number', required: true, label: 'Product ID', excelColumn: 'Product ID' },
    { name: 'productCode', type: 'string', required: true, maxLength: 50, label: 'Product Code', excelColumn: 'Product Code' },
    { name: 'ownerId', type: 'string', required: true, maxLength: 50, label: 'Owner ID', excelColumn: 'Owner ID' },
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

// Process configuration based on Schema.ts
const processConfig: EntityConfig = {
  entityName: 'Process',
  entityNameLower: 'process',
  entityNamePlural: 'processes',
  tableName: 'process',
  codeField: 'processCode',
  nameField: 'processName',
  fields: [
    { name: 'processCode', type: 'string', required: true, unique: true, maxLength: 50, label: 'Process Code', excelColumn: 'Process Code' },
    { name: 'processName', type: 'string', required: true, maxLength: 255, label: 'Process Name', excelColumn: 'Process Name' },
    { name: 'processCategory', type: 'string', required: false, maxLength: 50, label: 'Process Category', excelColumn: 'Process Category' },
    { name: 'processType', type: 'string', required: false, maxLength: 50, label: 'Process Type', excelColumn: 'Process Type' },
    { name: 'department', type: 'string', required: false, maxLength: 50, label: 'Department', excelColumn: 'Department' },
    { name: 'description', type: 'text', required: false, label: 'Description', excelColumn: 'Description' },
    { name: 'ownerId', type: 'string', required: true, maxLength: 50, label: 'Owner ID', excelColumn: 'Owner ID' },
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

// UserSync configuration based on Schema.ts
const userSyncConfig: EntityConfig = {
  entityName: 'UserSync',
  entityNameLower: 'user_sync',
  entityNamePlural: 'user_syncs',
  tableName: 'user_sync',
  codeField: 'userId',
  nameField: 'email',
  fields: [
    { name: 'userId', type: 'string', required: true, unique: true, maxLength: 50, label: 'User ID', excelColumn: 'User ID' },
    { name: 'email', type: 'string', required: true, maxLength: 255, label: 'Email', excelColumn: 'Email' },
    { name: 'fullName', type: 'string', required: false, maxLength: 255, label: 'Full Name', excelColumn: 'Full Name' },
    { name: 'avatarUrl', type: 'string', required: false, maxLength: 255, label: 'Avatar URL', excelColumn: 'Avatar URL' },
    { name: 'role', type: 'string', required: false, maxLength: 50, label: 'Role', excelColumn: 'Role' },
    { name: 'organizationRole', type: 'string', required: false, maxLength: 50, label: 'Organization Role', excelColumn: 'Organization Role' },
    { name: 'isActive', type: 'boolean', required: false, label: 'Is Active', excelColumn: 'Is Active' },
    { name: 'createdAt', type: 'date', required: true, label: 'Created At', excelColumn: 'Created At' },
    { name: 'updatedAt', type: 'date', required: true, label: 'Updated At', excelColumn: 'Updated At' },
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

// Plan configuration based on Schema.ts
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
    },
    {
      name: 'planName',
      type: 'string',
      required: true,
      maxLength: 255,
      label: 'Plan Name',
      excelColumn: 'Plan Name',
    },
    {
      name: 'planYear',
      type: 'number',
      required: true,
      label: 'Plan Year',
      excelColumn: 'Plan Year',
    },
    {
      name: 'planMonth',
      type: 'number',
      required: true,
      label: 'Plan Month',
      excelColumn: 'Plan Month',
    },
    {
      name: 'totalTargetQuantity',
      type: 'number',
      required: false,
      label: 'Total Target Quantity',
      excelColumn: 'Total Target Quantity',
    },
    {
      name: 'totalActualQuantity',
      type: 'number',
      required: false,
      label: 'Total Actual Quantity',
      excelColumn: 'Total Actual Quantity',
    },
    {
      name: 'status',
      type: 'string',
      required: false,
      maxLength: 50,
      label: 'Status',
      excelColumn: 'Status',
    },
    {
      name: 'planStartDate',
      type: 'date',
      required: false,
      label: 'Plan Start Date',
      excelColumn: 'Plan Start Date',
    },
    {
      name: 'planEndDate',
      type: 'date',
      required: false,
      label: 'Plan End Date',
      excelColumn: 'Plan End Date',
    },
    {
      name: 'approvedBy',
      type: 'string',
      required: false,
      maxLength: 255,
      label: 'Approved By',
      excelColumn: 'Approved By',
    },
    {
      name: 'approvedAt',
      type: 'date',
      required: false,
      label: 'Approved At',
      excelColumn: 'Approved At',
    },
    {
      name: 'note',
      type: 'text',
      required: false,
      label: 'Note',
      excelColumn: 'Note',
    },
    {
      name: 'ownerId',
      type: 'string',
      required: true,
      maxLength: 50,
      label: 'Owner ID',
      excelColumn: 'Owner ID',
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
 * Advanced template replacement with Products patterns
 */
function replaceAdvancedTemplateVars(content: string, config: EntityConfig): string {
  let result = content;

  // Basic entity name replacements
  result = result
    .replace(/product/g, config.entityNameLower)
    .replace(/Product/g, config.entityName)
    .replace(/products/g, config.entityNamePlural)
    .replace(/Products/g, `${config.entityName}s`);

  // Field-specific replacements
  result = result
    .replace(/productCode/g, config.codeField)
    .replace(/ProductCode/g, capitalizeFirst(config.codeField))
    .replace(/productName/g, config.nameField)
    .replace(/ProductName/g, capitalizeFirst(config.nameField));

  // Schema field replacements
  const schemaFields = generateSchemaFields(config);
  result = result.replace(
    /productCode: text\('product_code'\)\.notNull\(\),\s*productName: text\('product_name'\)\.notNull\(\),\s*notes: text\('notes'\),\s*category: text\('category'\),/g,
    schemaFields,
  );

  // Validation schema replacements - Multiple patterns for different templates
  const validationFields = generateValidationFields(config);

  // Pattern 1: Original Product pattern
  result = result.replace(
    /productCode: z\.string\(\)\.min\(1, '[^']*'\)\.max\(\d+, '[^']*'\),\s*productName: z\.string\(\)\.min\(1, '[^']*'\)\.max\(\d+, '[^']*'\),\s*notes: z\.string\(\)\.max\(\d+, '[^']*'\)\.optional\(\),\s*category: z\.string\(\)\.max\(\d+, '[^']*'\)\.optional\(\),/g,
    validationFields,
  );

  // Pattern 2: Plan pattern (after simple replacement)
  result = result.replace(
    /planCode: z\.string\(\)[^,]*,\s*planName: z\.string\(\)[^,]*,\s*category: z\.string\(\)[^,]*,\s*notes: z\.string\(\)[^,]*/g,
    validationFields,
  );

  // Pattern 3: Generic entity validation block replacement
  const entityLower = config.entityNameLower;
  const codeField = config.codeField;
  const nameField = config.nameField;
  const genericPattern = new RegExp(
    `${codeField}: z\\.string\\(\\)[^,]*,\\s*${nameField}: z\\.string\\(\\)[^,]*,\\s*[^}]*`,
    'g',
  );
  result = result.replace(genericPattern, validationFields);

  // Excel column mappings - Multiple patterns
  const excelColumns = generateExcelColumns(config);

  // Pattern 1: Original Product pattern
  result = result.replace(
    /'Product Code': product\.productCode,\s*'Product Name': product\.productName,\s*'Category': product\.category \|\| '',\s*'Notes': product\.notes \|\| '',/g,
    excelColumns,
  );

  // Pattern 2: After entity replacement
  const entityName = config.entityNameLower;
  const productPattern = new RegExp(
    `'[^']*Code': ${entityName}\\.[^,]*,\\s*'[^']*Name': ${entityName}\\.[^,]*,\\s*[^}]*`,
    'g',
  );
  result = result.replace(productPattern, excelColumns);

  // Search field replacements for multi-field search - Multiple patterns
  const searchFields = generateSearchFields(config);

  // Pattern 1: Original Product pattern
  result = result.replace(
    /ilike\(productSchema\.productCode, searchTerm\),\s*ilike\(productSchema\.productName, searchTerm\),\s*ilike\(productSchema\.category, searchTerm\),\s*ilike\(productSchema\.notes, searchTerm\)/g,
    searchFields,
  );

  // Pattern 2: After entity replacement
  const schemaName = `${config.entityNameLower}Schema`;
  const searchPattern = new RegExp(
    `ilike\\(${schemaName}\\.[^,]*,\\s*searchTerm\\),\\s*ilike\\(${schemaName}\\.[^,]*,\\s*searchTerm\\)[^)]*`,
    'g',
  );
  result = result.replace(searchPattern, searchFields);

  // Pattern 3: Generic search pattern
  result = result.replace(
    /ilike\([^)]+, searchTerm\),\s*ilike\([^)]+, searchTerm\)[^}]*/g,
    searchFields,
  );

  // Form default values replacement
  // Replace form default values pattern
  const defaultValuesPattern = new RegExp(
    `${codeField}: ${entityLower}\\.${codeField},\\s*${nameField}: ${entityLower}\\.${nameField},\\s*[^}]*`,
    'g',
  );

  const formDefaults = config.fields
    .filter(f => f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map(field => `${field.name}: ${entityLower}.${field.name}${field.required ? '' : ` || ${field.type === 'number' ? '0' : field.type === 'boolean' ? 'false' : '\'\''}`}`)
    .join(',\n          ');

  result = result.replace(defaultValuesPattern, formDefaults);

  // Database insert/update values replacement
  const insertValues = generateInsertValues(config);
  const updateValues = generateUpdateValues(config);

  // Replace insert values pattern
  result = result.replace(
    /ownerId: data\.ownerId,\s*productCode: data\.productCode,\s*productName: data\.productName,\s*category: data\.category,\s*notes: data\.notes,/g,
    insertValues,
  );

  // Replace after entity replacement
  const insertPattern = new RegExp(
    `ownerId: data\\.ownerId,\\s*${config.codeField}: data\\.${config.codeField},\\s*${config.nameField}: data\\.${config.nameField},\\s*[^}]*`,
    'g',
  );
  result = result.replace(insertPattern, insertValues);

  // Replace update values (without ownerId)
  const updatePattern = new RegExp(
    `${config.codeField}: data\\.${config.codeField},\\s*${config.nameField}: data\\.${config.nameField},\\s*[^}]*`,
    'g',
  );
  result = result.replace(updatePattern, updateValues);

  // Type definitions replacement
  const createInputType = generateTypeFields(config, false, true);
  const updateInputType = generateTypeFields(config, false, false);
  const dbType = generateTypeFields(config, true, true);

  // Replace type definitions in types file
  if (result.includes('export type') && result.includes('Input')) {
    // Replace CreateInput type
    result = result.replace(
      /export type Create\w+Input = \{[^}]+\}/g,
      `export type Create${config.entityName}Input = {\n${createInputType}\n}`,
    );

    // Replace UpdateInput type
    result = result.replace(
      /export type Update\w+Input = \{[^}]+\}/g,
      `export type Update${config.entityName}Input = {\n${updateInputType}\n}`,
    );

    // Replace Db type
    result = result.replace(
      /export type \w+Db = \{[^}]+\}/g,
      `export type ${config.entityName}Db = {\n${dbType}\n}`,
    );
  }

  // Replace form data type
  if (result.includes('FormData')) {
    const formDataType = generateTypeFields(config, false, false);
    result = result.replace(
      /export type \w+FormData = \{[^}]+\}/g,
      `export type ${config.entityName}FormData = {\n${formDataType}\n}`,
    );
  }

  // More aggressive type replacement patterns
  // Replace PlanFormData specifically
  result = result.replace(
    /export type PlanFormData = \{\s*planCode: string;\s*planName: string;\s*category\?: string;\s*notes\?: string;\s*\}/g,
    `export type ${config.entityName}FormData = {\n${generateTypeFields(config, false, false)}\n}`,
  );

  // Replace CreatePlanInput specifically
  result = result.replace(
    /export type CreatePlanInput = \{\s*readonly ownerId: string;\s*planCode: string;\s*planName: string;\s*category\?: string;\s*notes\?: string;\s*\}/g,
    `export type Create${config.entityName}Input = {\n  readonly ownerId: string;\n${generateTypeFields(config, false, false)}\n}`,
  );

  // Replace UpdatePlanInput specifically
  result = result.replace(
    /export type UpdatePlanInput = \{\s*planCode\?: string;\s*planName\?: string;\s*category\?: string;\s*notes\?: string;\s*\}/g,
    `export type Update${config.entityName}Input = {\n${generateTypeFields(config, false, false).replace(/: /g, '?: ')}\n}`,
  );

  // Form JSX replacement for React components
  if (result.includes('register(') && result.includes('JSX.Element')) {
    // Replace form default values
    const formDefaults = generateFormDefaultValues(config);
    result = result.replace(
      /planCode: plan\.planCode,\s*planName: plan\.planName,\s*category: plan\.category \|\| '',\s*notes: plan\.notes \|\| '',/g,
      formDefaults,
    );

    // Replace empty form defaults
    result = result.replace(
      /planCode: '',\s*planName: '',\s*category: '',\s*notes: '',/g,
      config.fields
        .filter(f => f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
        .map((field) => {
          const defaultValue = field.type === 'number'
            ? '0'
            : field.type === 'boolean'
              ? 'false'
              : field.type === 'date' ? 'undefined' : '\'\'';
          return `${field.name}: ${defaultValue}`;
        })
        .join(',\n          '),
    );

    // Replace form fields JSX - Look for the pattern and replace
    const formFieldsJSX = generateFormFieldsJSX(config);

    // Replace the specific form fields section
    result = result.replace(
      /\{\/\* Plan Code Field \*\/\}[\s\S]*?\{\/\* Notes Field \*\/\}[\s\S]*?<\/div>/,
      formFieldsJSX,
    );
  }

  return result;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateSchemaFields(config: EntityConfig): string {
  return config.fields.map((field) => {
    const columnName = field.name.replace(/([A-Z])/g, '_$1').toLowerCase();
    let schemaLine = `${field.name}: `;

    switch (field.type) {
      case 'string':
      case 'text':
        schemaLine += `text('${columnName}')`;
        break;
      case 'number':
        schemaLine += `integer('${columnName}')`;
        break;
      case 'decimal':
        schemaLine += `decimal('${columnName}', { precision: 10, scale: 2 })`;
        break;
      case 'boolean':
        schemaLine += `boolean('${columnName}')`;
        break;
      case 'date':
        schemaLine += `date('${columnName}')`;
        break;
    }

    if (field.required) {
      schemaLine += '.notNull()';
    }

    return `${schemaLine},`;
  }).join('\n  ');
}

function generateValidationFields(config: EntityConfig): string {
  return config.fields.map((field) => {
    let validation = `${field.name}: `;

    switch (field.type) {
      case 'string':
      case 'text':
        validation += 'z.string()';
        if (field.required) {
          validation += `.min(1, '${field.label} is required')`;
        }
        if (field.maxLength) {
          validation += `.max(${field.maxLength}, '${field.label} must be less than ${field.maxLength} characters')`;
        }
        break;
      case 'number':
        validation += 'z.number()';
        if (field.required) {
          validation += '.min(0)';
        }
        break;
      case 'boolean':
        validation += 'z.boolean()';
        break;
      case 'date':
        validation += 'z.string().datetime()';
        break;
    }

    if (!field.required) {
      validation += '.optional()';
    }

    return `${validation},`;
  }).join('\n  ');
}

function generateExcelColumns(config: EntityConfig): string {
  return config.fields
    .filter(f => f.excelColumn)
    .map(field => `'${field.excelColumn}': ${config.entityNameLower}.${field.name}${field.required ? '' : ' || \'\''},`)
    .join('\n    ');
}

function generateSearchFields(config: EntityConfig): string {
  return config.fields
    .filter(f => f.type === 'string' || f.type === 'text')
    .map(field => `ilike(${config.entityNameLower}Schema.${field.name}, searchTerm)`)
    .join(',\n        ');
}

function generateInsertValues(config: EntityConfig): string {
  return config.fields
    .filter(f => f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map(field => `${field.name}: data.${field.name}`)
    .join(',\n      ');
}

function generateUpdateValues(config: EntityConfig): string {
  return config.fields
    .filter(f => f.name !== 'id' && f.name !== 'ownerId' && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map(field => `${field.name}: data.${field.name}`)
    .join(',\n      ');
}

function generateTypeFields(config: EntityConfig, includeId = false, includeOwner = false): string {
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
      }
      return `  ${field.name}${field.required ? '' : '?'}: ${type};`;
    })
    .join('\n');
}

/**
 * Generate complete types file content for aggressive replacement
 */
function generateCompleteTypesContent(config: EntityConfig): string {
  const formDataFields = generateTypeFields(config, false, false);
  const createInputFields = generateTypeFields(config, false, false);
  const updateInputFields = generateTypeFields(config, false, false).replace(/: /g, '?: ');

  return `/**
 * ${config.entityName}-related TypeScript types and interfaces
 * Following TypeScript Type Safety Standards and Yamato-SaaS conventions
 * Based on ${config.entityNameLower}Schema from Drizzle ORM
 */

import type { ${config.entityNameLower}Schema } from '@/models/Schema';

// ✅ Infer the ${config.entityName}Db type from Drizzle schema (server-side with Date objects)
export type ${config.entityName}Db = typeof ${config.entityNameLower}Schema.$inferSelect;

// ✅ Client-side ${config.entityName} type (dates are strings when received from API)
export type ${config.entityName} = Omit<${config.entityName}Db, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// ✅ Pagination options (reusable type)
export type PaginationOptions = {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
};

// ✅ ${config.entityName} list parameters for components (NO ownerId - added in API layer)
export type ${config.entityName}ListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | '${config.nameField}' | '${config.codeField}';
  readonly sortOrder?: 'asc' | 'desc';
  readonly showAll?: boolean;
};

// ✅ Internal type for queries (WITH ownerId for database operations)
export type ${config.entityName}ListParamsWithOwner = ${config.entityName}ListParams & {
  readonly ownerId: string;
};

// ✅ Form data for React Hook Form (no readonly for form mutations)
export type ${config.entityName}FormData = {
${formDataFields}
};

// ✅ Input types for CRUD operations
export type Create${config.entityName}Input = {
  readonly ownerId: string;
${createInputFields}
};

export type Update${config.entityName}Input = {
${updateInputFields}
};

// ✅ API Response types following established patterns
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

// ✅ ${config.entityName} statistics for dashboard
export type ${config.entityName}Stats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly categories: readonly {
    readonly name: string;
    readonly count: number;
  }[];
};

export type ${config.entityName}StatsResponse = {
  readonly success: true;
  readonly data: ${config.entityName}Stats;
};

// ✅ Filter state for ${config.entityNameLower} list components
export type ${config.entityName}Filters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | '${config.nameField}' | '${config.codeField}';
  sortOrder: 'asc' | 'desc';
};

// ✅ Multi-tenancy owner types (reusing from todo pattern)
export type OwnerType = 'user' | 'organization';

export type ${config.entityName}Owner = {
  readonly id: string;
  readonly type: OwnerType;
};`;
}

/**
 * Generate form default values object for React Hook Form
 */
function generateFormDefaultValues(config: EntityConfig): string {
  return config.fields
    .filter(f => f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map((field) => {
      const defaultValue = field.type === 'number'
        ? '0'
        : field.type === 'boolean'
          ? 'false'
          : field.type === 'date' ? 'undefined' : '\'\'';
      return `${field.name}: ${config.entityNameLower}.${field.name}${field.required ? '' : ` || ${defaultValue}`}`;
    })
    .join(',\n          ');
}

/**
 * Generate JSX form fields for React components
 */
function generateFormFieldsJSX(config: EntityConfig): string {
  return config.fields
    .filter(f => f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map((field) => {
      const fieldName = field.name;
      const fieldLabel = field.label;
      const required = field.required;
      const isTextarea = field.type === 'text';
      const isDateInput = field.type === 'date';
      const isNumberInput = field.type === 'number';
      const isCheckbox = field.type === 'boolean';

      if (isCheckbox) {
        return `      {/* ${fieldLabel} Field */}
      <div className="flex items-center">
        <input
          id="${fieldName}"
          type="checkbox"
          {...register('${fieldName}')}
          aria-describedby={errors.${fieldName} ? '${fieldName}-error' : undefined}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label
          htmlFor="${fieldName}"
          className="ml-2 block text-sm text-gray-900"
        >
          ${fieldLabel}
        </label>
        {errors.${fieldName} && (
          <p id="${fieldName}-error" className="mt-2 text-sm text-red-600">
            {errors.${fieldName}.message}
          </p>
        )}
      </div>`;
      }

      const inputType = isDateInput ? 'date' : isNumberInput ? 'number' : 'text';
      const inputElement = isTextarea
        ? `<textarea
          id="${fieldName}"
          rows={4}
          {...register('${fieldName}')}
          aria-describedby={errors.${fieldName} ? '${fieldName}-error' : undefined}
          className={\`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm \${
            errors.${fieldName} ? 'border-red-300' : ''
          }\`}
          placeholder="${fieldLabel}..."
        />`
        : `<input
          id="${fieldName}"
          type="${inputType}"
          {...register('${fieldName}'${isNumberInput ? ', { valueAsNumber: true }' : ''})}
          ${required ? 'aria-required="true"' : ''}
          aria-describedby={errors.${fieldName} ? '${fieldName}-error' : undefined}
          className={\`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm \${
            errors.${fieldName} ? 'border-red-300' : ''
          }\`}
          placeholder="${isDateInput ? '' : `e.g., ${field.excelColumn || fieldLabel}`}"
        />`;

      return `      {/* ${fieldLabel} Field */}
      <div>
        <label
          htmlFor="${fieldName}"
          className="block text-sm font-medium text-gray-700"
        >
          ${fieldLabel}${required ? ' *' : ''}
        </label>
        ${inputElement}
        {errors.${fieldName} && (
          <p id="${fieldName}-error" className="mt-2 text-sm text-red-600">
            {errors.${fieldName}.message}
          </p>
        )}
      </div>`;
    })
    .join('\n\n');
}

/**
 * Generate correct validation schema name (camelCase)
 */
function getValidationSchemaName(config: EntityConfig): string {
  return `${config.entityNameLower}FormSchema`;
}

/**
 * Generate complete form component content
 */
function generateCompleteFormContent(config: EntityConfig): string {
  const formFieldsJSX = generateFormFieldsJSX(config);
  const formDefaults = generateFormDefaultValues(config);
  const validationSchemaName = getValidationSchemaName(config);
  const emptyDefaults = config.fields
    .filter(f => f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map((field) => {
      const defaultValue = field.type === 'number'
        ? '0'
        : field.type === 'boolean'
          ? 'false'
          : field.type === 'date' ? 'undefined' : '\'\'';
      return `${field.name}: ${defaultValue}`;
    })
    .join(',\n          ');

  return `/**
 * ${config.entityName}Form Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing ${config.entityNamePlural} with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { use${config.entityName}Mutations } from '@/hooks/use${config.entityName}Mutations';
import { ${validationSchemaName} } from '@/libs/validations/${config.entityNameLower}';
import type { ${config.entityName}, ${config.entityName}FormData } from '@/types/${config.entityNameLower}';

type ${config.entityName}FormProps = {
  ${config.entityNameLower}?: ${config.entityName};
  onSuccess: (${config.entityNameLower}: ${config.entityName}) => void;
  onCancel: () => void;
};

export function ${config.entityName}Form({ ${config.entityNameLower}, onSuccess, onCancel }: ${config.entityName}FormProps): JSX.Element {
  const isEditing = Boolean(${config.entityNameLower});
  const { create${config.entityName}, update${config.entityName}, isCreating, isUpdating, error, clearError } = use${config.entityName}Mutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<${config.entityName}FormData>({
    resolver: zodResolver(${validationSchemaName}),
    defaultValues: ${config.entityNameLower}
      ? {
          ${formDefaults}
        }
      : {
          ${emptyDefaults}
        },
    mode: 'onChange',
  });

  // Clear errors when form values change
  useEffect(() => {
    const subscription = watch(() => {
      if (error) {
        clearError();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, error, clearError]);

  const onSubmit = async (data: ${config.entityName}FormData): Promise<void> => {
    try {
      if (isEditing && ${config.entityNameLower}) {
        const updated${config.entityName} = await update${config.entityName}(${config.entityNameLower}.id, data);
        onSuccess(updated${config.entityName});
      } else {
        const new${config.entityName} = await create${config.entityName}(data);
        onSuccess(new${config.entityName});
      }
    } catch {
      // Error is handled by the mutation hook
    }
  };

  const handleReset = (): void => {
    reset();
    clearError();
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

${formFieldsJSX}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'} ${config.entityName}
        </button>
      </div>
    </form>
  );
}`;
}

function generateFile(sourcePath: string, targetPath: string, config: EntityConfig): void {
  try {
    if (!existsSync(sourcePath)) {
      console.warn(`⚠️  Source file not found: ${sourcePath}`);
      return;
    }

    const sourceContent = readFileSync(sourcePath, 'utf-8');

    // Special handling for types files - use complete content replacement
    if (targetPath.includes('/types/') && targetPath.endsWith('.ts')) {
      const generatedContent = generateCompleteTypesContent(config);

      // Ensure target directory exists
      const targetDir = join(targetPath, '..');
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      writeFileSync(targetPath, generatedContent);
      console.log(`✅ Generated (Complete): ${targetPath}`);
      return;
    }

    // Special handling for Form components - enhanced replacement
    if (targetPath.includes('Form.tsx')) {
      const generatedContent = generateCompleteFormContent(config);

      // Ensure target directory exists
      const targetDir = join(targetPath, '..');
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      writeFileSync(targetPath, generatedContent);
      console.log(`✅ Generated (Complete Form): ${targetPath}`);
      return;
    }

    // Normal template replacement for other files
    const generatedContent = replaceAdvancedTemplateVars(sourceContent, config);

    // Ensure target directory exists
    const targetDir = join(targetPath, '..');
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    writeFileSync(targetPath, generatedContent);
    console.log(`✅ Generated: ${targetPath}`);
  } catch (error) {
    console.error(`❌ Error generating ${targetPath}:`, error);
  }
}

function main() {
  const args = process.argv.slice(2);
  const entityName = args[0];

  if (!entityName) {
    console.error('❌ Please provide entity name');
    console.log('Usage: npx ts-node scripts/generate-advanced-entity.ts [entityName]');
    console.log('Example: npx ts-node scripts/generate-advanced-entity.ts tasks');
    process.exit(1);
  }

  // Chọn config phù hợp
  let config: EntityConfig;
  if (entityName.toLowerCase() === 'productsub') {
    config = productSubConfig;
  } else if (entityName.toLowerCase() === 'tasks' || entityName.toLowerCase() === 'task') {
    config = tasksConfig;
  } else if (entityName.toLowerCase() === 'process') {
    config = processConfig;
  } else if (entityName.toLowerCase() === 'user_sync' || entityName.toLowerCase() === 'usersync') {
    config = userSyncConfig;
  } else if (entityName.toLowerCase() === 'plan' || entityName.toLowerCase() === 'plans') {
    config = planConfig;
  } else {
    config = {
      ...tasksConfig,
      entityName: capitalizeFirst(entityName),
      entityNameLower: entityName.toLowerCase(),
      entityNamePlural: `${entityName.toLowerCase()}s`,
      tableName: entityName.toLowerCase(),
    };
  }

  console.log(`🚀 Generating ${config.entityName} entity with advanced features...`);

  // File mapping: source -> target (Products as template)
  const fileMappings = [
    // Types
    ['src/types/product.ts', `src/types/${config.entityNameLower}.ts`],

    // Validation
    ['src/libs/validations/product.ts', `src/libs/validations/${config.entityNameLower}.ts`],

    // Database queries
    ['src/libs/queries/product.ts', `src/libs/queries/${config.entityNameLower}.ts`],

    // API client
    ['src/libs/api/products.ts', `src/libs/api/${config.entityNamePlural}.ts`],

    // Hooks
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
    generateFile(String(source), String(target), config);
  });

  console.log(`\n🎉 ${config.entityName} entity generated successfully with advanced features!`);
  console.log('\n📋 Next steps:');
  console.log(`1. Update src/models/Schema.ts to add ${config.entityNameLower}Schema`);
  console.log('2. Create database migration for the new table');
  console.log('3. Update dashboard layout navigation');
  console.log('4. Update middleware to protect API routes');
  console.log('5. Add translation keys');
  console.log('6. Test Excel import/export functionality');
  console.log('7. Customize validation rules and business logic');

  console.log('\n🚀 Generated Features:');
  console.log('✅ Full CRUD operations');
  console.log('✅ Excel Import/Export');
  console.log('✅ Advanced filtering & search');
  console.log('✅ Table-based UI');
  console.log('✅ Multi-tenancy support');
  console.log('✅ Batch operations');
  console.log('✅ Professional validation');
  console.log('✅ Error handling & loading states');
}

if (require.main === module) {
  main();
}
