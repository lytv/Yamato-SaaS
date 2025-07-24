# 🔧 PROCESS SUB TABLE IMPLEMENTATION PLAN

## 🎯 **OBJECTIVE**
Implement complete CRUD functionality for ProcessSub table (CHÍNH, VẢI LÓT sub-processes) following Yamato-SaaS todos pattern. This table manages sub-processes within main processes like CAT, MAY, THEU with complex material and costing factors.

## 📋 **OVERVIEW**
ProcessSub table manages sub-processes within main production processes:
- **Parent-child relationship**: processId → Process table
- **processSubCode**: chinh, vailot (lowercase internal codes)
- **processSubName**: CHÍNH, VẢI LÓT (display names)
- **Complex fields**: Multiple arrays, decimals, enums, dependencies
- **Business logic**: Sub-sequencing, dependencies, material factors

## 🏗️ **IMPLEMENTATION LAYERS (8 Layers)**

### **LAYER 1: DATABASE SCHEMA** ✅ Already exists in schema_new.ts
- File: `src/models/schema_new.ts`
- Status: ✅ Complete - processSubSchema already defined
- Note: Schema includes foreign key to processSchema, complex fields (arrays, decimals)

---

### **LAYER 2: TYPE DEFINITIONS**
**File to create**: `src/types/processSub.ts`

**Requirements**:
1. **Import schemas**: processSubSchema from schema_new.ts, Process types for relationships
2. **Server/Client types**: Handle Date vs string differences, foreign key relationships
3. **Input types**: Create/Update input types with process validation
4. **API response types**: Consistent with todos pattern
5. **Form data types**: Complex form handling with parent process selection
6. **Filter types**: Advanced filtering including parent process
7. **Enum types**: Multiple enums for dropdowns
8. **Relationship types**: Process lookup and validation

**Key differences from Process table**:
- **Foreign key field**: `processId` with validation
- **Multiple array fields**: `toolRequirements[]`
- **Multiple decimal fields**: Various factors (time, cost, material)
- **Dependency field**: `dependsOnSubCode` for sub-process dependencies
- **Composite uniqueness**: processCode + processSubCode + ownerId

**Example structure**:
```typescript
import type { processSubSchema, processSchema } from '@/models/schema_new';
import type { Process } from './process';

// Server-side type (with Date objects)
export type ProcessSubDb = typeof processSubSchema.$inferSelect;

// Client-side type (dates as strings from API)
export type ProcessSub = Omit<ProcessSubDb, 'createdAt' | 'updatedAt' | 'toolRequirements'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  toolRequirements: string[]; // Ensure array handling
  // Add process relationship for joins
  process?: Process;
};

// Input types
export type CreateProcessSubInput = typeof processSubSchema.$inferInsert;
export type UpdateProcessSubInput = Partial<Omit<CreateProcessSubInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Enum types for dropdowns
export type SubCategory = 'main' | 'auxiliary' | 'support';
export type SubType = 'primary_material' | 'secondary_material' | 'support_material';
export type MaterialType = 'fabric_main' | 'fabric_lining' | 'thread' | 'accessories' | 'other';
export type ComplexityLevel = 1 | 2 | 3 | 4 | 5; // 1=simple, 5=complex
export type SkillLevel = 1 | 2 | 3 | 4 | 5; // 1=basic, 5=expert
export type ProcessSubStatus = 'active' | 'inactive' | 'deprecated';

// API response types following todos pattern
export type ProcessSubsResponse = {
  success: true;
  data: ProcessSub[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type ProcessSubResponse = {
  success: true;
  data: ProcessSub;
  message?: string;
};

export type ProcessSubErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Form data type (comprehensive for complex form)
export type ProcessSubFormData = {
  processId: number;
  processCode: string; // For display and validation
  processSubCode: string;
  processSubName: string;
  subCategory: SubCategory;
  subType: SubType;
  materialType: MaterialType;
  materialConsumptionFactor: number;
  toolRequirements: string[];
  timeFactor: number;
  complexityLevel: ComplexityLevel;
  skillLevelRequired: SkillLevel;
  subSequence: number;
  isOptional: boolean;
  dependsOnSubCode: string;
  hasQualityCheckpoint: boolean;
  qualityCriteria: string;
  laborCostFactor: number;
  materialCostFactor: number;
  overheadCostFactor: number;
  status: ProcessSubStatus;
  isAutomated: boolean;
  description: string;
  specialInstructions: string;
  note: string;
};

// List parameters with process-specific filters
export type ProcessSubListParams = {
  search?: string;
  ownerId: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'processSubName' | 'subSequence' | 'complexityLevel';
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
  // ProcessSub-specific filters
  processId?: number; // Filter by parent process
  processCode?: string; // Filter by parent process code
  subCategory?: SubCategory;
  subType?: SubType;
  materialType?: MaterialType;
  complexityLevel?: ComplexityLevel;
  skillLevelRequired?: SkillLevel;
  status?: ProcessSubStatus;
  isOptional?: boolean;
  isAutomated?: boolean;
  hasQualityCheckpoint?: boolean;
};

// Filter state type for UI
export type ProcessSubFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'processSubName' | 'subSequence' | 'complexityLevel';
  sortOrder: 'asc' | 'desc';
  processId: number | 'all';
  processCode: string;
  subCategory: SubCategory | 'all';
  subType: SubType | 'all';
  materialType: MaterialType | 'all';
  complexityLevel: ComplexityLevel | 'all';
  skillLevelRequired: SkillLevel | 'all';
  status: ProcessSubStatus | 'all';
  isOptional: boolean | 'all';
  isAutomated: boolean | 'all';
  hasQualityCheckpoint: boolean | 'all';
};

// Process lookup type for parent process selection
export type ProcessLookup = {
  id: number;
  processCode: string;
  processName: string;
  status: string;
};

// ProcessSub with process details for display
export type ProcessSubWithProcess = ProcessSub & {
  process: ProcessLookup;
};

// Dependency validation type
export type ProcessSubDependency = {
  processSubCode: string;
  processSubName: string;
  subSequence: number;
};
```

