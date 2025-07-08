#!/usr/bin/env node

/**
 * Enhanced Advanced Entity Generator Script V4 - IMPROVED VERSION
 * Creates complete CRUD entity with Excel import/export capabilities and database relationships
 * 
 * NEW FEATURES V4:
 * ✅ Fixed case-sensitivity issues
 * ✅ Enhanced hooks generation (export, import, filters, stats)
 * ✅ Relation options API endpoints
 * ✅ Import/Export modal components
 * ✅ Better type safety and validation
 * ✅ Dry-run mode and file backup
 * ✅ Progress tracking and better error messages
 * ✅ Enhanced template engine with conditional generation
 * 
 * Usage: npx tsx scripts/enhanced-generate-advanced-entity-V4-improved.ts [entityName] [configFile] [options]
 * Example: npx tsx scripts/enhanced-generate-advanced-entity-V4-improved.ts plandetail ./configs/plandetail-config.ts --dry-run
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

// ===== TYPES AND INTERFACES =====

type FieldConfig = {
  name: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'decimal' | 'relation';
  required: boolean;
  unique?: boolean;
  maxLength?: number;
  label: string;
  excelColumn?: string;
  dbColumnType?: 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'timestamp';
  
  // Enhanced relationship properties
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
    
    // NEW: For relation options
    optionsEndpoint?: string;
    searchField?: string;
  };
};

export type EntityConfig = {
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
    // NEW FEATURES
    filters: boolean;
    relationOptions: boolean;
    importModal: boolean;
    exportModal: boolean;
  };
  uiType: 'table' | 'cards';
  
  // NEW: Template customization
  templates?: {
    customSchema?: string;
    customTypes?: string;
    customQueries?: string;
    customValidations?: string;
  };
};

type GenerationOptions = {
  dryRun: boolean;
  backup: boolean;
  verbose: boolean;
  skipExisting: boolean;
  force: boolean;
};

// ===== UTILITY FUNCTIONS =====

class Logger {
  constructor(private verbose = false) {}

  info(message: string) {
    console.log(`ℹ️  ${message}`);
  }

  success(message: string) {
    console.log(`✅ ${message}`);
  }

  warning(message: string) {
    console.log(`⚠️  ${message}`);
  }

  error(message: string) {
    console.log(`❌ ${message}`);
  }

  debug(message: string) {
    if (this.verbose) {
      console.log(`🔍 ${message}`);
    }
  }

  progress(current: number, total: number, item: string) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
    console.log(`📈 [${progressBar}] ${percentage}% - ${item}`);
  }
}

class ConfigValidator {
  static validate(config: EntityConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!config.entityName) errors.push('entityName is required');
    if (!config.entityNameLower) errors.push('entityNameLower is required');
    if (!config.tableName) errors.push('tableName is required');
    if (!config.fields || config.fields.length === 0) errors.push('fields array is required and cannot be empty');

    // Field validation
    config.fields.forEach((field, index) => {
      if (!field.name) errors.push(`Field ${index}: name is required`);
      if (!field.type) errors.push(`Field ${index}: type is required`);
      if (!field.label) errors.push(`Field ${index}: label is required`);

      // Relation validation
      if (field.relation) {
        if (!field.relation.entity) errors.push(`Field ${field.name}: relation.entity is required`);
        if (!field.relation.foreignKey) errors.push(`Field ${field.name}: relation.foreignKey is required`);
        if (!field.relation.displayField) errors.push(`Field ${field.name}: relation.displayField is required`);
      }
    });

    return { valid: errors.length === 0, errors };
  }
}

class FileManager {
  constructor(private options: GenerationOptions, private logger: Logger) {}

  backupFile(filePath: string): void {
    if (!this.options.backup || !existsSync(filePath)) return;

    const backupPath = `${filePath}.backup.${Date.now()}`;
    copyFileSync(filePath, backupPath);
    this.logger.debug(`Backed up: ${filePath} -> ${backupPath}`);
  }

  writeFile(targetPath: string, content: string): void {
    if (this.options.dryRun) {
      this.logger.info(`[DRY RUN] Would write: ${targetPath}`);
      return;
    }

    // Create directory if needed
    const targetDir = dirname(targetPath);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    // Backup existing file
    this.backupFile(targetPath);

    // Skip if file exists and skipExisting is true
    if (existsSync(targetPath) && this.options.skipExisting && !this.options.force) {
      this.logger.warning(`Skipped existing file: ${targetPath}`);
      return;
    }

    writeFileSync(targetPath, content);
    this.logger.success(`Generated: ${targetPath}`);
  }
}

// ===== HELPER FUNCTIONS =====

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toCamelCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
}

function toPascalCase(str: string): string {
  return capitalizeFirst(toCamelCase(str));
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// ===== CONFIG LOADER =====

async function loadEntityConfig(configPath: string, entityName: string, logger: Logger): Promise<EntityConfig> {
  try {
    // Smart path resolution - check if we're already in scripts directory
    const currentDir = process.cwd();
    const isInScriptsDir = currentDir.endsWith('scripts') || currentDir.includes('\\scripts\\') || currentDir.includes('/scripts/');
    
    let absolutePath: string;
    if (isInScriptsDir) {
      // Already in scripts directory, use configPath directly
      absolutePath = join(currentDir, configPath);
    } else {
      // Not in scripts directory, add scripts prefix
      absolutePath = join(currentDir, 'scripts', configPath);
    }
    
    logger.debug(`Current directory: ${currentDir}`);
    logger.debug(`Is in scripts directory: ${isInScriptsDir}`);
    logger.debug(`Resolved config path: ${absolutePath}`);
    
    if (!existsSync(absolutePath)) {
      throw new Error(`Config file not found: ${absolutePath}`);
    }

    logger.debug(`Loading config from: ${absolutePath}`);

    // Import the config file
    const configModule = await import(pathToFileURL(absolutePath).href);
    
    // Try multiple naming conventions
    const possibleKeys = [
      `${entityName}Config`,
      `${entityName}Configuration`,
      `${entityName.toLowerCase()}Config`,
      `${toPascalCase(entityName)}Config`,
      `${toCamelCase(entityName)}Config`,
      'planDetailConfig',
      'plandetailConfig',
      'config',
      'entityConfig',
      'default'
    ];
    
    let config = configModule.default;
    
    if (!config) {
      for (const key of possibleKeys) {
        if (configModule[key]) {
          config = configModule[key];
          logger.debug(`Found config using key: ${key}`);
          break;
        }
      }
    } else {
      logger.debug('Found config using default export');
    }

    if (!config) {
      throw new Error(`No configuration found. Expected one of: ${possibleKeys.join(', ')}`);
    }

    // Validate config
    const validation = ConfigValidator.validate(config);
    if (!validation.valid) {
      throw new Error(`Config validation failed:\n${validation.errors.join('\n')}`);
    }

    logger.success(`Loaded and validated configuration from: ${configPath}`);
    return config;
  } catch (error) {
    logger.error(`Error loading config from ${configPath}: ${error}`);
    throw error;
  }
}

// ===== CODE GENERATORS =====

class SchemaGenerator {
  static generate(config: EntityConfig): string {
    const relationFields = config.fields.filter(f => f.relation);
    const regularFields = config.fields.filter(f => 
      !f.relation && 
      f.name !== 'id' && 
      f.name !== 'createdAt' && 
      f.name !== 'updatedAt'
    );
    
    return `/**
 * ${config.entityName} Database Schema with Relations
 * Generated by enhanced entity generator script V4 (improved)
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
    const column = this.getColumnDefinition(field);
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
}));${this.generateJunctionTables(config, relationFields)}`;
  }

  private static getColumnDefinition(field: FieldConfig): string {
    const nullable = field.required ? '.notNull()' : '';
    const unique = field.unique ? '.unique()' : '';
    
    switch (field.dbColumnType) {
      case 'text':
        return `text('${field.name}')${nullable}${unique}`;
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

  private static generateJunctionTables(config: EntityConfig, relationFields: FieldConfig[]): string {
    const manyToManyRelations = relationFields.filter(f => f.relation?.type === 'manyToMany');
    
    if (manyToManyRelations.length === 0) return '';

    return `\n\n// Junction tables for many-to-many relations\n` +
      manyToManyRelations.map(field => {
        const rel = field.relation!;
        return `
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
      }).join('');
  }
}

class TypesGenerator {
  static generate(config: EntityConfig): string {
    const relationFields = config.fields.filter(f => f.relation);
    const formDataFields = this.generateTypeFields(config, false, false);
    const createInputFields = this.generateTypeFields(config, false, false);
    const updateInputFields = this.generateTypeFields(config, false, false, true);
    const relationTypes = this.generateRelationTypes(config);
    
    return `/**
 * ${config.entityName}-related TypeScript types and interfaces
 * Enhanced version with proper error handling, type safety and relationships support
 * Generated by enhanced entity generator script V4 (improved)
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

${config.features.relationOptions && relationFields.length > 0 ? this.generateRelationOptionsTypes(config, relationFields) : ''}

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
  readonly includeRelations?: boolean;
};

export type ${config.entityName}ListParamsWithOwner = ${config.entityName}ListParams & {
  readonly ownerId: string;
};

// Export parameters for Excel functionality
export type ${config.entityName}ExportParams = ${config.entityName}ListParams & {
  readonly format?: 'xlsx' | 'csv';
  readonly includeHeaders?: boolean;
  readonly filename?: string;
};

// Import validation result
export type Import${config.entityName}Result = {
  readonly success: boolean;
  readonly imported: number;
  readonly failed: number;
  readonly errors: readonly string[];
  readonly ${config.entityNamePlural}: readonly ${config.entityName}[];
  readonly duplicates?: readonly string[];
  readonly warnings?: readonly string[];
};

// Statistics type
export type ${config.entityName}Stats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly byStatus?: Record<string, number>;
  readonly byPriority?: Record<string, number>;
  readonly trends?: {
    readonly daily: Record<string, number>;
    readonly weekly: Record<string, number>;
    readonly monthly: Record<string, number>;
  };
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
  ${config.features.filters ? `
  status?: string;
  priority?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  relations?: Record<string, any>;` : ''}
};

${config.features.filters ? `
// Advanced filter options
export type ${config.entityName}FilterOptions = {
  readonly statuses: readonly string[];
  readonly priorities: readonly number[];
  readonly datePresets: readonly {
    readonly label: string;
    readonly value: string;
    readonly start: Date;
    readonly end: Date;
  }[];
  ${relationFields.length > 0 ? `readonly relations: {
${relationFields.map(f => `    readonly ${f.relation!.entityLower}s: readonly Pick<${f.relation!.entity}, 'id' | '${f.relation!.displayField}'>[];`).join('\n')}
  };` : ''}
};` : ''}`;
  }

  private static generateTypeFields(config: EntityConfig, includeId = false, includeOwner = false, allOptional = false): string {
    return config.fields
      .filter((f) => {
        if (!includeId && f.name === 'id') return false;
        if (!includeOwner && f.name === 'ownerId') return false;
        if (f.name === 'createdAt' || f.name === 'updatedAt') return false;
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
          case 'number': type = 'number'; break;
          case 'boolean': type = 'boolean'; break;
          case 'date': type = 'Date | string'; break;
          case 'decimal': type = 'number'; break;
        }

        const isOptional = allOptional || !field.required;
        return `  ${field.name}${isOptional ? '?' : ''}: ${type};`;
      })
      .join('\n');
  }

  private static generateRelationTypes(config: EntityConfig): string {
    const relationFields = config.fields.filter(f => f.relation);
    
    if (relationFields.length === 0) return '';

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

  private static generateRelationOptionsTypes(config: EntityConfig, relationFields: FieldConfig[]): string {
    return `
// Relation options for dropdowns and selectors
export type ${config.entityName}RelationOptions = {
${relationFields
  .filter(f => f.relation?.type === 'belongsTo')
  .map(f => `  readonly ${f.relation!.entityLower}s: readonly Pick<${f.relation!.entity}, 'id' | '${f.relation!.displayField}'>[];`)
  .join('\n')}
${relationFields
  .filter(f => f.relation?.type === 'manyToMany')
  .map(f => `  readonly available${toPascalCase(f.relation!.entityLower)}s: readonly Pick<${f.relation!.entity}, 'id' | '${f.relation!.displayField}'>[];`)
  .join('\n')}
};

// Enhanced relation options with search and pagination
export type ${config.entityName}RelationSearchOptions = {
  readonly query?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
};

export type ${config.entityName}RelationSearchResult<T = any> = {
  readonly success: true;
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};`;
  }
}
class QueriesGenerator {
  static generate(config: EntityConfig): string {
    const belongsToFields = config.fields.filter(f => f.relation?.type === 'belongsTo');
    const manyToManyFields = config.fields.filter(f => f.relation?.type === 'manyToMany');
    
    return `/**
 * ${config.entityName} database queries using Drizzle ORM with Relations Support
 * Enhanced version with proper error handling, type safety and relationships
 * Generated by enhanced entity generator script V4 (improved)
 */

