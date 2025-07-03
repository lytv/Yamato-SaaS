#!/usr/bin/env node
"use strict";
/**
 * Advanced Entity Generator Script - Based on Products Pattern
 * Creates complete CRUD entity with Excel import/export capabilities
 * Usage: npx ts-node scripts/generate-advanced-entity.ts [entityName]
 *
 * Example: npx ts-node scripts/generate-advanced-entity.ts tasks
 * This will create Tasks entity with all advanced features
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
// Example: Tasks configuration based on Products pattern
var tasksConfig = {
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
var productSubConfig = {
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
var processConfig = {
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
var userSyncConfig = {
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
var planConfig = {
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
function replaceAdvancedTemplateVars(content, config) {
    var result = content;
    // Basic entity name replacements
    result = result
        .replace(/product/g, config.entityNameLower)
        .replace(/Product/g, config.entityName)
        .replace(/products/g, config.entityNamePlural)
        .replace(/Products/g, "".concat(config.entityName, "s"));
    // Field-specific replacements
    result = result
        .replace(/productCode/g, config.codeField)
        .replace(/ProductCode/g, capitalizeFirst(config.codeField))
        .replace(/productName/g, config.nameField)
        .replace(/ProductName/g, capitalizeFirst(config.nameField));
    // Schema field replacements
    var schemaFields = generateSchemaFields(config);
    result = result.replace(/productCode: text\('product_code'\)\.notNull\(\),\s*productName: text\('product_name'\)\.notNull\(\),\s*notes: text\('notes'\),\s*category: text\('category'\),/g, schemaFields);
    // Validation schema replacements
    var validationFields = generateValidationFields(config);
    result = result.replace(/productCode: z\.string\(\)\.min\(1, '[^']*'\)\.max\(\d+, '[^']*'\),\s*productName: z\.string\(\)\.min\(1, '[^']*'\)\.max\(\d+, '[^']*'\),\s*notes: z\.string\(\)\.max\(\d+, '[^']*'\)\.optional\(\),\s*category: z\.string\(\)\.max\(\d+, '[^']*'\)\.optional\(\),/g, validationFields);
    // Excel column mappings
    var excelColumns = generateExcelColumns(config);
    result = result.replace(/'Product Code': product\.productCode,\s*'Product Name': product\.productName,\s*'Category': product\.category \|\| '',\s*'Notes': product\.notes \|\| '',/g, excelColumns);
    // Search field replacements for multi-field search
    var searchFields = generateSearchFields(config);
    result = result.replace(/ilike\(productSchema\.productCode, searchTerm\),\s*ilike\(productSchema\.productName, searchTerm\),\s*ilike\(productSchema\.category, searchTerm\),\s*ilike\(productSchema\.notes, searchTerm\)/g, searchFields);
    return result;
}
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function generateSchemaFields(config) {
    return config.fields.map(function (field) {
        var columnName = field.name.replace(/([A-Z])/g, '_$1').toLowerCase();
        var schemaLine = "".concat(field.name, ": ");
        switch (field.type) {
            case 'string':
            case 'text':
                schemaLine += "text('".concat(columnName, "')");
                break;
            case 'number':
                schemaLine += "integer('".concat(columnName, "')");
                break;
            case 'decimal':
                schemaLine += "decimal('".concat(columnName, "', { precision: 10, scale: 2 })");
                break;
            case 'boolean':
                schemaLine += "boolean('".concat(columnName, "')");
                break;
            case 'date':
                schemaLine += "date('".concat(columnName, "')");
                break;
        }
        if (field.required) {
            schemaLine += '.notNull()';
        }
        return "".concat(schemaLine, ",");
    }).join('\n  ');
}
function generateValidationFields(config) {
    return config.fields.map(function (field) {
        var validation = "".concat(field.name, ": ");
        switch (field.type) {
            case 'string':
            case 'text':
                validation += 'z.string()';
                if (field.required) {
                    validation += ".min(1, '".concat(field.label, " is required')");
                }
                if (field.maxLength) {
                    validation += ".max(".concat(field.maxLength, ", '").concat(field.label, " must be less than ").concat(field.maxLength, " characters')");
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
        return "".concat(validation, ",");
    }).join('\n  ');
}
function generateExcelColumns(config) {
    return config.fields
        .filter(function (f) { return f.excelColumn; })
        .map(function (field) { return "'".concat(field.excelColumn, "': ").concat(config.entityNameLower, ".").concat(field.name).concat(field.required ? '' : ' || \'\'', ","); })
        .join('\n    ');
}
function generateSearchFields(config) {
    return config.fields
        .filter(function (f) { return f.type === 'string' || f.type === 'text'; })
        .map(function (field) { return "ilike(".concat(config.entityNameLower, "Schema.").concat(field.name, ", searchTerm)"); })
        .join(',\n        ');
}
function generateFile(sourcePath, targetPath, config) {
    try {
        if (!(0, node_fs_1.existsSync)(sourcePath)) {
            console.warn("\u26A0\uFE0F  Source file not found: ".concat(sourcePath));
            return;
        }
        var sourceContent = (0, node_fs_1.readFileSync)(sourcePath, 'utf-8');
        var generatedContent = replaceAdvancedTemplateVars(sourceContent, config);
        // Ensure target directory exists
        var targetDir = (0, node_path_1.join)(targetPath, '..');
        if (!(0, node_fs_1.existsSync)(targetDir)) {
            (0, node_fs_1.mkdirSync)(targetDir, { recursive: true });
        }
        (0, node_fs_1.writeFileSync)(targetPath, generatedContent);
        console.log("\u2705 Generated: ".concat(targetPath));
    }
    catch (error) {
        console.error("\u274C Error generating ".concat(targetPath, ":"), error);
    }
}
function main() {
    var args = process.argv.slice(2);
    var entityName = args[0];
    if (!entityName) {
        console.error('❌ Please provide entity name');
        console.log('Usage: npx ts-node scripts/generate-advanced-entity.ts [entityName]');
        console.log('Example: npx ts-node scripts/generate-advanced-entity.ts tasks');
        process.exit(1);
    }
    // Chọn config phù hợp
    var config;
    if (entityName.toLowerCase() === 'productsub') {
        config = productSubConfig;
    }
    else if (entityName.toLowerCase() === 'tasks' || entityName.toLowerCase() === 'task') {
        config = tasksConfig;
    }
    else if (entityName.toLowerCase() === 'process') {
        config = processConfig;
    }
    else if (entityName.toLowerCase() === 'user_sync' || entityName.toLowerCase() === 'usersync') {
        config = userSyncConfig;
    }
    else if (entityName.toLowerCase() === 'plan' || entityName.toLowerCase() === 'plans') {
        config = planConfig;
    }
    else {
        config = __assign(__assign({}, tasksConfig), { entityName: capitalizeFirst(entityName), entityNameLower: entityName.toLowerCase(), entityNamePlural: "".concat(entityName.toLowerCase(), "s"), tableName: entityName.toLowerCase() });
    }
    console.log("\uD83D\uDE80 Generating ".concat(config.entityName, " entity with advanced features..."));
    // File mapping: source -> target (Products as template)
    var fileMappings = [
        // Types
        ['src/types/product.ts', "src/types/".concat(config.entityNameLower, ".ts")],
        // Validation
        ['src/libs/validations/product.ts', "src/libs/validations/".concat(config.entityNameLower, ".ts")],
        // Database queries
        ['src/libs/queries/product.ts', "src/libs/queries/".concat(config.entityNameLower, ".ts")],
        // API client
        ['src/libs/api/products.ts', "src/libs/api/".concat(config.entityNamePlural, ".ts")],
        // Hooks
        ['src/hooks/useProducts.ts', "src/hooks/use".concat(config.entityName, "s.ts")],
        ['src/hooks/useProductMutations.ts', "src/hooks/use".concat(config.entityName, "Mutations.ts")],
        ['src/hooks/useProductFilters.ts', "src/hooks/use".concat(config.entityName, "Filters.ts")],
        ['src/hooks/useProductExport.ts', "src/hooks/use".concat(config.entityName, "Export.ts")],
        // Components
        ['src/features/product/ProductForm.tsx', "src/features/".concat(config.entityNameLower, "/").concat(config.entityName, "Form.tsx")],
        ['src/features/product/ProductList.tsx', "src/features/".concat(config.entityNameLower, "/").concat(config.entityName, "List.tsx")],
        ['src/features/product/ProductSkeleton.tsx', "src/features/".concat(config.entityNameLower, "/").concat(config.entityName, "Skeleton.tsx")],
        ['src/features/product/ProductImportModal.tsx', "src/features/".concat(config.entityNameLower, "/").concat(config.entityName, "ImportModal.tsx")],
        // API routes
        ['src/app/api/products/route.ts', "src/app/api/".concat(config.entityNamePlural, "/route.ts")],
        ['src/app/api/products/[id]/route.ts', "src/app/api/".concat(config.entityNamePlural, "/[id]/route.ts")],
        ['src/app/api/products/stats/route.ts', "src/app/api/".concat(config.entityNamePlural, "/stats/route.ts")],
        ['src/app/api/products/export/route.ts', "src/app/api/".concat(config.entityNamePlural, "/export/route.ts")],
        ['src/app/api/products/import/route.ts', "src/app/api/".concat(config.entityNamePlural, "/import/route.ts")],
        // Pages
        ['src/app/[locale]/(auth)/dashboard/products/page.tsx', "src/app/[locale]/(auth)/dashboard/".concat(config.entityNamePlural, "/page.tsx")],
    ];
    // Generate all files
    fileMappings.forEach(function (_a) {
        var source = _a[0], target = _a[1];
        generateFile(String(source), String(target), config);
    });
    console.log("\n\uD83C\uDF89 ".concat(config.entityName, " entity generated successfully with advanced features!"));
    console.log('\n📋 Next steps:');
    console.log("1. Update src/models/Schema.ts to add ".concat(config.entityNameLower, "Schema"));
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