---

### **LAYER 3: VALIDATION SCHEMAS**
**File to create**: `src/libs/validations/processSub.ts`

**Requirements**:
1. **Base schemas**: Create, Update, ID validation with foreign key validation
2. **Complex field validation**: Arrays, multiple decimals, enums, dependencies
3. **Business logic validation**: Sub-sequence order, dependency validation, factor ranges
4. **Relationship validation**: Process existence, sub-code uniqueness within process
5. **List parameters**: Robust null/undefined handling + complex filtering
6. **Form validation**: React Hook Form integration with relationship handling
7. **Helper functions**: Validation utilities for relationships and dependencies

**Key validations needed**:
- **processId**: Must exist and belong to owner
- **processSubCode**: Required, unique per processCode+owner, lowercase format
- **subSequence**: Positive integer, unique per processId
- **dependsOnSubCode**: Must be valid existing sub-process in same process
- **toolRequirements**: Array of non-empty strings
- **decimal factors**: All between 0.01 and 99.99 with 2-4 decimal places
- **complexityLevel/skillLevel**: Integer 1-5
- **materialConsumptionFactor**: Up to 8 decimal places for precision

**Example structure**:
```typescript
import { z } from 'zod';

// Enum schemas
const SubCategorySchema = z.enum(['main', 'auxiliary', 'support']);
const SubTypeSchema = z.enum(['primary_material', 'secondary_material', 'support_material']);
const MaterialTypeSchema = z.enum(['fabric_main', 'fabric_lining', 'thread', 'accessories', 'other']);
const ComplexityLevelSchema = z.number().int().min(1).max(5);
const SkillLevelSchema = z.number().int().min(1).max(5);
const ProcessSubStatusSchema = z.enum(['active', 'inactive', 'deprecated']);

// Decimal factor schemas with specific precision requirements
const TimeFactor = z.number().min(0.01).max(99.99).multipleOf(0.01);
const CostFactor = z.number().min(0.01).max(99.99).multipleOf(0.01);
const MaterialConsumptionFactor = z.number().min(0.0001).max(9999.9999).multipleOf(0.0001); // 8,4 precision

// Base process sub validation
export const CreateProcessSubSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  processId: z.number().int().positive('Process ID must be valid'),
  processCode: z.string().min(1, 'Process code is required'), // Redundant for performance
  processSubCode: z.string()
    .min(1, 'Process sub code is required')
    .max(50, 'Process sub code must be less than 50 characters')
    .regex(/^[a-z_]+$/, 'Process sub code must be lowercase letters and underscores only'),
  processSubName: z.string()
    .min(1, 'Process sub name is required')
    .max(100, 'Process sub name must be less than 100 characters'),
  subCategory: SubCategorySchema.optional(),
  subType: SubTypeSchema.optional(),
  materialType: MaterialTypeSchema.optional(),
  materialConsumptionFactor: MaterialConsumptionFactor.optional(),
  toolRequirements: z.array(z.string().min(1, 'Tool requirement cannot be empty')).default([]),
  timeFactor: TimeFactor.default(1.0),
  complexityLevel: ComplexityLevelSchema.default(1),
  skillLevelRequired: SkillLevelSchema.default(1),
  subSequence: z.number().int().positive('Sub sequence must be positive').optional(),
  isOptional: z.boolean().default(false),
  dependsOnSubCode: z.string().max(50).optional(),
  hasQualityCheckpoint: z.boolean().default(false),
  qualityCriteria: z.string().max(500).optional(),
  laborCostFactor: CostFactor.default(1.0),
  materialCostFactor: CostFactor.default(1.0),
  overheadCostFactor: CostFactor.default(1.0),
  status: ProcessSubStatusSchema.default('active'),
  isAutomated: z.boolean().default(false),
  description: z.string().max(1000).optional(),
  specialInstructions: z.string().max(1000).optional(),
  note: z.string().max(500).optional(),
}).refine(async (data) => {
  // Custom validation for business logic
  // This would need to be implemented with async validation
  return true;
}, {
  message: 'Invalid process sub configuration',
});

// Update schema with optional fields
export const UpdateProcessSubSchema = CreateProcessSubSchema.partial().omit(['ownerId']).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Process sub ID validation
export const ProcessSubIdSchema = z.object({
  id: z.coerce.number().int().positive('Process sub ID must be a positive integer'),
});

// List parameters with complex filtering (enhanced from todos pattern)
export const ProcessSubListParamsSchema = z.object({
  page: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return 1;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 1 : num;
    })
    .pipe(z.number().int().min(1, 'Page must be at least 1')),

  limit: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return 10;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 10 : num;
    })
    .pipe(z.number().int().min(1).max(100, 'Limit cannot exceed 100')),

  search: z.union([z.string(), z.undefined(), z.null()])
    .transform(val => val || undefined).optional(),

  sortBy: z.union([
    z.enum(['createdAt', 'updatedAt', 'processSubName', 'subSequence', 'complexityLevel']), 
    z.undefined(), 
    z.null()
  ]).transform(val => 
    val && ['createdAt', 'updatedAt', 'processSubName', 'subSequence', 'complexityLevel'].includes(val) 
      ? val : 'createdAt'
  ),

  sortOrder: z.union([z.enum(['asc', 'desc']), z.undefined(), z.null()])
    .transform(val => val && ['asc', 'desc'].includes(val) ? val : 'desc'),

  // ProcessSub-specific filters
  processId: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  processCode: z.string().optional(),
  subCategory: SubCategorySchema.optional(),
  subType: SubTypeSchema.optional(),
  materialType: MaterialTypeSchema.optional(),
  complexityLevel: ComplexityLevelSchema.optional(),
  skillLevelRequired: SkillLevelSchema.optional(),
  status: ProcessSubStatusSchema.optional(),
  isOptional: z.union([z.string(), z.boolean(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }).optional(),
  isAutomated: z.union([z.string(), z.boolean(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }).optional(),
  hasQualityCheckpoint: z.union([z.string(), z.boolean(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }).optional(),
});

// Form validation for React Hook Form (simplified for UI)
export const ProcessSubFormSchema = z.object({
  processId: z.number().int().positive('Process must be selected'),
  processCode: z.string().min(1, 'Process code is required'),
  processSubCode: z.string().min(1, 'Process sub code is required').max(50),
  processSubName: z.string().min(1, 'Process sub name is required').max(100),
  subCategory: SubCategorySchema,
  subType: SubTypeSchema,
  materialType: MaterialTypeSchema,
  materialConsumptionFactor: MaterialConsumptionFactor,
  toolRequirements: z.array(z.string().min(1)),
  timeFactor: TimeFactor,
  complexityLevel: ComplexityLevelSchema,
  skillLevelRequired: SkillLevelSchema,
  subSequence: z.number().int().positive(),
  isOptional: z.boolean(),
  dependsOnSubCode: z.string().max(50),
  hasQualityCheckpoint: z.boolean(),
  qualityCriteria: z.string().max(500),
  laborCostFactor: CostFactor,
  materialCostFactor: CostFactor,
  overheadCostFactor: CostFactor,
  status: ProcessSubStatusSchema,
  isAutomated: z.boolean(),
  description: z.string().max(1000),
  specialInstructions: z.string().max(1000),
  note: z.string().max(500),
});

// Request schemas for API
export const CreateProcessSubRequestSchema = CreateProcessSubSchema.omit(['ownerId']);
export const UpdateProcessSubRequestSchema = UpdateProcessSubSchema;

// Type exports
export type CreateProcessSubRequest = z.infer<typeof CreateProcessSubRequestSchema>;
export type UpdateProcessSubRequest = z.infer<typeof UpdateProcessSubRequestSchema>;
export type ProcessSubListParams = z.infer<typeof ProcessSubListParamsSchema>;
export type ProcessSubFormData = z.infer<typeof ProcessSubFormSchema>;

// Validation helper functions
export function validateCreateProcessSub(data: unknown): CreateProcessSubRequest {
  return CreateProcessSubRequestSchema.parse(data);
}

export function validateUpdateProcessSub(data: unknown): UpdateProcessSubRequest {
  return UpdateProcessSubRequestSchema.parse(data);
}

export function validateProcessSubId(data: unknown): { id: number } {
  return ProcessSubIdSchema.parse(data);
}

export function validateProcessSubListParams(data: unknown): ProcessSubListParams {
  return ProcessSubListParamsSchema.parse(data);
}

export function validateProcessSubForm(data: unknown): ProcessSubFormData {
  return ProcessSubFormSchema.parse(data);
}

// Additional validation helpers for business logic
export function validateSubSequenceUniqueness(
  subSequence: number, 
  processId: number, 
  ownerId: string, 
  excludeId?: number
): Promise<boolean> {
  // This would be implemented to check database
  // for sub sequence uniqueness within process
  return Promise.resolve(true);
}

export function validateDependencyExists(
  dependsOnSubCode: string, 
  processId: number, 
  ownerId: string
): Promise<boolean> {
  // This would check if the dependency sub-process exists
  return Promise.resolve(true);
}

export function validateProcessExists(processId: number, ownerId: string): Promise<boolean> {
  // This would check if the parent process exists and belongs to owner
  return Promise.resolve(true);
}
```