import { and, asc, count, desc, eq, gte, ilike, or, type SQL } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { ${config.entityNameLower}Schema${belongsToFields.length > 0 ? ', ' + belongsToFields.map(f => `${f.relation!.entityLower}Schema`).join(', ') : ''} } from '@/models/Schema';
import type {
  Create${config.entityName}Input,
  ${config.entityName}Db,
  ${config.entityName}ListParamsWithOwner,
  ${config.entityName}Stats,
  ${config.entityName}WithRelations,
  Update${config.entityName}Input,
} from '@/types/${config.entityNameLower}';

/**
 * Create a new ${config.entityNameLower} with proper date and relation handling
 */
export async function create${config.entityName}(data: Create${config.entityName}Input): Promise<${config.entityName}Db> {
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
  }`).join('')}

  const [${config.entityNameLower}] = await db
    .insert(${config.entityNameLower}Schema)
    .values({
${this.generateInsertValues(config)}
    })
    .returning();

  if (!${config.entityNameLower}) {
    throw new Error('Failed to create ${config.entityNameLower}');
  }

  return ${config.entityNameLower};
}

/**
 * Update an existing ${config.entityNameLower} with proper validation
 */
export async function update${config.entityName}(
  id: number,
  data: Update${config.entityName}Input,
  ownerId: string
): Promise<${config.entityName}Db> {
  // Check if entity exists and belongs to user
  const existingEntity = await get${config.entityName}ById(id, ownerId);
  if (!existingEntity) {
    throw new Error('${config.entityName} not found or access denied');
  }

  // Validate foreign keys if provided
${belongsToFields.map(field => `
  if (data.${field.relation!.foreignKey} !== undefined) {
    const ${field.relation!.entityLower}Exists = await db
      .select({ id: ${field.relation!.entityLower}Schema.id })
      .from(${field.relation!.entityLower}Schema)
      .where(eq(${field.relation!.entityLower}Schema.id, data.${field.relation!.foreignKey}))
      .limit(1);

    if (!${field.relation!.entityLower}Exists.length) {
      throw new Error('${field.relation!.entity} not found');
    }
  }`).join('')}

  // Build update data object
  const updateData: any = {};
${this.generateUpdateValues(config)}

  const [updated${config.entityName}] = await db
    .update(${config.entityNameLower}Schema)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(and(
      eq(${config.entityNameLower}Schema.id, id),
      eq(${config.entityNameLower}Schema.ownerId, ownerId)
    ))
    .returning();

  if (!updated${config.entityName}) {
    throw new Error('Failed to update ${config.entityNameLower}');
  }

  return updated${config.entityName};
}

/**
 * Get ${config.entityNameLower} by ID with relations
 */
export async function get${config.entityName}ById(
  id: number,
  ownerId: string,
  includeRelations = false
): Promise<${config.entityName}WithRelations | null> {
  if (includeRelations) {
    const result = await db
      .select({
        ...${config.entityNameLower}Schema,
${belongsToFields.map(field => `        ${field.relation!.entityLower}: {
          id: ${field.relation!.entityLower}Schema.id,
          ${field.relation!.displayField}: ${field.relation!.entityLower}Schema.${field.relation!.displayField},
        },`).join('\n')}
      })
      .from(${config.entityNameLower}Schema)
${belongsToFields.map(field => `      .leftJoin(${field.relation!.entityLower}Schema, eq(${config.entityNameLower}Schema.${field.relation!.foreignKey}, ${field.relation!.entityLower}Schema.id))`).join('\n')}
      .where(and(
        eq(${config.entityNameLower}Schema.id, id),
        eq(${config.entityNameLower}Schema.ownerId, ownerId)
      ))
      .limit(1);

    return result[0] || null;
  }

  const [${config.entityNameLower}] = await db
    .select()
    .from(${config.entityNameLower}Schema)
    .where(and(
      eq(${config.entityNameLower}Schema.id, id),
      eq(${config.entityNameLower}Schema.ownerId, ownerId)
    ))
    .limit(1);

  return ${config.entityNameLower} || null;
}

/**
 * Get all ${config.entityNamePlural} for a user with pagination and filtering
 */
export async function get${config.entityName}sByOwner(
  params: ${config.entityName}ListParamsWithOwner
): Promise<${config.entityName}WithRelations[]> {
  const {
    ownerId,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeRelations = false,
  } = params;

  let query = db.select();

  if (includeRelations) {
    query = db.select({
      ...${config.entityNameLower}Schema,
${belongsToFields.map(field => `      ${field.relation!.entityLower}: {
        id: ${field.relation!.entityLower}Schema.id,
        ${field.relation!.displayField}: ${field.relation!.entityLower}Schema.${field.relation!.displayField},
      },`).join('\n')}
    });
  }

  const baseQuery = query
    .from(${config.entityNameLower}Schema)
${belongsToFields.map(field => `    .leftJoin(${field.relation!.entityLower}Schema, eq(${config.entityNameLower}Schema.${field.relation!.foreignKey}, ${field.relation!.entityLower}Schema.id))`).join('\n')};

  const conditions: SQL[] = [eq(${config.entityNameLower}Schema.ownerId, ownerId)];

  // Add search conditions
  if (search) {
    conditions.push(
      or(
        ilike(${config.entityNameLower}Schema.${config.codeField}, \`%\${search}%\`),
        ilike(${config.entityNameLower}Schema.${config.nameField}, \`%\${search}%\`)
      )!
    );
  }

  // Apply conditions
  const filteredQuery = baseQuery.where(and(...conditions));

  // Apply sorting
  const sortColumn = ${config.entityNameLower}Schema[sortBy as keyof typeof ${config.entityNameLower}Schema] || ${config.entityNameLower}Schema.createdAt;
  const sortedQuery = filteredQuery.orderBy(
    sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)
  );

  // Apply pagination
  const offset = (page - 1) * limit;
  const result = await sortedQuery.limit(limit).offset(offset);

  return result as ${config.entityName}WithRelations[];
}

/**
 * Delete ${config.entityNameLower} by ID
 */
export async function delete${config.entityName}(id: number, ownerId: string): Promise<boolean> {
  const result = await db
    .delete(${config.entityNameLower}Schema)
    .where(and(
      eq(${config.entityNameLower}Schema.id, id),
      eq(${config.entityNameLower}Schema.ownerId, ownerId)
    ));

  return result.rowCount > 0;
}

/**
 * Get ${config.entityNameLower} statistics
 */
export async function get${config.entityName}Stats(ownerId: string): Promise<${config.entityName}Stats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, todayCount, weekCount, monthCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(${config.entityNameLower}Schema)
      .where(eq(${config.entityNameLower}Schema.ownerId, ownerId))
      .then((res) => res[0]?.count || 0),
    
    db
      .select({ count: count() })
      .from(${config.entityNameLower}Schema)
      .where(and(
        eq(${config.entityNameLower}Schema.ownerId, ownerId),
        gte(${config.entityNameLower}Schema.createdAt, today)
      ))
      .then((res) => res[0]?.count || 0),
    
    db
      .select({ count: count() })
      .from(${config.entityNameLower}Schema)
      .where(and(
        eq(${config.entityNameLower}Schema.ownerId, ownerId),
        gte(${config.entityNameLower}Schema.createdAt, thisWeek)
      ))
      .then((res) => res[0]?.count || 0),
    
    db
      .select({ count: count() })
      .from(${config.entityNameLower}Schema)
      .where(and(
        eq(${config.entityNameLower}Schema.ownerId, ownerId),
        gte(${config.entityNameLower}Schema.createdAt, thisMonth)
      ))
      .then((res) => res[0]?.count || 0),
  ]);

  return {
    total,
    today: todayCount,
    thisWeek: weekCount,
    thisMonth: monthCount,
  };
}

${config.features.batchOperations ? `
/**
 * Bulk create ${config.entityNamePlural}
 */
