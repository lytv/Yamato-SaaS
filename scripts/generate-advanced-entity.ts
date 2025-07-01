#!/usr/bin/env node

/**
 * Advanced Entity Generator Script - Based on Products Pattern
 * Creates complete CRUD entity with Excel import/export capabilities
 * Usage: npx ts-node scripts/generate-advanced-entity.ts [entityName]
 *
 * Example: npx ts-node scripts/generate-advanced-entity.ts tasks
 * This will create Tasks entity with all advanced features
 */

const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

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

  // Validation schema replacements
  const validationFields = generateValidationFields(config);
  result = result.replace(
    /productCode: z\.string\(\)\.min\(1, '[^']*'\)\.max\(\d+, '[^']*'\),\s*productName: z\.string\(\)\.min\(1, '[^']*'\)\.max\(\d+, '[^']*'\),\s*notes: z\.string\(\)\.max\(\d+, '[^']*'\)\.optional\(\),\s*category: z\.string\(\)\.max\(\d+, '[^']*'\)\.optional\(\),/g,
    validationFields,
  );

  // Excel column mappings
  const excelColumns = generateExcelColumns(config);
  result = result.replace(
    /'Product Code': product\.productCode,\s*'Product Name': product\.productName,\s*'Category': product\.category \|\| '',\s*'Notes': product\.notes \|\| '',/g,
    excelColumns,
  );

  // Search field replacements for multi-field search
  const searchFields = generateSearchFields(config);
  result = result.replace(
    /ilike\(productSchema\.productCode, searchTerm\),\s*ilike\(productSchema\.productName, searchTerm\),\s*ilike\(productSchema\.category, searchTerm\),\s*ilike\(productSchema\.notes, searchTerm\)/g,
    searchFields,
  );

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

function generateFile(sourcePath: string, targetPath: string, config: EntityConfig): void {
  try {
    if (!existsSync(sourcePath)) {
      console.warn(`⚠️  Source file not found: ${sourcePath}`);
      return;
    }

    const sourceContent = readFileSync(sourcePath, 'utf-8');
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