---

### **LAYER 4: DATABASE QUERIES**
**File to create**: `src/libs/queries/processSub.ts`

**Requirements**:
1. **CRUD operations**: Create, Read, Update, Delete with ownership and relationship checks
2. **Relationship handling**: Join with Process table, validate foreign keys
3. **Complex filtering**: Multiple filters including parent process, material type, complexity
4. **Business logic validation**: Sub-sequence uniqueness, dependency validation
5. **Array field handling**: PostgreSQL array operations for toolRequirements
6. **Decimal precision**: Proper handling of multiple decimal fields
7. **Dependency queries**: Find dependencies, validate dependency chains

**Key query challenges**:
- **Foreign key validation**: Ensure processId exists and belongs to owner
- **Composite uniqueness**: processCode + processSubCode + ownerId unique constraint
- **Sub-sequence uniqueness**: Within same processId scope
- **Dependency validation**: dependsOnSubCode must exist in same process
- **Array queries**: PostgreSQL array operations for toolRequirements
- **Join queries**: Include parent process information
- **Complex filtering**: Multiple simultaneous filters

**Example structure**:
```typescript
import { and, asc, count, desc, eq, gte, ilike, or, inArray, arrayContains } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { processSubSchema, processSchema } from '@/models/schema_new';
import type { 
  CreateProcessSubInput, 
  UpdateProcessSubInput, 
  ProcessSubDb, 
  ProcessSubListParams,
  ProcessSubWithProcess 
} from '@/types/processSub';

/**
 * Create new process sub with comprehensive validation
 */
export async function createProcessSub(data: CreateProcessSubInput): Promise<ProcessSubDb> {
  // 1. Validate parent process exists and belongs to owner
  const parentProcess = await getProcessForOwner(data.processId, data.ownerId);
  if (!parentProcess) {
    throw new Error('Parent process not found or access denied');
  }

  // 2. Check processSubCode uniqueness within process+owner
  const existingProcessSub = await getProcessSubByCode(
    data.processSubCode, 
    data.processCode, 
    data.ownerId
  );
  if (existingProcessSub) {
    throw new Error(`Process sub code '${data.processSubCode}' already exists in process '${data.processCode}'`);
  }

  // 3. Check subSequence uniqueness within process (if provided)
  if (data.subSequence) {
    const existingSequence = await getProcessSubBySequence(
      data.subSequence, 
      data.processId, 
      data.ownerId
    );
    if (existingSequence) {
      throw new Error(`Sub sequence ${data.subSequence} already exists in this process`);
    }
  }

  // 4. Validate dependency exists (if provided)
  if (data.dependsOnSubCode) {
    const dependencyExists = await getProcessSubByCode(
      data.dependsOnSubCode, 
      data.processCode, 
      data.ownerId
    );
    if (!dependencyExists) {
      throw new Error(`Dependency sub-process '${data.dependsOnSubCode}' does not exist`);
    }
  }

  // 5. Create the process sub
  const [processSub] = await db
    .insert(processSubSchema)
    .values({
      ownerId: data.ownerId,
      processId: data.processId,
      processCode: data.processCode,
      processSubCode: data.processSubCode,
      processSubName: data.processSubName,
      subCategory: data.subCategory,
      subType: data.subType,
      materialType: data.materialType,
      materialConsumptionFactor: data.materialConsumptionFactor?.toString(), // Convert decimal to string
      toolRequirements: data.toolRequirements ?? [],
      timeFactor: data.timeFactor?.toString() ?? '1.0',
      complexityLevel: data.complexityLevel ?? 1,
      skillLevelRequired: data.skillLevelRequired ?? 1,
      subSequence: data.subSequence,
      isOptional: data.isOptional ?? false,
      dependsOnSubCode: data.dependsOnSubCode,
      hasQualityCheckpoint: data.hasQualityCheckpoint ?? false,
      qualityCriteria: data.qualityCriteria,
      laborCostFactor: data.laborCostFactor?.toString() ?? '1.0',
      materialCostFactor: data.materialCostFactor?.toString() ?? '1.0',
      overheadCostFactor: data.overheadCostFactor?.toString() ?? '1.0',
      status: data.status ?? 'active',
      isAutomated: data.isAutomated ?? false,
      description: data.description,
      specialInstructions: data.specialInstructions,
      note: data.note,
    })
    .returning();

  if (!processSub) {
    throw new Error('Failed to create process sub');
  }

  return processSub;
}

/**
 * Get process subs by owner with advanced filtering and joins
 */
export async function getProcessSubsByOwner(params: ProcessSubListParams): Promise<ProcessSubWithProcess[]> {
  const { 
    ownerId, page, limit, search, sortBy = 'createdAt', sortOrder = 'desc',
    processId, processCode, subCategory, subType, materialType, 
    complexityLevel, skillLevelRequired, status, isOptional, isAutomated, hasQualityCheckpoint
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(processSubSchema.ownerId, ownerId);

  // Add search filter (search in multiple fields)
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(processSubSchema.ownerId, ownerId),
      or(
        ilike(processSubSchema.processSubName, searchTerm),
        ilike(processSubSchema.processSubCode, searchTerm),
        ilike(processSubSchema.description, searchTerm),
        ilike(processSubSchema.specialInstructions, searchTerm),
        ilike(processSubSchema.note, searchTerm),
        // Search in array field (PostgreSQL specific)
        arrayContains(processSubSchema.toolRequirements, [searchTerm.replace(/%/g, '')]),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Add processId filter
  if (processId) {
    whereConditions = and(whereConditions, eq(processSubSchema.processId, processId));
  }

  // Add processCode filter
  if (processCode) {
    whereConditions = and(whereConditions, eq(processSubSchema.processCode, processCode));
  }

  // Add subCategory filter
  if (subCategory) {
    whereConditions = and(whereConditions, eq(processSubSchema.subCategory, subCategory));
  }

  // Add subType filter
  if (subType) {
    whereConditions = and(whereConditions, eq(processSubSchema.subType, subType));
  }

  // Add materialType filter
  if (materialType) {
    whereConditions = and(whereConditions, eq(processSubSchema.materialType, materialType));
  }

  // Add complexityLevel filter
  if (complexityLevel) {
    whereConditions = and(whereConditions, eq(processSubSchema.complexityLevel, complexityLevel));
  }

  // Add skillLevelRequired filter
  if (skillLevelRequired) {
    whereConditions = and(whereConditions, eq(processSubSchema.skillLevelRequired, skillLevelRequired));
  }

  // Add status filter
  if (status) {
    whereConditions = and(whereConditions, eq(processSubSchema.status, status));
  }

  // Add boolean filters
  if (typeof isOptional === 'boolean') {
    whereConditions = and(whereConditions, eq(processSubSchema.isOptional, isOptional));
  }

  if (typeof isAutomated === 'boolean') {
    whereConditions = and(whereConditions, eq(processSubSchema.isAutomated, isAutomated));
  }

  if (typeof hasQualityCheckpoint === 'boolean') {
    whereConditions = and(whereConditions, eq(processSubSchema.hasQualityCheckpoint, hasQualityCheckpoint));
  }

  // Build sort order
  const sortColumn = processSubSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute join query with parent process
  return await db
    .select({
      // ProcessSub fields
      id: processSubSchema.id,
      ownerId: processSubSchema.ownerId,
      processId: processSubSchema.processId,
      processCode: processSubSchema.processCode,
      processSubCode: processSubSchema.processSubCode,
      processSubName: processSubSchema.processSubName,
      subCategory: processSubSchema.subCategory,
      subType: processSubSchema.subType,
      materialType: processSubSchema.materialType,
      materialConsumptionFactor: processSubSchema.materialConsumptionFactor,
      toolRequirements: processSubSchema.toolRequirements,
      timeFactor: processSubSchema.timeFactor,
      complexityLevel: processSubSchema.complexityLevel,
      skillLevelRequired: processSubSchema.skillLevelRequired,
      subSequence: processSubSchema.subSequence,
      isOptional: processSubSchema.isOptional,
      dependsOnSubCode: processSubSchema.dependsOnSubCode,
      hasQualityCheckpoint: processSubSchema.hasQualityCheckpoint,
      qualityCriteria: processSubSchema.qualityCriteria,
      laborCostFactor: processSubSchema.laborCostFactor,
      materialCostFactor: processSubSchema.materialCostFactor,
      overheadCostFactor: processSubSchema.overheadCostFactor,
      status: processSubSchema.status,
      isAutomated: processSubSchema.isAutomated,
      description: processSubSchema.description,
      specialInstructions: processSubSchema.specialInstructions,
      note: processSubSchema.note,
      createdAt: processSubSchema.createdAt,
      updatedAt: processSubSchema.updatedAt,
      // Parent process fields
      process: {
        id: processSchema.id,
        processCode: processSchema.processCode,
        processName: processSchema.processName,
        status: processSchema.status,
      },
    })
    .from(processSubSchema)
    .leftJoin(processSchema, eq(processSubSchema.processId, processSchema.id))
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get process sub by composite code (processCode + processSubCode + ownerId)
 */
export async function getProcessSubByCode(
  processSubCode: string, 
  processCode: string, 
  ownerId: string
): Promise<ProcessSubDb | null> {
  const [processSub] = await db
    .select()
    .from(processSubSchema)
    .where(
      and(
        eq(processSubSchema.processSubCode, processSubCode),
        eq(processSubSchema.processCode, processCode),
        eq(processSubSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return processSub ?? null;
}

/**
 * Get process sub by sequence within process
 */
export async function getProcessSubBySequence(
  subSequence: number, 
  processId: number, 
  ownerId: string
): Promise<ProcessSubDb | null> {
  const [processSub] = await db
    .select()
    .from(processSubSchema)
    .where(
      and(
        eq(processSubSchema.subSequence, subSequence),
        eq(processSubSchema.processId, processId),
        eq(processSubSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return processSub ?? null;
}

/**
 * Get parent process for validation
 */
async function getProcessForOwner(processId: number, ownerId: string): Promise<{ id: number } | null> {
  const [process] = await db
    .select({ id: processSchema.id })
    .from(processSchema)
    .where(
      and(
        eq(processSchema.id, processId),
        eq(processSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return process ?? null;
}

/**
 * Get process sub by ID with ownership check
 */
export async function getProcessSubById(id: number, ownerId: string): Promise<ProcessSubDb | null> {
  const [processSub] = await db
    .select()
    .from(processSubSchema)
    .where(
      and(
        eq(processSubSchema.id, id),
        eq(processSubSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return processSub ?? null;
}

/**
 * Update process sub with comprehensive validation
 */
export async function updateProcessSub(
  id: number,
  ownerId: string,
  data: UpdateProcessSubInput,
): Promise<ProcessSubDb> {
  // Check ownership first
  const existingProcessSub = await getProcessSubById(id, ownerId);
  if (!existingProcessSub) {
    throw new Error('Process sub not found or access denied');
  }

  // Validate parent process if changed
  if (data.processId && data.processId !== existingProcessSub.processId) {
    const parentProcess = await getProcessForOwner(data.processId, ownerId);
    if (!parentProcess) {
      throw new Error('Parent process not found or access denied');
    }
  }

  // Check processSubCode uniqueness if changed
  if (data.processSubCode && data.processSubCode !== existingProcessSub.processSubCode) {
    const processCode = data.processCode ?? existingProcessSub.processCode;
    const existingCode = await getProcessSubByCode(data.processSubCode, processCode, ownerId);
    if (existingCode && existingCode.id !== id) {
      throw new Error(`Process sub code '${data.processSubCode}' already exists in process '${processCode}'`);
    }
  }

  // Check subSequence uniqueness if changed
  if (data.subSequence && data.subSequence !== existingProcessSub.subSequence) {
    const processId = data.processId ?? existingProcessSub.processId;
    const existingSequence = await getProcessSubBySequence(data.subSequence, processId, ownerId);
    if (existingSequence && existingSequence.id !== id) {
      throw new Error(`Sub sequence ${data.subSequence} already exists in this process`);
    }
  }

  // Validate dependency if changed
  if (data.dependsOnSubCode !== undefined && data.dependsOnSubCode !== existingProcessSub.dependsOnSubCode) {
    if (data.dependsOnSubCode) {
      const processCode = data.processCode ?? existingProcessSub.processCode;
      const dependencyExists = await getProcessSubByCode(data.dependsOnSubCode, processCode, ownerId);
      if (!dependencyExists) {
        throw new Error(`Dependency sub-process '${data.dependsOnSubCode}' does not exist`);
      }
    }
  }

  const [updatedProcessSub] = await db
    .update(processSubSchema)
    .set({
      processId: data.processId ?? existingProcessSub.processId,
      processCode: data.processCode ?? existingProcessSub.processCode,
      processSubCode: data.processSubCode ?? existingProcessSub.processSubCode,
      processSubName: data.processSubName ?? existingProcessSub.processSubName,
      subCategory: data.subCategory ?? existingProcessSub.subCategory,
      subType: data.subType ?? existingProcessSub.subType,
      materialType: data.materialType ?? existingProcessSub.materialType,
      materialConsumptionFactor: data.materialConsumptionFactor?.toString() ?? existingProcessSub.materialConsumptionFactor,
      toolRequirements: data.toolRequirements ?? existingProcessSub.toolRequirements,
      timeFactor: data.timeFactor?.toString() ?? existingProcessSub.timeFactor,
      complexityLevel: data.complexityLevel ?? existingProcessSub.complexityLevel,
      skillLevelRequired: data.skillLevelRequired ?? existingProcessSub.skillLevelRequired,
      subSequence: data.subSequence ?? existingProcessSub.subSequence,
      isOptional: data.isOptional ?? existingProcessSub.isOptional,
      dependsOnSubCode: data.dependsOnSubCode ?? existingProcessSub.dependsOnSubCode,
      hasQualityCheckpoint: data.hasQualityCheckpoint ?? existingProcessSub.hasQualityCheckpoint,
      qualityCriteria: data.qualityCriteria ?? existingProcessSub.qualityCriteria,
      laborCostFactor: data.laborCostFactor?.toString() ?? existingProcessSub.laborCostFactor,
      materialCostFactor: data.materialCostFactor?.toString() ?? existingProcessSub.materialCostFactor,
      overheadCostFactor: data.overheadCostFactor?.toString() ?? existingProcessSub.overheadCostFactor,
      status: data.status ?? existingProcessSub.status,
      isAutomated: data.isAutomated ?? existingProcessSub.isAutomated,
      description: data.description ?? existingProcessSub.description,
      specialInstructions: data.specialInstructions ?? existingProcessSub.specialInstructions,
      note: data.note ?? existingProcessSub.note,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(processSubSchema.id, id),
        eq(processSubSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedProcessSub) {
    throw new Error('Failed to update process sub');
  }

  return updatedProcessSub;
}

/**
 * Delete process sub with dependency validation
 */
export async function deleteProcessSub(id: number, ownerId: string): Promise<boolean> {
  // Check ownership first
  const existingProcessSub = await getProcessSubById(id, ownerId);
  if (!existingProcessSub) {
    throw new Error('Process sub not found or access denied');
  }

  // Check if any other process subs depend on this one
  const [dependentProcessSub] = await db
    .select()
    .from(processSubSchema)
    .where(
      and(
        eq(processSubSchema.dependsOnSubCode, existingProcessSub.processSubCode),
        eq(processSubSchema.processCode, existingProcessSub.processCode),
        eq(processSubSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  if (dependentProcessSub) {
    throw new Error(`Cannot delete process sub '${existingProcessSub.processSubCode}' because it has dependent sub-processes`);
  }

  await db
    .delete(processSubSchema)
    .where(
      and(
        eq(processSubSchema.id, id),
        eq(processSubSchema.ownerId, ownerId),
      ),
    );

  return true;
}

/**
 * Get total count for pagination with filtering
 */
export async function getProcessSubsCount(
  ownerId: string, 
  filters: Partial<ProcessSubListParams> = {}
): Promise<number> {
  const { 
    search, processId, processCode, subCategory, subType, materialType,
    complexityLevel, skillLevelRequired, status, isOptional, isAutomated, hasQualityCheckpoint
  } = filters;

  // Build where conditions (same as getProcessSubsByOwner)
  let whereConditions = eq(processSubSchema.ownerId, ownerId);

  // Apply all the same filters as in getProcessSubsByOwner
  // (implementation similar to above but for count query)

  const [result] = await db
    .select({ count: count() })
    .from(processSubSchema)
    .where(whereConditions);

  return result?.count ?? 0;
}

/**
 * Get paginated process subs with metadata
 */
export async function getPaginatedProcessSubs(params: ProcessSubListParams): Promise<{
  processSubs: ProcessSubWithProcess[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const [processSubs, total] = await Promise.all([
    getProcessSubsByOwner(params),
    getProcessSubsCount(params.ownerId, params),
  ]);

  const hasMore = params.page * params.limit < total;

  return {
    processSubs,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      hasMore,
    },
  };
}

/**
 * Get process subs by parent process (utility function)
 */
export async function getProcessSubsByProcess(
  processId: number, 
  ownerId: string
): Promise<ProcessSubDb[]> {
  return await db
    .select()
    .from(processSubSchema)
    .where(
      and(
        eq(processSubSchema.processId, processId),
        eq(processSubSchema.ownerId, ownerId),
      ),
    )
    .orderBy(asc(processSubSchema.subSequence));
}

/**
 * Get available processes for dropdown (utility function)
 */
export async function getAvailableProcesses(ownerId: string): Promise<ProcessLookup[]> {
  return await db
    .select({
      id: processSchema.id,
      processCode: processSchema.processCode,
      processName: processSchema.processName,
      status: processSchema.status,
    })
    .from(processSchema)
    .where(
      and(
        eq(processSchema.ownerId, ownerId),
        eq(processSchema.status, 'active'),
      ),
    )
    .orderBy(asc(processSchema.sequenceOrder));
}
```