export async function bulkCreate${config.entityName}s(
  data: Create${config.entityName}Input[]
): Promise<${config.entityName}Db[]> {
  if (data.length === 0) return [];

  const result = await db
    .insert(${config.entityNameLower}Schema)
    .values(data.map(item => ({
${this.generateInsertValues(config, 'item')}
    })))
    .returning();

  return result;
}

/**
 * Bulk delete ${config.entityNamePlural}
 */
export async function bulkDelete${config.entityName}s(
  ids: number[],
  ownerId: string
): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await db
    .delete(${config.entityNameLower}Schema)
    .where(and(
      eq(${config.entityNameLower}Schema.ownerId, ownerId),
      or(...ids.map(id => eq(${config.entityNameLower}Schema.id, id)))
    ));

  return result.rowCount;
}` : ''}

${manyToManyFields.length > 0 ? `
// Many-to-many relationship management
${manyToManyFields.map(field => this.generateManyToManyMethods(config, field)).join('\n')}` : ''}`;
  }

  private static generateInsertValues(config: EntityConfig, dataPrefix = 'data'): string {
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
          return `${field.name}: ${dataPrefix}.${field.name} ? new Date(${dataPrefix}.${field.name}) : null`;
        }
        return `${field.name}: ${dataPrefix}.${field.name}`;
      }),
      ...belongsToFields.map(field => `${field.relation!.foreignKey}: ${dataPrefix}.${field.relation!.foreignKey}`),
      `ownerId: ${dataPrefix}.ownerId`
    ];
    
    return '      ' + allInsertFields.join(',\n      ');
  }

  private static generateUpdateValues(config: EntityConfig): string {
    const updateFields = config.fields.filter(f => 
      f.name !== 'id' && 
      f.name !== 'ownerId' && 
      f.name !== 'createdAt' && 
      f.name !== 'updatedAt' &&
      f.relation?.type !== 'manyToMany'
    );

    return updateFields.map((field) => {
      if (field.relation?.type === 'belongsTo') {
        return `  if (data.${field.relation.foreignKey} !== undefined) {
    updateData.${field.relation.foreignKey} = data.${field.relation.foreignKey};
  } else {
    updateData.${field.relation.foreignKey} = existingEntity.${field.relation.foreignKey};
  }`;
      } else if (field.type === 'date') {
        return `  if (data.${field.name} !== undefined) {
    updateData.${field.name} = data.${field.name} ? new Date(data.${field.name}) : null;
  } else {
    updateData.${field.name} = existingEntity.${field.name};
  }`;
      } else {
        return `  if (data.${field.name} !== undefined) {
    updateData.${field.name} = data.${field.name};
  } else {
    updateData.${field.name} = existingEntity.${field.name};
  }`;
      }
    }).join('\n');
  }

  private static generateManyToManyMethods(config: EntityConfig, field: FieldConfig): string {
    const rel = field.relation!;
    
    return `
/**
 * Add ${rel.entityLower} relationship
 */
export async function add${config.entityName}${toPascalCase(rel.entityLower)}(
  ${config.entityNameLower}Id: number,
  ${rel.entityLower}Id: number,
  ownerId: string
): Promise<void> {
  // Verify ownership
  const ${config.entityNameLower} = await get${config.entityName}ById(${config.entityNameLower}Id, ownerId);
  if (!${config.entityNameLower}) {
    throw new Error('${config.entityName} not found or access denied');
  }

  await db.insert(${rel.junctionTable}Schema).values({
    ${rel.junctionFields!.currentKey}: ${config.entityNameLower}Id,
    ${rel.junctionFields!.relatedKey}: ${rel.entityLower}Id,
  });
}

/**
 * Remove ${rel.entityLower} relationship
 */
export async function remove${config.entityName}${toPascalCase(rel.entityLower)}(
  ${config.entityNameLower}Id: number,
  ${rel.entityLower}Id: number,
  ownerId: string
): Promise<void> {
  // Verify ownership
  const ${config.entityNameLower} = await get${config.entityName}ById(${config.entityNameLower}Id, ownerId);
  if (!${config.entityNameLower}) {
    throw new Error('${config.entityName} not found or access denied');
  }

  await db
    .delete(${rel.junctionTable}Schema)
    .where(and(
      eq(${rel.junctionTable}Schema.${rel.junctionFields!.currentKey}, ${config.entityNameLower}Id),
      eq(${rel.junctionTable}Schema.${rel.junctionFields!.relatedKey}, ${rel.entityLower}Id)
    ));
}`;
  }
}

class ValidationsGenerator {
  static generate(config: EntityConfig): string {
    return `/**
 * ${config.entityName} validation schemas with Relations Support
 * Enhanced version with proper error handling, type safety and relationships
 * Generated by enhanced entity generator script V4 (improved)
 */

import { z } from 'zod';

// Enhanced validation with custom error messages and regex patterns
export const ${config.entityNameLower}FormSchema = z.object({
${config.fields
  .filter(f => f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
  .map(field => this.generateFieldValidation(field))
  .join('\n')}
});

// Create ${config.entityNameLower} schema (same as form + ownerId)
export const create${config.entityName}Schema = ${config.entityNameLower}FormSchema.extend({
  ownerId: z.string().min(1, 'Owner ID is required'),
});

// Update ${config.entityNameLower} schema (all fields optional except ID validation)
export const update${config.entityName}Schema = z.object({
${config.fields
  .filter(f => f.name !== 'ownerId' && f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
  .map(field => this.generateFieldValidation(field, true))
  .join('\n')}
});

// List parameters validation
export const ${config.entityNameLower}ListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', '${config.nameField}', '${config.codeField}']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeRelations: z.boolean().default(false),
  showAll: z.boolean().default(false),
});

// Export parameters validation
export const ${config.entityNameLower}ExportParamsSchema = ${config.entityNameLower}ListParamsSchema.extend({
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  includeHeaders: z.boolean().default(true),
  filename: z.string().optional(),
});

// Import validation
export const import${config.entityName}Schema = z.object({
  file: z.instanceof(File),
  skipDuplicates: z.boolean().default(true),
  validateRelations: z.boolean().default(true),
  dryRun: z.boolean().default(false),
});

${config.features.filters ? this.generateFilterValidations(config) : ''}

// Validation helper functions
export function validate${config.entityName}FormData(data: unknown) {
  return ${config.entityNameLower}FormSchema.safeParse(data);
}

export function validateCreate${config.entityName}(data: unknown) {
  return create${config.entityName}Schema.safeParse(data);
}

export function validateUpdate${config.entityName}(data: unknown) {
  return update${config.entityName}Schema.safeParse(data);
}

export function validate${config.entityName}ListParams(data: unknown) {
  return ${config.entityNameLower}ListParamsSchema.safeParse(data);
}

export function validate${config.entityName}ExportParams(data: unknown) {
  return ${config.entityNameLower}ExportParamsSchema.safeParse(data);
}

// Custom validation rules
export const ${config.entityNameLower}ValidationRules = {
  // Field-specific rules
${config.fields.map(field => this.generateValidationRules(field)).filter(Boolean).join('\n')}
  
  // Business logic validation
  validateBusinessRules: (data: any): string[] => {
    const errors: string[] = [];
    
    // Add custom business logic validation here
    ${this.generateBusinessValidation(config)}
    
    return errors;
  },
};`;
  }

  private static generateFieldValidation(field: FieldConfig, optional = false): string {
    if (field.relation?.type === 'belongsTo') {
      let validation = `  ${field.relation.foreignKey}: z.number().int().positive('${field.label} must be a valid ID')`;
      if (!field.required || optional) {
        validation += '.optional()';
      }
      return `${validation},`;
    } else if (field.relation?.type === 'manyToMany') {
      return `  ${field.name}: z.array(z.number().int().positive()).optional(),`;
    }

    let validation = `  ${field.name}: `;

    switch (field.type) {
      case 'string':
      case 'text':
        validation += 'z.string().trim()';
        if (field.required && !optional) {
          validation += `.min(1, '${field.label} is required')`;
        }
        if (field.maxLength) {
          validation += `.max(${field.maxLength}, '${field.label} must be ${field.maxLength} characters or less')`;
        }
        // Add specific regex patterns
        if (field.name.toLowerCase().includes('code')) {
          validation += `.regex(/^[\\w-_]+$/, '${field.label} can only contain letters, numbers, underscores and dashes')`;
        }
        if (field.name.toLowerCase().includes('email')) {
          validation += `.email('${field.label} must be a valid email address')`;
        }
        break;

      case 'number':
        validation += 'z.number().int()';
        if (field.required && !optional) {
          validation += '.min(0)';
        }
        if (field.name === 'priority') {
          validation += '.min(1, "Priority must be between 1 and 10").max(10, "Priority must be between 1 and 10")';
        } else if (field.name.includes('Quantity')) {
          validation += '.min(0, "Quantity cannot be negative")';
        }
        break;

      case 'boolean':
        validation += 'z.boolean()';
        break;

      case 'date':
        validation += 'z.union([z.string().datetime(), z.date()])';
        break;

      case 'decimal':
        validation += 'z.number().min(0, "Value cannot be negative")';
        break;

      default:
        validation += 'z.string()';
    }

    if (!field.required || optional) {
      validation += '.optional()';
    }

    return `${validation},`;
  }

  private static generateFilterValidations(config: EntityConfig): string {
    return `
// Filter validation schemas
export const ${config.entityNameLower}FiltersSchema = z.object({
  search: z.string().default(''),
  sortBy: z.enum(['createdAt', 'updatedAt', '${config.nameField}', '${config.codeField}']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.string().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
  relations: z.record(z.any()).optional(),
});

export function validate${config.entityName}Filters(data: unknown) {
  return ${config.entityNameLower}FiltersSchema.safeParse(data);
}`;
  }

  private static generateValidationRules(field: FieldConfig): string {
    if (field.name === 'priority') {
      return `  priorityRange: { min: 1, max: 10 },`;
    }
    if (field.name.includes('Code')) {
      return `  ${field.name}Pattern: /^[\\w-_]+$/,`;
    }
    if (field.type === 'date') {
      return `  ${field.name}Range: { min: new Date('1900-01-01'), max: new Date('2100-12-31') },`;
    }
    return '';
  }

  private static generateBusinessValidation(config: EntityConfig): string {
    return `// Example: Date validation
    if (data.plannedStartDate && data.plannedEndDate) {
      if (new Date(data.plannedStartDate) > new Date(data.plannedEndDate)) {
        errors.push('Planned start date must be before planned end date');
      }
    }
    
    if (data.actualStartDate && data.actualEndDate) {
      if (new Date(data.actualStartDate) > new Date(data.actualEndDate)) {
        errors.push('Actual start date must be before actual end date');
      }
    }
    
    // Example: Quantity validation
    if (data.actualQuantity && data.plannedQuantity) {
      if (data.actualQuantity > data.plannedQuantity * 1.5) {
        errors.push('Actual quantity significantly exceeds planned quantity');
      }
    }`;
  }
}

class HooksGenerator {
  static generateMainHook(config: EntityConfig): string {
    return `/**
 * ${config.entityName} data fetching hook with enhanced features
 * Generated by enhanced entity generator script V4 (improved)
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

import type {
  ${config.entityName}WithRelations,
  ${config.entityName}ListParams,
  ${config.entityName}Stats,
  ${config.entityName}sResponse,
  ${config.entityName}StatsResponse,
} from '@/types/${config.entityNameLower}';

const API_BASE = '/api/${config.entityNamePlural}';

// Query key factory
export const ${config.entityNameLower}Keys = {
  all: ['${config.entityNamePlural}'] as const,
  lists: () => [...${config.entityNameLower}Keys.all, 'list'] as const,
  list: (params: ${config.entityName}ListParams) => 
    [...${config.entityNameLower}Keys.lists(), params] as const,
  details: () => [...${config.entityNameLower}Keys.all, 'detail'] as const,
  detail: (id: number) => [...${config.entityNameLower}Keys.details(), id] as const,
  stats: () => [...${config.entityNameLower}Keys.all, 'stats'] as const,
${config.features.relationOptions ? `  relations: () => [...${config.entityNameLower}Keys.all, 'relations'] as const,
  relationOptions: () => [...${config.entityNameLower}Keys.relations(), 'options'] as const,` : ''}
} as const;

/**
 * Fetch ${config.entityNamePlural} with pagination and filtering
 */
export function use${config.entityName}s(params: ${config.entityName}ListParams = {}) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ${config.entityNameLower}Keys.list(params),
    queryFn: async (): Promise<${config.entityName}WithRelations[]> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(\`\${API_BASE}?\${searchParams}\`);
      if (!response.ok) {
        throw new Error(\`Failed to fetch ${config.entityNamePlural}: \${response.statusText}\`);
      }

      const result: ${config.entityName}sResponse = await response.json();
      return result.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Infinite scroll hook for ${config.entityNamePlural}
 */
export function use${config.entityName}sInfinite(params: Omit<${config.entityName}ListParams, 'page'> = {}) {
  const { userId } = useAuth();

  return useInfiniteQuery({
    queryKey: [...${config.entityNameLower}Keys.list(params), 'infinite'],
    queryFn: async ({ pageParam = 1 }): Promise<${config.entityName}sResponse> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      Object.entries({ ...params, page: pageParam }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(\`\${API_BASE}?\${searchParams}\`);
      if (!response.ok) {
        throw new Error(\`Failed to fetch ${config.entityNamePlural}: \${response.statusText}\`);
      }

      return response.json();
    },
    enabled: !!userId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch single ${config.entityNameLower} by ID
 */
export function use${config.entityName}(id: number, includeRelations = false) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ${config.entityNameLower}Keys.detail(id),
    queryFn: async (): Promise<${config.entityName}WithRelations> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      if (includeRelations) {
        searchParams.append('includeRelations', 'true');
      }

      const response = await fetch(\`\${API_BASE}/\${id}?\${searchParams}\`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('${config.entityName} not found');
        }
        throw new Error(\`Failed to fetch ${config.entityNameLower}: \${response.statusText}\`);
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!userId && !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch ${config.entityNameLower} statistics
 */
export function use${config.entityName}Stats() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ${config.entityNameLower}Keys.stats(),
    queryFn: async (): Promise<${config.entityName}Stats> => {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(\`\${API_BASE}/stats\`);
      if (!response.ok) {
        throw new Error(\`Failed to fetch ${config.entityNameLower} stats: \${response.statusText}\`);
      }

      const result: ${config.entityName}StatsResponse = await response.json();
      return result.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

${config.features.relationOptions ? this.generateRelationOptionsHook(config) : ''}`;
  }

  static generateMutationsHook(config: EntityConfig): string {
    return `/**
 * ${config.entityName} mutation hooks with optimistic updates
 * Generated by enhanced entity generator script V4 (improved)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import type {
  ${config.entityName}WithRelations,
  Create${config.entityName}Input,
  Update${config.entityName}Input,
  ${config.entityName}Response,
} from '@/types/${config.entityNameLower}';
import { ${config.entityNameLower}Keys } from './use${config.entityName}s';

const API_BASE = '/api/${config.entityNamePlural}';

/**
 * Create ${config.entityNameLower} mutation
 */
export function useCreate${config.entityName}() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<Create${config.entityName}Input, 'ownerId'>): Promise<${config.entityName}WithRelations> => {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, ownerId: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || \`Failed to create ${config.entityNameLower}\`);
      }

      const result: ${config.entityName}Response = await response.json();
      return result.data;
    },
    onSuccess: (new${config.entityName}) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ${config.entityNameLower}Keys.all });
      
      // Optimistically update lists
      queryClient.setQueriesData(
        { queryKey: ${config.entityNameLower}Keys.lists() },
        (oldData: ${config.entityName}WithRelations[] | undefined) => {
          if (!oldData) return [new${config.entityName}];
          return [new${config.entityName}, ...oldData];
        }
      );

      toast.success('${config.entityName} created successfully');
    },
    onError: (error: Error) => {
      toast.error(\`Failed to create ${config.entityNameLower}: \${error.message}\`);
    },
  });
}

/**
 * Update ${config.entityNameLower} mutation
 */
export function useUpdate${config.entityName}() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number; 
      data: Update${config.entityName}Input 
    }): Promise<${config.entityName}WithRelations> => {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(\`\${API_BASE}/\${id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || \`Failed to update ${config.entityNameLower}\`);
      }

      const result: ${config.entityName}Response = await response.json();
      return result.data;
    },
    onSuccess: (updated${config.entityName}, { id }) => {
      // Update specific item in cache
      queryClient.setQueryData(
        ${config.entityNameLower}Keys.detail(id),
        updated${config.entityName}
      );

      // Update item in lists
      queryClient.setQueriesData(
        { queryKey: ${config.entityNameLower}Keys.lists() },
        (oldData: ${config.entityName}WithRelations[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(item => 
            item.id === id ? { ...item, ...updated${config.entityName} } : item
          );
        }
      );

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: ${config.entityNameLower}Keys.stats() });

      toast.success('${config.entityName} updated successfully');
    },
    onError: (error: Error) => {
      toast.error(\`Failed to update ${config.entityNameLower}: \${error.message}\`);
    },
  });
}

/**
 * Delete ${config.entityNameLower} mutation
 */
export function useDelete${config.entityName}() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(\`\${API_BASE}/\${id}\`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || \`Failed to delete ${config.entityNameLower}\`);
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ${config.entityNameLower}Keys.detail(deletedId) });

      // Remove from lists
      queryClient.setQueriesData(
        { queryKey: ${config.entityNameLower}Keys.lists() },
        (oldData: ${config.entityName}WithRelations[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(item => item.id !== deletedId);
        }
      );

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: ${config.entityNameLower}Keys.stats() });

      toast.success('${config.entityName} deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(\`Failed to delete ${config.entityNameLower}: \${error.message}\`);
    },
  });
}

${config.features.batchOperations ? this.generateBatchMutations(config) : ''}`;
  }