---

### **LAYER 5: API ROUTES**
**Files to create**: 
- `src/app/api/process-subs/route.ts` (GET list, POST create)
- `src/app/api/process-subs/[id]/route.ts` (GET, PUT, DELETE by ID)
- `src/app/api/process-subs/processes/route.ts` (GET available processes for dropdown)

**Requirements**:
1. **Authentication**: Clerk integration (copy from todos exactly)
2. **Multi-tenancy**: orgId || userId pattern
3. **Complex validation**: Foreign key validation, business logic validation
4. **Error handling**: Specific error handling for relationships and constraints
5. **Multiple endpoints**: Main CRUD + utility endpoints for relationships
6. **Array/decimal handling**: Proper JSON serialization/deserialization

---

### **LAYER 6: API CLIENT**
**File to create**: `src/libs/api/processSubs.ts`

**Requirements**:
1. **Client functions**: CRUD operations + relationship utilities
2. **Complex parameter handling**: Multiple filters, arrays, decimals
3. **Relationship support**: Parent process lookups
4. **Type safety**: Full TypeScript integration

---

### **LAYER 7: REACT HOOKS**
**Files to create**:
- `src/hooks/useProcessSubs.ts` (data fetching with relationships)
- `src/hooks/useProcessSubMutations.ts` (CRUD mutations)
- `src/hooks/useProcessSubFilters.ts` (complex filtering)
- `src/hooks/useProcessLookup.ts` (parent process selection)