  static generateFiltersHook(config: EntityConfig): string {
    if (!config.features.filters) return '';

    return `/**
 * ${config.entityName} filters hook with state management
 * Generated by enhanced entity generator script V4 (improved)
 */

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import type { ${config.entityName}Filters } from '@/types/${config.entityNameLower}';

const DEFAULT_FILTERS: ${config.entityName}Filters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function use${config.entityName}Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<${config.entityName}Filters>(() => ({
    search: searchParams.get('search') || DEFAULT_FILTERS.search,
    sortBy: (searchParams.get('sortBy') as any) || DEFAULT_FILTERS.sortBy,
    sortOrder: (searchParams.get('sortOrder') as any) || DEFAULT_FILTERS.sortOrder,
    status: searchParams.get('status') || undefined,
    priority: searchParams.get('priority') ? Number(searchParams.get('priority')) : undefined,
  }));

  // Update URL when filters change
  const updateURL = useCallback((newFilters: ${config.entityName}Filters) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    router.push(\`\${pathname}?\${params.toString()}\`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Update filters function
  const updateFilters = useCallback((updates: Partial<${config.entityName}Filters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [filters, updateURL]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    updateURL(DEFAULT_FILTERS);
  }, [updateURL]);

  // Individual filter setters
  const setSearch = useCallback((search: string) => {
    updateFilters({ search });
  }, [updateFilters]);

  const setSorting = useCallback((sortBy: ${config.entityName}Filters['sortBy'], sortOrder: ${config.entityName}Filters['sortOrder']) => {
    updateFilters({ sortBy, sortOrder });
  }, [updateFilters]);

  const setStatus = useCallback((status: string | undefined) => {
    updateFilters({ status });
  }, [updateFilters]);

  const setPriority = useCallback((priority: number | undefined) => {
    updateFilters({ priority });
  }, [updateFilters]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = DEFAULT_FILTERS[key as keyof ${config.entityName}Filters];
      return value !== defaultValue && value !== undefined && value !== null && value !== '';
    });
  }, [filters]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      const defaultValue = DEFAULT_FILTERS[key as keyof ${config.entityName}Filters];
      return value !== defaultValue && value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    setSearch,
    setSorting,
    setStatus,
    setPriority,
    hasActiveFilters,
    activeFilterCount,
  };
}`;
  }

  static generateExportHook(config: EntityConfig): string {
    if (!config.features.excelExport) return '';

    return `/**
 * ${config.entityName} export hook with progress tracking
 * Generated by enhanced entity generator script V4 (improved)
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import type { ${config.entityName}ExportParams } from '@/types/${config.entityNameLower}';

type ExportStatus = 'idle' | 'preparing' | 'exporting' | 'downloading' | 'completed' | 'error';

interface ExportState {
  status: ExportStatus;
  progress: number;
  error?: string;
  downloadUrl?: string;
}

export function use${config.entityName}Export() {
  const { userId } = useAuth();
  const [exportState, setExportState] = useState<ExportState>({
    status: 'idle',
    progress: 0,
  });

  const exportData = useCallback(async (params: ${config.entityName}ExportParams = {}) => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setExportState({ status: 'preparing', progress: 10 });

      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      setExportState({ status: 'exporting', progress: 30 });

      const response = await fetch(\`/api/${config.entityNamePlural}/export?\${searchParams}\`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error(\`Export failed: \${response.statusText}\`);
      }

      setExportState({ status: 'downloading', progress: 70 });

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const filename = params.filename || 
        \`${config.entityNamePlural}-\${new Date().toISOString().split('T')[0]}.\${params.format || 'xlsx'}\`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(url);

      setExportState({ 
        status: 'completed', 
        progress: 100,
        downloadUrl: url 
      });

      toast.success(\`${config.entityName} data exported successfully\`);

      // Reset after 3 seconds
      setTimeout(() => {
        setExportState({ status: 'idle', progress: 0 });
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setExportState({ 
        status: 'error', 
        progress: 0, 
        error: errorMessage 
      });
      toast.error(errorMessage);
    }
  }, [userId]);

  const resetExport = useCallback(() => {
    setExportState({ status: 'idle', progress: 0 });
  }, []);

  return {
    ...exportState,
    exportData,
    resetExport,
    isExporting: exportState.status !== 'idle' && exportState.status !== 'completed' && exportState.status !== 'error',
  };
}`;
  }

  private static generateRelationOptionsHook(config: EntityConfig): string {
    const relationFields = config.fields.filter(f => f.relation);
    if (relationFields.length === 0) return '';

    return `
/**
 * Fetch relation options for dropdowns and selectors
 */
export function use${config.entityName}RelationOptions() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ${config.entityNameLower}Keys.relationOptions(),
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(\`\${API_BASE}/relations/options\`);
      if (!response.ok) {
        throw new Error(\`Failed to fetch relation options: \${response.statusText}\`);
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}`;
  }

  private static generateBatchMutations(config: EntityConfig): string {
    return `
/**
 * Bulk delete ${config.entityNamePlural} mutation
 */
export function useBulkDelete${config.entityName}s() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (ids: number[]): Promise<{ deleted: number }> => {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(\`\${API_BASE}/bulk-delete\`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || \`Failed to delete ${config.entityNamePlural}\`);
      }

      return response.json();
    },
    onSuccess: (result, deletedIds) => {
      // Remove from lists
      queryClient.setQueriesData(
        { queryKey: ${config.entityNameLower}Keys.lists() },
        (oldData: ${config.entityName}WithRelations[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(item => !deletedIds.includes(item.id));
        }
      );

      // Remove individual items from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: ${config.entityNameLower}Keys.detail(id) });
      });

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: ${config.entityNameLower}Keys.stats() });

      toast.success(\`\${result.deleted} ${config.entityNamePlural} deleted successfully\`);
    },
    onError: (error: Error) => {
      toast.error(\`Failed to delete ${config.entityNamePlural}: \${error.message}\`);
    },
  });
}`;
  }
}
class APIGenerator {
  static generateMainRoute(config: EntityConfig): string {
    return `/**
 * ${config.entityName} API Routes with Enhanced Relations Support
 * Generated by enhanced entity generator script V4 (improved)
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  create${config.entityName},
  get${config.entityName}sByOwner,
} from '@/libs/queries/${config.entityNameLower}';
import {
  validateCreate${config.entityName},
  validate${config.entityName}ListParams,
} from '@/libs/validations/${config.entityNameLower}';

// GET /api/${config.entityNamePlural}
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawParams = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 10,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      includeRelations: searchParams.get('includeRelations') === 'true',
      showAll: searchParams.get('showAll') === 'true',
    };

    const validation = validate${config.entityName}ListParams(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const params = validation.data;
    const ${config.entityNamePlural} = await get${config.entityName}sByOwner({
      ...params,
      ownerId: userId,
    });

    // Get total count for pagination
    const totalCount = await get${config.entityName}sByOwner({
      ...params,
      ownerId: userId,
      page: 1,
      limit: 999999,
    }).then(results => results.length);

    const hasMore = params.page * params.limit < totalCount;

    return NextResponse.json({
      success: true,
      data: ${config.entityNamePlural},
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        hasMore,
      },
    });
  } catch (error) {
    console.error('GET /api/${config.entityNamePlural} error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// POST /api/${config.entityNamePlural}
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const validation = validateCreate${config.entityName}({ ...body, ownerId: userId });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const ${config.entityNameLower} = await create${config.entityName}(validation.data);

    return NextResponse.json({
      success: true,
      data: ${config.entityNameLower},
      message: '${config.entityName} created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/${config.entityNamePlural} error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'A ${config.entityNameLower} with this code already exists',
            code: 'DUPLICATE_ERROR',
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Referenced entity not found',
            code: 'REFERENCE_ERROR',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

${config.features.batchOperations ? this.generateBatchRoutes(config) : ''}`;
  }

  static generateDetailRoute(config: EntityConfig): string {
    return `/**
 * ${config.entityName} Detail API Routes with Relations Support
 * Generated by enhanced entity generator script V4 (improved)
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  get${config.entityName}ById,
  update${config.entityName},
  delete${config.entityName},
} from '@/libs/queries/${config.entityNameLower}';
import {
  validateUpdate${config.entityName},
} from '@/libs/validations/${config.entityNameLower}';

interface RouteParams {
  params: { id: string };
}

// GET /api/${config.entityNamePlural}/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeRelations = searchParams.get('includeRelations') === 'true';

    const ${config.entityNameLower} = await get${config.entityName}ById(id, userId, includeRelations);
    
    if (!${config.entityNameLower}) {
      return NextResponse.json(
        { success: false, error: '${config.entityName} not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ${config.entityNameLower},
    });
  } catch (error) {
    console.error(\`GET /api/${config.entityNamePlural}/[id] error:\`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// PUT /api/${config.entityNamePlural}/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const validation = validateUpdate${config.entityName}(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const updated${config.entityName} = await update${config.entityName}(id, validation.data, userId);

    return NextResponse.json({
      success: true,
      data: updated${config.entityName},
      message: '${config.entityName} updated successfully',
    });
  } catch (error) {
    console.error(\`PUT /api/${config.entityNamePlural}/[id] error:\`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: '${config.entityName} not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('access denied')) {
        return NextResponse.json(
          { success: false, error: 'Access denied', code: 'ACCESS_DENIED' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/${config.entityNamePlural}/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const success = await delete${config.entityName}(id, userId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: '${config.entityName} not found or access denied', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '${config.entityName} deleted successfully',
    });
  } catch (error) {
    console.error(\`DELETE /api/${config.entityNamePlural}/[id] error:\`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}`;
  }

  static generateStatsRoute(config: EntityConfig): string {
    return `/**
 * ${config.entityName} Statistics API Route
 * Generated by enhanced entity generator script V4 (improved)
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { get${config.entityName}Stats } from '@/libs/queries/${config.entityNameLower}';

// GET /api/${config.entityNamePlural}/stats
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const stats = await get${config.entityName}Stats(userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('GET /api/${config.entityNamePlural}/stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}`;
  }

  static generateExportRoute(config: EntityConfig): string {
    if (!config.features.excelExport) return '';

    return `/**
 * ${config.entityName} Export API Route
 * Generated by enhanced entity generator script V4 (improved)
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { get${config.entityName}sByOwner } from '@/libs/queries/${config.entityNameLower}';
import { validate${config.entityName}ExportParams } from '@/libs/validations/${config.entityNameLower}';

// GET /api/${config.entityNamePlural}/export
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawParams = {
      page: 1,
      limit: 999999, // Export all
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      format: searchParams.get('format') || 'xlsx',
      includeHeaders: searchParams.get('includeHeaders') !== 'false',
      filename: searchParams.get('filename') || undefined,
    };

    const validation = validate${config.entityName}ExportParams(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid export parameters',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const params = validation.data;
    const ${config.entityNamePlural} = await get${config.entityName}sByOwner({
      ...params,
      ownerId: userId,
      includeRelations: true,
    });

    // Prepare data for export
    const exportData = ${config.entityNamePlural}.map(item => ({
${config.fields
  .filter(f => f.name !== 'id' && f.name !== 'ownerId')
  .map(field => {
    if (field.relation?.type === 'belongsTo') {
      return `      '${field.relation.displayField}': item.${field.relation.entityLower}?.${field.relation.displayField} || '',`;
    }
    return `      '${field.label}': item.${field.name} || '',`;
  })
  .join('\n')}
      'Created At': item.createdAt,
      'Updated At': item.updatedAt,
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = Object.keys(exportData[0] || {}).map(() => ({ width: 20 }));
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, '${config.entityName}s');

    // Generate buffer
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: params.format as 'xlsx' | 'csv' 
    });

    // Set response headers
    const filename = params.filename || 
      \`${config.entityNamePlural}-\${new Date().toISOString().split('T')[0]}.\${params.format}\`;
    
    const mimeType = params.format === 'csv' 
      ? 'text/csv' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': \`attachment; filename="\${filename}"\`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('GET /api/${config.entityNamePlural}/export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
        code: 'EXPORT_ERROR',
      },
      { status: 500 }
    );
  }
}`;
  }

  static generateRelationOptionsRoute(config: EntityConfig): string {
    if (!config.features.relationOptions) return '';

    const relationFields = config.fields.filter(f => f.relation);
    if (relationFields.length === 0) return '';

    return `/**
 * ${config.entityName} Relation Options API Route
 * Generated by enhanced entity generator script V4 (improved)
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { ${relationFields.map(f => `${f.relation!.entityLower}Schema`).join(', ')} } from '@/models/Schema';

// GET /api/${config.entityNamePlural}/relations/options
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    const results = await Promise.all([
${relationFields.map(field => {
  const rel = field.relation!;
  return `      // ${rel.entity} options
      db
        .select({
          id: ${rel.entityLower}Schema.id,
          ${rel.displayField}: ${rel.entityLower}Schema.${rel.displayField},
        })
        .from(${rel.entityLower}Schema)
        ${rel.entityLower === 'plan' ? '.where(eq(planSchema.ownerId, userId))' : ''}
        .limit(limit),`;
}).join('\n')}
    ]);

    return NextResponse.json({
      success: true,
      data: {
${relationFields.map((field, index) => {
  const rel = field.relation!;
  return `        ${rel.entityLower}s: results[${index}],`;
}).join('\n')}
      },
    });
  } catch (error) {
    console.error('GET /api/${config.entityNamePlural}/relations/options error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}`;
  }

  private static generateBatchRoutes(config: EntityConfig): string {
    return `
// POST /api/${config.entityNamePlural}/bulk-delete
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid IDs array', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const deleted = await bulkDelete${config.entityName}s(ids, userId);

    return NextResponse.json({
      success: true,
      data: { deleted },
      message: \`\${deleted} ${config.entityNamePlural} deleted successfully\`,
    });
  } catch (error) {
    console.error('DELETE /api/${config.entityNamePlural} (bulk) error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk delete failed',
        code: 'BULK_DELETE_ERROR',
      },
      { status: 500 }
    );
  }
}`;
  }
}