**Requirements**:
1. **Relationship handling**: Parent process integration
2. **Complex state management**: Multiple filters, arrays, decimals
3. **Validation hooks**: Real-time validation for relationships
4. **Performance optimization**: Proper dependency management

---

### **LAYER 8: REACT COMPONENTS**
**Files to create**:
- `src/features/processSub/ProcessSubForm.tsx` (complex form with relationships)
- `src/features/processSub/ProcessSubList.tsx` (advanced filtering)
- `src/features/processSub/ProcessSubSkeleton.tsx` (loading states)
- `src/features/processSub/ProcessSelector.tsx` (parent process selection)
- `src/app/[locale]/(auth)/dashboard/process-subs/page.tsx` (main page)

**Requirements**:
1. **Complex form handling**: Multiple input types, arrays, decimals, relationships
2. **Parent selection**: Process dropdown with validation
3. **Advanced filtering**: Multiple filter types with relationships
4. **Array inputs**: Tool requirements multi-input
5. **Decimal inputs**: Multiple factor inputs with precision
6. **Dependency management**: Sub-process dependency selection

---

## 🔥 **CRITICAL IMPLEMENTATION NOTES**

### **1. Foreign Key Relationship (processId)**
- **Validation**: Must exist and belong to owner
- **Forms**: Dropdown selection with process lookup
- **Display**: Show parent process information in lists
- **Cascade**: Handle cascade delete scenarios