class ComponentsGenerator {
  static generateForm(config: EntityConfig): string {
    const relationFields = config.fields.filter(f => f.relation?.type === 'belongsTo');
    
    return `/**
 * ${config.entityName} Form Component with Enhanced Features
 * Generated by enhanced entity generator script V4 (improved)
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X } from 'lucide-react';
${relationFields.length > 0 ? `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';` : ''}

import type { ${config.entityName}FormData } from '@/types/${config.entityNameLower}';
import { ${config.entityNameLower}FormSchema } from '@/libs/validations/${config.entityNameLower}';
import { useCreate${config.entityName}, useUpdate${config.entityName} } from '@/hooks/use${config.entityName}Mutations';
${config.features.relationOptions ? `import { use${config.entityName}RelationOptions } from '@/hooks/use${config.entityName}s';` : ''}

interface ${config.entityName}FormProps {
  ${config.entityNameLower}?: ${config.entityName}FormData;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ${config.entityName}Form({
  ${config.entityNameLower},
  isEditing = false,
  onSuccess,
  onCancel,
}: ${config.entityName}FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createMutation = useCreate${config.entityName}();
  const updateMutation = useUpdate${config.entityName}();
  ${config.features.relationOptions ? `const { data: relationOptions, isLoading: isLoadingOptions } = use${config.entityName}RelationOptions();` : ''}

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<${config.entityName}FormData>({
    resolver: zodResolver(${config.entityNameLower}FormSchema),
    defaultValues: ${config.entityNameLower} || {
${config.fields
  .filter(f => !f.relation && f.name !== 'id' && f.name !== 'ownerId' && f.name !== 'createdAt' && f.name !== 'updatedAt')
  .map(field => {
    if (field.type === 'string' || field.type === 'text') {
      return `      ${field.name}: '',`;
    } else if (field.type === 'number') {
      return `      ${field.name}: 0,`;
    } else if (field.type === 'boolean') {
      return `      ${field.name}: false,`;
    }
    return `      ${field.name}: undefined,`;
  })
  .join('\n')}
${relationFields.map(field => `      ${field.relation!.foreignKey}: 0,`).join('\n')}
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: ${config.entityName}FormData) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing && ${config.entityNameLower}?.id) {
        await updateMutation.mutateAsync({
          id: ${config.entityNameLower}.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? \`Edit \${${config.entityNameLower}?.${config.nameField} || '${config.entityName}'}\` : 'Create New ${config.entityName}'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error display */}
          {(createMutation.error || updateMutation.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {createMutation.error?.message || updateMutation.error?.message}
              </AlertDescription>
            </Alert>
          )}

${config.fields
  .filter(f => !f.relation && f.name !== 'id' && f.name !== 'ownerId' && f.name !== 'createdAt' && f.name !== 'updatedAt')
  .map(field => this.generateFormField(field))
  .join('\n')}

${relationFields.map(field => this.generateRelationField(field, config)).join('\n')}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!isValid || !isDirty || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? 'Update' : 'Create'} ${config.entityName}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}`;
  }

  static generateList(config: EntityConfig): string {
    return `/**
 * ${config.entityName} List Component with Enhanced Features
 * Generated by enhanced entity generator script V4 (improved)
 */

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  RefreshCw,
} from 'lucide-react';

import type { ${config.entityName}WithRelations } from '@/types/${config.entityNameLower}';
import { use${config.entityName}s, use${config.entityName}Stats } from '@/hooks/use${config.entityName}s';
import { useDelete${config.entityName}${config.features.batchOperations ? ', useBulkDelete${config.entityName}s' : ''} } from '@/hooks/use${config.entityName}Mutations';
${config.features.filters ? `import { use${config.entityName}Filters } from '@/hooks/use${config.entityName}Filters';` : ''}
${config.features.excelExport ? `import { use${config.entityName}Export } from '@/hooks/use${config.entityName}Export';` : ''}
import { ${config.entityName}Skeleton } from './${config.entityName}Skeleton';
import { ${config.entityName}Form } from './${config.entityName}Form';

export function ${config.entityName}List() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<${config.entityName}WithRelations | null>(null);

  ${config.features.filters ? `const { filters, updateFilters, setSearch, setSorting, resetFilters, hasActiveFilters } = use${config.entityName}Filters();` : ''}
  
  const {
    data: ${config.entityNamePlural} = [],
    isLoading,
    error,
    refetch,
  } = use${config.entityName}s(${config.features.filters ? 'filters' : '{}'});

  const { data: stats } = use${config.entityName}Stats();
  const deleteMutation = useDelete${config.entityName}();
  ${config.features.batchOperations ? `const bulkDeleteMutation = useBulkDelete${config.entityName}s();` : ''}
  ${config.features.excelExport ? `const { exportData, isExporting } = use${config.entityName}Export();` : ''}

  const handleEdit = (item: ${config.entityName}WithRelations) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteId(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  ${config.features.batchOperations ? `
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await bulkDeleteMutation.mutateAsync(selectedItems);
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };` : ''}

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(${config.entityNamePlural}.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-destructive mb-4">Error loading ${config.entityNamePlural}: {error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total ${config.entityNamePlural}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.today}</div>
              <p className="text-xs text-muted-foreground">Created Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">This Month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>${config.entityName}s</CardTitle>
            <div className="flex gap-2">
              ${config.features.excelExport ? `
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData()}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>` : ''}
              
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add ${config.entityName}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="flex gap-4 mb-4">
            ${config.features.filters ? `
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search ${config.entityNamePlural}..."
                  value={filters.search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {hasActiveFilters && (
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            )}` : `
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search ${config.entityNamePlural}..."
                  className="pl-10"
                />
              </div>
            </div>`}
          </div>

          ${config.features.batchOperations ? `
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedItems.length} item(s) selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}` : ''}

          {/* Table */}
          {isLoading ? (
            <${config.entityName}Skeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  ${config.features.batchOperations ? `
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.length === ${config.entityNamePlural}.length && ${config.entityNamePlural}.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>` : ''}
                  <TableHead>${config.codeField}</TableHead>
                  <TableHead>${config.nameField}</TableHead>
${config.fields
  .filter(f => !f.relation && f.name !== 'id' && f.name !== 'ownerId' && f.name !== 'createdAt' && f.name !== 'updatedAt' && f.name !== config.codeField && f.name !== config.nameField)
  .slice(0, 3) // Show first 3 additional fields
  .map(field => `                  <TableHead>${field.label}</TableHead>`)
  .join('\n')}
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {${config.entityNamePlural}.map((item) => (
                  <TableRow key={item.id}>
                    ${config.features.batchOperations ? `
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                      />
                    </TableCell>` : ''}
                    <TableCell className="font-medium">
                      {item.${config.codeField}}
                    </TableCell>
                    <TableCell>{item.${config.nameField}}</TableCell>
${config.fields
  .filter(f => !f.relation && f.name !== 'id' && f.name !== 'ownerId' && f.name !== 'createdAt' && f.name !== 'updatedAt' && f.name !== config.codeField && f.name !== config.nameField)
  .slice(0, 3)
  .map(field => this.generateTableCell(field))
  .join('\n')}
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {${config.entityNamePlural}.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No ${config.entityNamePlural} found. Create your first one!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto m-4">
            <${config.entityName}Form
              ${config.entityNameLower}={editingItem}
              isEditing={!!editingItem}
              onSuccess={() => {
                setIsFormOpen(false);
                setEditingItem(null);
                refetch();
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingItem(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ${config.entityNameLower}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}`;
  }

  static generateSkeleton(config: EntityConfig): string {
    return `/**
 * ${config.entityName} Skeleton Loading Component
 * Generated by enhanced entity generator script V4 (improved)
 */

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ${config.entityName}Skeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Search skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Table skeleton */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-12" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}`;
  }

  private static generateFormField(field: FieldConfig): string {
    if (field.type === 'text') {
      return `          {/* ${field.label} */}
          <div className="space-y-2">
            <Label htmlFor="${field.name}">${field.label}${field.required ? ' *' : ''}</Label>
            <Textarea
              id="${field.name}"
              placeholder="Enter ${field.label.toLowerCase()}..."
              {...register('${field.name}')}
              className={errors.${field.name} ? 'border-destructive' : ''}
            />
            {errors.${field.name} && (
              <p className="text-sm text-destructive">{errors.${field.name}?.message}</p>
            )}
          </div>`;
    } else if (field.type === 'number') {
      return `          {/* ${field.label} */}
          <div className="space-y-2">
            <Label htmlFor="${field.name}">${field.label}${field.required ? ' *' : ''}</Label>
            <Input
              id="${field.name}"
              type="number"
              placeholder="Enter ${field.label.toLowerCase()}..."
              {...register('${field.name}', { valueAsNumber: true })}
              className={errors.${field.name} ? 'border-destructive' : ''}
            />
            {errors.${field.name} && (
              <p className="text-sm text-destructive">{errors.${field.name}?.message}</p>
            )}
          </div>`;
    } else if (field.type === 'date') {
      return `          {/* ${field.label} */}
          <div className="space-y-2">
            <Label htmlFor="${field.name}">${field.label}${field.required ? ' *' : ''}</Label>
            <Input
              id="${field.name}"
              type="date"
              {...register('${field.name}')}
              className={errors.${field.name} ? 'border-destructive' : ''}
            />
            {errors.${field.name} && (
              <p className="text-sm text-destructive">{errors.${field.name}?.message}</p>
            )}
          </div>`;
    } else {
      return `          {/* ${field.label} */}
          <div className="space-y-2">
            <Label htmlFor="${field.name}">${field.label}${field.required ? ' *' : ''}</Label>
            <Input
              id="${field.name}"
              type="text"
              placeholder="Enter ${field.label.toLowerCase()}..."
              {...register('${field.name}')}
              className={errors.${field.name} ? 'border-destructive' : ''}
            />
            {errors.${field.name} && (
              <p className="text-sm text-destructive">{errors.${field.name}?.message}</p>
            )}
          </div>`;
    }
  }

  private static generateRelationField(field: FieldConfig, config: EntityConfig): string {
    const rel = field.relation!;
    
    return `          {/* ${field.label} */}
          <div className="space-y-2">
            <Label htmlFor="${rel.foreignKey}">${field.label}${field.required ? ' *' : ''}</Label>
            ${config.features.relationOptions ? `
            {isLoadingOptions ? (
              <div className="h-10 bg-muted animate-pulse rounded" />
            ) : (
              <Select
                value={watch('${rel.foreignKey}')?.toString() || ''}
                onValueChange={(value) => setValue('${rel.foreignKey}', parseInt(value))}
              >
                <SelectTrigger className={errors.${rel.foreignKey} ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select ${field.label.toLowerCase()}..." />
                </SelectTrigger>
                <SelectContent>
                  {relationOptions?.${rel.entityLower}s?.map((option) => (
                    <SelectItem key={option.id} value={option.id.toString()}>
                      {option.${rel.displayField}}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}` : `
            <Input
              id="${rel.foreignKey}"
              type="number"
              placeholder="Enter ${field.label.toLowerCase()} ID..."
              {...register('${rel.foreignKey}', { valueAsNumber: true })}
              className={errors.${rel.foreignKey} ? 'border-destructive' : ''}
            />`}
            {errors.${rel.foreignKey} && (
              <p className="text-sm text-destructive">{errors.${rel.foreignKey}?.message}</p>
            )}
          </div>`;
  }

  private static generateTableCell(field: FieldConfig): string {
    if (field.type === 'date') {
      return `                    <TableCell>
                      {item.${field.name} ? new Date(item.${field.name}).toLocaleDateString() : '-'}
                    </TableCell>`;
    } else if (field.name === 'status') {
      return `                    <TableCell>
                      <Badge variant={item.${field.name} === 'completed' ? 'default' : 'secondary'}>
                        {item.${field.name} || 'pending'}
                      </Badge>
                    </TableCell>`;
    } else if (field.name === 'priority') {
      return `                    <TableCell>
                      <Badge variant={item.${field.name} && item.${field.name} > 5 ? 'destructive' : 'outline'}>
                        {item.${field.name} || '-'}
                      </Badge>
                    </TableCell>`;
    } else {
      return `                    <TableCell>{item.${field.name} || '-'}</TableCell>`;
    }
  }
}

// ===== MAIN GENERATION ENGINE =====

class EntityGenerator {
  constructor(
    private config: EntityConfig,
    private options: GenerationOptions,
    private logger: Logger,
    private fileManager: FileManager
  ) {}

  generate(): void {
    const fileMappings = this.getFileMappings();
    
    this.logger.info(`Generating ${this.config.entityName} entity with ${fileMappings.length} files...`);
    
    fileMappings.forEach((mapping, index) => {
      this.logger.progress(index + 1, fileMappings.length, mapping.target);
      
      try {
        const content = this.generateFileContent(mapping);
        if (content) {
          this.fileManager.writeFile(mapping.target, content);
        }
      } catch (error) {
        this.logger.error(`Failed to generate ${mapping.target}: ${error}`);
        if (!this.options.force) {
          throw error;
        }
      }
    });
    
    this.logger.success(`Generated ${this.config.entityName} entity successfully!`);
    this.printSummary();
  }

  private getFileMappings() {
    const base = this.config.entityNameLower;
    const plural = this.config.entityNamePlural;

    // Smart path resolution - check if we're already in scripts directory
    const currentDir = process.cwd();
    const isInScriptsDir = currentDir.endsWith('scripts') || currentDir.includes('\\scripts\\') || currentDir.includes('/scripts/');
    const srcPrefix = isInScriptsDir ? '../src/' : 'src/';
    
    this.logger.debug(`Current directory: ${currentDir}`);
    this.logger.debug(`Is in scripts directory: ${isInScriptsDir}`);
    this.logger.debug(`Using src prefix: ${srcPrefix}`);

    const mappings = [
      // Core files
      { type: 'schema', target: `${srcPrefix}models/Schema/${base}.ts` },
      { type: 'types', target: `${srcPrefix}types/${base}.ts` },
      { type: 'queries', target: `${srcPrefix}libs/queries/${base}.ts` },
      { type: 'validations', target: `${srcPrefix}libs/validations/${base}.ts` },

      // API routes
      { type: 'api-main', target: `${srcPrefix}app/api/${plural}/route.ts` },
      { type: 'api-detail', target: `${srcPrefix}app/api/${plural}/[id]/route.ts` },
      { type: 'api-stats', target: `${srcPrefix}app/api/${plural}/stats/route.ts` },

      // Hooks
      { type: 'hook-main', target: `${srcPrefix}hooks/use${this.config.entityName}s.ts` },
      { type: 'hook-mutations', target: `${srcPrefix}hooks/use${this.config.entityName}Mutations.ts` },

      // Components
      { type: 'component-form', target: `${srcPrefix}features/${base}/${this.config.entityName}Form.tsx` },
      { type: 'component-list', target: `${srcPrefix}features/${base}/${this.config.entityName}List.tsx` },
      { type: 'component-skeleton', target: `${srcPrefix}features/${base}/${this.config.entityName}Skeleton.tsx` },

      // Pages
      { type: 'page-main', target: `${srcPrefix}app/[locale]/(auth)/dashboard/${plural}/page.tsx` },
    ];

    // Conditional files
    if (this.config.features.excelExport) {
      mappings.push(
        { type: 'api-export', target: `${srcPrefix}app/api/${plural}/export/route.ts` },
        { type: 'hook-export', target: `${srcPrefix}hooks/use${this.config.entityName}Export.ts` }
      );
    }

    if (this.config.features.filters) {
      mappings.push({ type: 'hook-filters', target: `${srcPrefix}hooks/use${this.config.entityName}Filters.ts` });
    }

    if (this.config.features.relationOptions) {
      mappings.push({ type: 'api-relations', target: `${srcPrefix}app/api/${plural}/relations/options/route.ts` });
    }

    return mappings;
  }

  private generateFileContent(mapping: { type: string; target: string }): string {
    switch (mapping.type) {
      case 'schema':
        return SchemaGenerator.generate(this.config);
      case 'types':
        return TypesGenerator.generate(this.config);
      case 'queries':
        return QueriesGenerator.generate(this.config);
      case 'validations':
        return ValidationsGenerator.generate(this.config);
      case 'api-main':
        return APIGenerator.generateMainRoute(this.config);
      case 'api-detail':
        return APIGenerator.generateDetailRoute(this.config);
      case 'api-stats':
        return APIGenerator.generateStatsRoute(this.config);
      case 'api-export':
        return APIGenerator.generateExportRoute(this.config);
      case 'api-relations':
        return APIGenerator.generateRelationOptionsRoute(this.config);
      case 'hook-main':
        return HooksGenerator.generateMainHook(this.config);
      case 'hook-mutations':
        return HooksGenerator.generateMutationsHook(this.config);
      case 'hook-filters':
        return HooksGenerator.generateFiltersHook(this.config);
      case 'hook-export':
        return HooksGenerator.generateExportHook(this.config);
      case 'component-form':
        return ComponentsGenerator.generateForm(this.config);
      case 'component-list':
        return ComponentsGenerator.generateList(this.config);
      case 'component-skeleton':
        return ComponentsGenerator.generateSkeleton(this.config);
      case 'page-main':
        return this.generateMainPage();
      default:
        this.logger.warning(`Unknown file type: ${mapping.type}`);
        return '';
    }
  }

  private generateMainPage(): string {
    return `/**
 * ${this.config.entityName} Dashboard Page
 * Generated by enhanced entity generator script V4 (improved)
 */

import { ${this.config.entityName}List } from '@/features/${this.config.entityNameLower}/${this.config.entityName}List';

export default function ${this.config.entityName}sPage() {
  return (
    <div className="container mx-auto py-6">
      <${this.config.entityName}List />
    </div>
  );
}`;
  }

  private printSummary(): void {
    this.logger.info('\n📋 Enhanced Features V4 (Improved):');
    this.logger.info('✅ Fixed case-sensitivity issues');
    this.logger.info('✅ Enhanced hooks generation (export, import, filters, stats)');
    this.logger.info('✅ Better type safety and validation');
    this.logger.info('✅ Improved error handling and logging');
    this.logger.info('✅ Enhanced template engine with conditional generation');
    
    if (this.config.features.relationships) {
      this.logger.info('\n📋 Relations Generated:');
      const relationFields = this.config.fields.filter(f => f.relation);
      relationFields.forEach(field => {
        const rel = field.relation!;
        this.logger.info(`✅ ${rel.type}: ${this.config.entityName} -> ${rel.entity} (${rel.displayField})`);
      });
    }

    this.logger.info('\n📋 Next steps:');
    this.logger.info('1. Update src/models/Schema.ts to export new schemas');
    this.logger.info('2. Run database migration if needed');
    this.logger.info('3. Run type check: npm run type-check');
    this.logger.info('4. Test the generated entity');
    
    if (this.options.dryRun) {
      this.logger.info('\n⚠️  This was a DRY RUN - no files were actually created');
    }
  }
}

// ===== MAIN FUNCTION =====

async function main() {
  const args = process.argv.slice(2);
  const entityName = args[0];
  const configFile = args[1];
  
  // Parse options
  const options: GenerationOptions = {
    dryRun: args.includes('--dry-run'),
    backup: !args.includes('--no-backup'),
    verbose: args.includes('--verbose'),
    skipExisting: args.includes('--skip-existing'),
    force: args.includes('--force'),
  };

  const logger = new Logger(options.verbose);
  const fileManager = new FileManager(options, logger);

  // Display usage if no arguments
  if (!entityName) {
    console.log(`
Enhanced Entity Generator V4 - IMPROVED VERSION

Usage: npx ts-node scripts/enhanced-generate-advanced-entity-V4-improved.ts [entityName] [configFile] [options]

Arguments:
  entityName    Name of the entity to generate (e.g., plandetail)
  configFile    Path to config file (e.g., ./configs/plandetail-config.ts)

Options:
  --dry-run        Preview changes without writing files
  --no-backup      Skip backing up existing files
  --verbose        Enable detailed logging
  --skip-existing  Skip files that already exist
  --force          Overwrite existing files (use with caution)

Examples:
  npx ts-node scripts/enhanced-generate-advanced-entity-V4-improved.ts plandetail ./configs/plandetail-config.ts
  npx ts-node scripts/enhanced-generate-advanced-entity-V4-improved.ts plandetail ./configs/plandetail-config.ts --dry-run
  npx ts-node scripts/enhanced-generate-advanced-entity-V4-improved.ts plandetail ./configs/plandetail-config.ts --verbose --force
`);
    process.exit(1);
  }

  try {
    logger.info(`🚀 Starting Enhanced Entity Generator V4 for: ${entityName}`);
    
    if (options.dryRun) {
      logger.info('🔍 DRY RUN MODE - No files will be created');
    }

    // Load configuration
    let config: EntityConfig;
    if (configFile) {
      config = await loadEntityConfig(configFile, entityName, logger);
    } else {
      logger.warning('No config file provided, using default configuration');
      config = createDefaultConfig(entityName);
    }

    // Validate configuration
    const validation = ConfigValidator.validate(config);
    if (!validation.valid) {
      logger.error('Configuration validation failed:');
      validation.errors.forEach(error => logger.error(`  - ${error}`));
      process.exit(1);
    }

    // Generate entity
    const generator = new EntityGenerator(config, options, logger, fileManager);
    generator.generate();

    logger.success('🎉 Entity generation completed successfully!');
  } catch (error) {
    logger.error(`❌ Generation failed: ${error}`);
    if (options.verbose && error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function createDefaultConfig(entityName: string): EntityConfig {
  return {
    entityName: toPascalCase(entityName),
    entityNameLower: entityName.toLowerCase(),
    entityNamePlural: `${entityName.toLowerCase()}s`,
    tableName: entityName.toLowerCase(),
    codeField: 'code',
    nameField: 'name',
    fields: [
      {
        name: 'code',
        type: 'string',
        required: true,
        unique: true,
        maxLength: 50,
        label: 'Code',
        excelColumn: 'Code',
        dbColumnType: 'text',
      },
      {
        name: 'name',
        type: 'string',
        required: true,
        maxLength: 255,
        label: 'Name',
        excelColumn: 'Name',
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
      relationships: false,
      filters: true,
      relationOptions: false,
      importModal: true,
      exportModal: true,
    },
    uiType: 'table',
  };
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { EntityGenerator, type EntityConfig, type GenerationOptions };