### **2. Composite Uniqueness (processCode + processSubCode + ownerId)**
- **Database**: Use composite unique index
- **Validation**: Check uniqueness during create/update
- **Forms**: Real-time validation during input
- **Error handling**: Clear error messages for conflicts

### **3. Array Field (toolRequirements)**
- **Database**: PostgreSQL array type
- **API**: JSON array serialization
- **Forms**: Multi-input or tag input component
- **Validation**: Array of non-empty strings

### **4. Multiple Decimal Fields (factors)**
- **Database**: Store as decimal strings for precision
- **API**: Handle as numbers with proper precision
- **Forms**: Number inputs with specific step values
- **Validation**: Range validation with precision rules

### **5. Dependency Management (dependsOnSubCode)**
- **Validation**: Must exist within same process
- **Forms**: Dropdown filtered by same process
- **Business logic**: Prevent circular dependencies
- **Cascade**: Handle dependency cleanup on delete

### **6. Sub-Sequence Management**
- **Uniqueness**: Within same processId scope
- **Ordering**: Logical sequence for workflow
- **Validation**: Positive integers, gaps allowed
- **Forms**: Number input with real-time validation

---

## 📋 **TESTING REQUIREMENTS**

### **Unit Tests**:
- [ ] Foreign key validation functions
- [ ] Composite uniqueness checking
- [ ] Array field handling (toolRequirements)
- [ ] Decimal precision handling (all factors)
- [ ] Dependency validation logic
- [ ] Sub-sequence uniqueness validation

### **Integration Tests**:
- [ ] API routes with relationship validation
- [ ] Complex filtering with multiple parameters
- [ ] Business logic error scenarios
- [ ] Cascade delete behavior
- [ ] Array and decimal field processing

### **Component Tests**:
- [ ] ProcessSubForm with all input types
- [ ] Parent process selection component
- [ ] Array input component (tool requirements)
- [ ] Decimal input components (factors)
- [ ] Complex filtering interface
- [ ] Dependency selection functionality

---

## 🎯 **SUCCESS CRITERIA**

After completing this implementation, the system should support:

✅ **Full CRUD operations** with parent-child relationships
✅ **Complex data types**: Arrays, multiple decimals, enums, booleans
✅ **Relationship integrity**: Foreign key validation and cascades
✅ **Business logic enforcement**: Uniqueness, dependencies, sequences
✅ **Advanced filtering**: By parent process, material type, complexity, etc.
✅ **Performance optimization**: Proper joins and indexing
✅ **Type safety**: End-to-end TypeScript with relationships
✅ **Error handling**: Business logic specific error messages
✅ **UI complexity**: Forms with multiple input types and validations

---

This plan handles the significant complexity increase from Process to ProcessSub, including foreign key relationships, composite uniqueness constraints, array fields, multiple decimal fields, and dependency management while maintaining the established todos pattern.