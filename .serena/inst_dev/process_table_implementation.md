# 🏭 PROCESS TABLE IMPLEMENTATION PLAN

## 🎯 **OBJECTIVE**
Implement complete CRUD functionality for Process table (CAT, MAY, THEU, DONG_GOI) following Yamato-SaaS todos pattern exactly. This plan provides step-by-step instructions for a junior developer to implement all layers from database to UI.

## 📋 **OVERVIEW**
Process table manages main production processes in textile manufacturing:
- **processCode**: CAT, MAY, THEU, DONG_GOI  
- **processName**: Cắt, May, Thêu, Đóng gói
- **Complex fields**: Arrays, decimals, booleans, enums
- **Business logic**: Sequencing, dependencies, capacity management

## 🏗️ **IMPLEMENTATION LAYERS (8 Layers)**

### **LAYER 1: DATABASE SCHEMA** ✅ Already exists in schema_new.ts
- File: `src/models/schema_new.ts`
- Status: ✅ Complete - processSchema already defined
- Note: Schema includes advanced features (arrays, decimals, indexes)

---

### **LAYER 2: TYPE DEFINITIONS**
**File to create**: `src/types/process.ts`

**Requirements**:
1. **Import schema**: Import processSchema from schema_new.ts
2. **Server/Client types**: Handle Date vs string differences  
3. **Input types**: Create/Update input types
4. **API response types**: Consistent with todos pattern
5. **Form data types**: For React Hook Form
6. **Filter types**: For search and sorting
7. **Enum types**: For dropdowns and validation

**Key differences from todos**:
- **Array field**: `prerequisiteProcesses: string[]`
- **Decimal field**: `defectTolerancePercent: number`
- **Multiple booleans**: `qualityCheckRequired`, `isParallelAllowed`, etc.
- **Enum fields**: `processCategory`, `processType`, `status`

**Example structure**:
```typescript
// Server-side type (with Date objects)
export type ProcessDb = typeof processSchema.$inferSelect;

// Client-side type (dates as strings from API)
export type Process = Omit<ProcessDb, 'createdAt' | 'updatedAt' | 'prerequisiteProcesses'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  prerequisiteProcesses: string[]; // Ensure array handling
};

// Input types
export type CreateProcessInput = typeof processSchema.$inferInsert;
export type UpdateProcessInput = Partial<Omit<CreateProcessInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Enum types for dropdowns
export type ProcessCategory = 'production' | 'quality' | 'packaging';
export type ProcessType = 'manual' | 'machine' | 'hybrid'; 
export type ProcessStatus = 'active' | 'inactive' | 'deprecated';

// API response types (follow todos pattern exactly)
export type ProcessesResponse = {
  success: true;
  data: Process[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type ProcessResponse = {
  success: true;
  data: Process;
  message?: string;
};

export type ProcessErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Form data type (simplified for forms)
export type ProcessFormData = {
  processCode: string;
  processName: string;
  processCategory: ProcessCategory;
  processType: ProcessType;
  department: string;
  sequenceOrder: number;
  isParallelAllowed: boolean;
  prerequisiteProcesses: string[];
  standardTimePerUnit: number;
  setupTime: number;
  defaultCapacityPerDay: number;
  qualityCheckRequired: boolean;
  qualityStandards: string;
  defectTolerancePercent: number;
  isOutsourceable: boolean;
  description: string;
  sopDocumentUrl: string;
  trainingRequired: string;
};

// List parameters
export type ProcessListParams = {
  search?: string;
  ownerId: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'processName' | 'sequenceOrder';
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
  // Process-specific filters
  processCategory?: ProcessCategory;
  processType?: ProcessType;
  status?: ProcessStatus;
  department?: string;
};

// Filter state type
export type ProcessFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'processName' | 'sequenceOrder';
  sortOrder: 'asc' | 'desc';
  processCategory: ProcessCategory | 'all';
  processType: ProcessType | 'all';
  status: ProcessStatus | 'all';
  department: string;
};
```

---

### **LAYER 3: VALIDATION SCHEMAS**
**File to create**: `src/libs/validations/process.ts`

**Requirements**:
1. **Base schemas**: Create, Update, ID validation
2. **Complex field validation**: Arrays, decimals, enums
3. **Business logic validation**: Sequence order, capacity limits
4. **List parameters**: Robust null/undefined handling (like todos)
5. **Form validation**: React Hook Form integration
6. **Helper functions**: Validation utilities

**Key validations needed**:
- **processCode**: Required, unique per owner, uppercase format
- **prerequisiteProcesses**: Array of valid process codes
- **defectTolerancePercent**: Decimal 0-100 with 2 decimal places
- **sequenceOrder**: Positive integer, unique per owner
- **capacity values**: Positive integers
- **time values**: Positive integers (minutes)
- **enum validations**: Strict enum checking

**Example structure**:
```typescript
import { z } from 'zod';

// Enum schemas
const ProcessCategorySchema = z.enum(['production', 'quality', 'packaging']);
const ProcessTypeSchema = z.enum(['manual', 'machine', 'hybrid']);
const ProcessStatusSchema = z.enum(['active', 'inactive', 'deprecated']);

// Base process validation
export const CreateProcessSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  processCode: z.string()
    .min(1, 'Process code is required')
    .max(20, 'Process code must be less than 20 characters')
    .regex(/^[A-Z_]+$/, 'Process code must be uppercase letters and underscores only'),
  processName: z.string()
    .min(1, 'Process name is required')
    .max(100, 'Process name must be less than 100 characters'),
  processCategory: ProcessCategorySchema.optional(),
  processType: ProcessTypeSchema.optional(),
  department: z.string().max(100).optional(),
  sequenceOrder: z.number().int().positive('Sequence order must be positive').optional(),
  isParallelAllowed: z.boolean().default(false),
  prerequisiteProcesses: z.array(z.string()).default([]),
  standardTimePerUnit: z.number().int().positive('Standard time must be positive').optional(),
  setupTime: z.number().int().min(0, 'Setup time cannot be negative').optional(),
  defaultCapacityPerDay: z.number().int().positive('Capacity must be positive').optional(),
  qualityCheckRequired: z.boolean().default(true),
  qualityStandards: z.string().max(500).optional(),
  defectTolerancePercent: z.number()
    .min(0, 'Defect tolerance cannot be negative')
    .max(100, 'Defect tolerance cannot exceed 100%')
    .multipleOf(0.01, 'Maximum 2 decimal places')
    .optional(),
  status: ProcessStatusSchema.default('active'),
  isOutsourceable: z.boolean().default(false),
  description: z.string().max(1000).optional(),
  sopDocumentUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  trainingRequired: z.string().max(500).optional(),
});

// List parameters with robust null handling (copy from todos pattern)
export const ProcessListParamsSchema = z.object({
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
    z.enum(['createdAt', 'updatedAt', 'processName', 'sequenceOrder']), 
    z.undefined(), 
    z.null()
  ]).transform(val => 
    val && ['createdAt', 'updatedAt', 'processName', 'sequenceOrder'].includes(val) 
      ? val : 'createdAt'
  ),

  sortOrder: z.union([z.enum(['asc', 'desc']), z.undefined(), z.null()])
    .transform(val => val && ['asc', 'desc'].includes(val) ? val : 'desc'),

  // Process-specific filters
  processCategory: ProcessCategorySchema.optional(),
  processType: ProcessTypeSchema.optional(), 
  status: ProcessStatusSchema.optional(),
  department: z.string().optional(),
});

// Form validation for React Hook Form
export const ProcessFormSchema = z.object({
  processCode: z.string().min(1, 'Process code is required').max(20),
  processName: z.string().min(1, 'Process name is required').max(100),
  processCategory: ProcessCategorySchema,
  processType: ProcessTypeSchema,
  department: z.string().max(100),
  sequenceOrder: z.number().int().positive(),
  isParallelAllowed: z.boolean(),
  prerequisiteProcesses: z.array(z.string()),
  standardTimePerUnit: z.number().int().positive(),
  setupTime: z.number().int().min(0),
  defaultCapacityPerDay: z.number().int().positive(),
  qualityCheckRequired: z.boolean(),
  qualityStandards: z.string().max(500),
  defectTolerancePercent: z.number().min(0).max(100).multipleOf(0.01),
  isOutsourceable: z.boolean(),
  description: z.string().max(1000),
  sopDocumentUrl: z.string().url().optional().or(z.literal('')),
  trainingRequired: z.string().max(500),
});

// Validation helper functions
export function validateCreateProcess(data: unknown): CreateProcessRequest {
  return CreateProcessRequestSchema.parse(data);
}

export function validateUpdateProcess(data: unknown): UpdateProcessRequest {
  return UpdateProcessRequestSchema.parse(data);
}

export function validateProcessId(data: unknown): { id: number } {
  return ProcessIdSchema.parse(data);
}

export function validateProcessListParams(data: unknown): ProcessListParams {
  return ProcessListParamsSchema.parse(data);
}

export function validateProcessForm(data: unknown): ProcessFormData {
  return ProcessFormSchema.parse(data);
}
```

---

### **LAYER 4: DATABASE QUERIES**
**File to create**: `src/libs/queries/process.ts`

**Requirements**:
1. **CRUD operations**: Create, Read, Update, Delete with ownership checks
2. **Pagination support**: Offset-based pagination like todos
3. **Search functionality**: Process name, code, description search
4. **Filtering**: By category, type, status, department
5. **Sorting**: Multiple sort fields with direction
6. **Complex field handling**: Arrays, decimals, proper JSON handling
7. **Business logic**: Unique constraints, dependency validation

**Key query challenges**:
- **Array field queries**: PostgreSQL array operations for prerequisiteProcesses
- **Decimal precision**: Proper handling of defectTolerancePercent
- **Complex filtering**: Multiple filter combinations
- **Sequence validation**: Ensure unique sequence per owner
- **Code uniqueness**: Validate processCode uniqueness per owner

**Example structure**:
```typescript
import { and, asc, count, desc, eq, gte, ilike, or, inArray } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { processSchema } from '@/models/schema_new';

/**
 * Create new process with business validation
 */
export async function createProcess(data: CreateProcessInput): Promise<ProcessDb> {
  // Check if processCode already exists for this owner
  const existingProcess = await getProcessByCode(data.processCode, data.ownerId);
  if (existingProcess) {
    throw new Error(`Process code '${data.processCode}' already exists`);
  }

  // Check if sequenceOrder is unique (if provided)
  if (data.sequenceOrder) {
    const existingSequence = await getProcessBySequence(data.sequenceOrder, data.ownerId);
    if (existingSequence) {
      throw new Error(`Sequence order ${data.sequenceOrder} already exists`);
    }
  }

  const [process] = await db
    .insert(processSchema)
    .values({
      ownerId: data.ownerId,
      processCode: data.processCode,
      processName: data.processName,
      processCategory: data.processCategory,
      processType: data.processType,
      department: data.department,
      sequenceOrder: data.sequenceOrder,
      isParallelAllowed: data.isParallelAllowed ?? false,
      prerequisiteProcesses: data.prerequisiteProcesses ?? [],
      standardTimePerUnit: data.standardTimePerUnit,
      setupTime: data.setupTime,
      defaultCapacityPerDay: data.defaultCapacityPerDay,
      qualityCheckRequired: data.qualityCheckRequired ?? true,
      qualityStandards: data.qualityStandards,
      defectTolerancePercent: data.defectTolerancePercent?.toString(), // Convert to string for DB
      status: data.status ?? 'active',
      isOutsourceable: data.isOutsourceable ?? false,
      description: data.description,
      sopDocumentUrl: data.sopDocumentUrl,
      trainingRequired: data.trainingRequired,
    })
    .returning();

  if (!process) {
    throw new Error('Failed to create process');
  }

  return process;
}

/**
 * Get processes by owner with advanced filtering
 */
export async function getProcessesByOwner(params: ProcessListParams): Promise<ProcessDb[]> {
  const { 
    ownerId, page, limit, search, sortBy = 'createdAt', sortOrder = 'desc',
    processCategory, processType, status, department 
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(processSchema.ownerId, ownerId);

  // Add search filter (search in multiple fields)
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(processSchema.ownerId, ownerId),
      or(
        ilike(processSchema.processName, searchTerm),
        ilike(processSchema.processCode, searchTerm),
        ilike(processSchema.description, searchTerm),
        ilike(processSchema.department, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Add category filter
  if (processCategory) {
    whereConditions = and(whereConditions, eq(processSchema.processCategory, processCategory));
  }

  // Add type filter
  if (processType) {
    whereConditions = and(whereConditions, eq(processSchema.processType, processType));
  }

  // Add status filter
  if (status) {
    whereConditions = and(whereConditions, eq(processSchema.status, status));
  }

  // Add department filter
  if (department) {
    whereConditions = and(whereConditions, ilike(processSchema.department, `%${department}%`));
  }

  // Build sort order
  const sortColumn = processSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  return await db
    .select()
    .from(processSchema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get process by code (for uniqueness validation)
 */
export async function getProcessByCode(processCode: string, ownerId: string): Promise<ProcessDb | null> {
  const [process] = await db
    .select()
    .from(processSchema)
    .where(
      and(
        eq(processSchema.processCode, processCode),
        eq(processSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return process ?? null;
}

/**
 * Get process by sequence order (for uniqueness validation)
 */
export async function getProcessBySequence(sequenceOrder: number, ownerId: string): Promise<ProcessDb | null> {
  const [process] = await db
    .select()
    .from(processSchema)
    .where(
      and(
        eq(processSchema.sequenceOrder, sequenceOrder),
        eq(processSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return process ?? null;
}

/**
 * Update process with business validation
 */
export async function updateProcess(
  id: number,
  ownerId: string,
  data: UpdateProcessInput,
): Promise<ProcessDb> {
  // Check ownership first
  const existingProcess = await getProcessById(id, ownerId);
  if (!existingProcess) {
    throw new Error('Process not found or access denied');
  }

  // Check processCode uniqueness if changed
  if (data.processCode && data.processCode !== existingProcess.processCode) {
    const existingCodeProcess = await getProcessByCode(data.processCode, ownerId);
    if (existingCodeProcess) {
      throw new Error(`Process code '${data.processCode}' already exists`);
    }
  }

  // Check sequence uniqueness if changed
  if (data.sequenceOrder && data.sequenceOrder !== existingProcess.sequenceOrder) {
    const existingSequenceProcess = await getProcessBySequence(data.sequenceOrder, ownerId);
    if (existingSequenceProcess) {
      throw new Error(`Sequence order ${data.sequenceOrder} already exists`);
    }
  }

  const [updatedProcess] = await db
    .update(processSchema)
    .set({
      processCode: data.processCode ?? existingProcess.processCode,
      processName: data.processName ?? existingProcess.processName,
      processCategory: data.processCategory ?? existingProcess.processCategory,
      processType: data.processType ?? existingProcess.processType,
      department: data.department ?? existingProcess.department,
      sequenceOrder: data.sequenceOrder ?? existingProcess.sequenceOrder,
      isParallelAllowed: data.isParallelAllowed ?? existingProcess.isParallelAllowed,
      prerequisiteProcesses: data.prerequisiteProcesses ?? existingProcess.prerequisiteProcesses,
      standardTimePerUnit: data.standardTimePerUnit ?? existingProcess.standardTimePerUnit,
      setupTime: data.setupTime ?? existingProcess.setupTime,
      defaultCapacityPerDay: data.defaultCapacityPerDay ?? existingProcess.defaultCapacityPerDay,
      qualityCheckRequired: data.qualityCheckRequired ?? existingProcess.qualityCheckRequired,
      qualityStandards: data.qualityStandards ?? existingProcess.qualityStandards,
      defectTolerancePercent: data.defectTolerancePercent?.toString() ?? existingProcess.defectTolerancePercent,
      status: data.status ?? existingProcess.status,
      isOutsourceable: data.isOutsourceable ?? existingProcess.isOutsourceable,
      description: data.description ?? existingProcess.description,
      sopDocumentUrl: data.sopDocumentUrl ?? existingProcess.sopDocumentUrl,
      trainingRequired: data.trainingRequired ?? existingProcess.trainingRequired,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(processSchema.id, id),
        eq(processSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedProcess) {
    throw new Error('Failed to update process');
  }

  return updatedProcess;
}

// ... other CRUD functions following todos pattern exactly
// (getProcessById, deleteProcess, getProcessesCount, getPaginatedProcesses)
```

---

### **LAYER 5: API ROUTES**
**Files to create**: 
- `src/app/api/processes/route.ts` (GET list, POST create)
- `src/app/api/processes/[id]/route.ts` (GET, PUT, DELETE by ID)

**Requirements**:
1. **Authentication**: Clerk integration (copy from todos exactly)
2. **Multi-tenancy**: orgId || userId pattern
3. **Validation**: Zod validation with proper error handling
4. **Error handling**: Consistent error response format
5. **HTTP status codes**: Proper REST conventions
6. **Complex field handling**: Arrays, decimals in requests/responses

**Key API considerations**:
- **Array handling**: prerequisiteProcesses in JSON
- **Decimal precision**: defectTolerancePercent formatting
- **Enum validation**: processCategory, processType, status
- **Business logic errors**: Unique constraints, dependencies

**Example structure for main route**:
```typescript
// src/app/api/processes/route.ts
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { createProcess, getPaginatedProcesses } from '@/libs/queries/process';
import { validateCreateProcess, validateProcessListParams } from '@/libs/validations/process';
import type { ProcessErrorResponse, ProcessResponse, ProcessesResponse } from '@/types/process';

/**
 * GET /api/processes - List processes with pagination and filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse<ProcessesResponse | ProcessErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const ownerId = orgId || userId;

    // Parse query parameters with proper null handling (copy from todos)
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      // Process-specific filters
      processCategory: searchParams.get('processCategory') || undefined,
      processType: searchParams.get('processType') || undefined,
      status: searchParams.get('status') || undefined,
      department: searchParams.get('department') || undefined,
    };

    const validatedParams = { ...validateProcessListParams(queryParams), ownerId };
    const result = await getPaginatedProcesses(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.processes,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching processes:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/processes - Create new process
 */
export async function POST(request: NextRequest): Promise<NextResponse<ProcessResponse | ProcessErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const ownerId = orgId || userId;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateCreateProcess(body);

    // Create process with owner information
    const process = await createProcess({
      ...validatedData,
      ownerId,
    });

    return NextResponse.json(
      {
        success: true,
        data: process,
        message: 'Process created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating process:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      // Handle business logic errors (unique constraints, etc.)
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'DUPLICATE_ERROR' },
          { status: 409 }, // Conflict
        );
      }

      return NextResponse.json(
        { success: false, error: error.message, code: 'CREATE_ERROR' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
```

---

### **LAYER 6: API CLIENT**
**File to create**: `src/libs/api/processes.ts`

**Requirements**:
1. **Client functions**: fetch, create, update, delete processes
2. **Type safety**: Full TypeScript integration
3. **Error handling**: Proper error propagation
4. **Query parameters**: URLSearchParams construction
5. **Complex data handling**: Arrays, decimals in requests

**Key considerations**:
- **Array serialization**: prerequisiteProcesses handling
- **Decimal precision**: defectTolerancePercent formatting
- **Filter parameters**: Multiple filter options
- **Default values**: Consistent with todos pattern

---

### **LAYER 7: REACT HOOKS**
**Files to create**:
- `src/hooks/useProcesses.ts` (data fetching)
- `src/hooks/useProcessMutations.ts` (CRUD mutations)
- `src/hooks/useProcessFilters.ts` (filtering and search)

**Requirements**:
1. **Data fetching hook**: Pagination, search, filtering
2. **Mutations hook**: Create, update, delete with loading states
3. **Filters hook**: Complex filtering state management
4. **Performance**: Proper dependency handling (avoid object refs)
5. **Error handling**: Consistent error state management

**Key hook considerations**:
- **Complex filters**: Multiple filter types (category, type, status)
- **Array handling**: prerequisiteProcesses state management
- **Decimal validation**: Real-time validation for defectTolerancePercent
- **Dependencies**: Primitive values in useCallback (critical!)

---

### **LAYER 8: REACT COMPONENTS**
**Files to create**:
- `src/features/process/ProcessForm.tsx` (create/edit form)
- `src/features/process/ProcessList.tsx` (list with filters)
- `src/features/process/ProcessSkeleton.tsx` (loading skeleton)
- `src/app/[locale]/(auth)/dashboard/processes/page.tsx` (main page)

**Requirements**:
1. **ProcessForm**: React Hook Form with complex validation
2. **ProcessList**: Advanced filtering and search
3. **ProcessSkeleton**: Loading states
4. **Page integration**: Modal pattern for create/edit
5. **Internationalization**: i18n support
6. **Complex inputs**: Arrays, decimals, enums, booleans

**Key form challenges**:
- **Array input**: prerequisiteProcesses multi-select
- **Decimal input**: defectTolerancePercent with precision
- **Enum dropdowns**: processCategory, processType, status
- **Boolean toggles**: Multiple checkboxes
- **Dependent fields**: Business logic in form
- **Validation**: Real-time validation with proper error display

---

## 🔥 **CRITICAL IMPLEMENTATION NOTES**

### **1. Array Field Handling (prerequisiteProcesses)**
- **Database**: Store as PostgreSQL array type
- **API**: Handle as JSON array in requests/responses
- **Forms**: Multi-select dropdown or tag input
- **Validation**: Array of valid process codes

### **2. Decimal Precision (defectTolerancePercent)**
- **Database**: Store as decimal(5,2) - up to 999.99%
- **API**: Handle as number with proper precision
- **Forms**: Number input with step="0.01"
- **Validation**: Min 0, Max 100, 2 decimal places

### **3. Business Logic Constraints**
- **processCode**: Unique per owner, uppercase only
- **sequenceOrder**: Unique per owner if provided
- **prerequisiteProcesses**: Valid existing process codes
- **capacity values**: Must be positive integers
- **URLs**: Validate sopDocumentUrl format

### **4. Performance Considerations**
- **Indexes**: Use all defined indexes in schema
- **Filtering**: Optimize complex filter queries
- **Pagination**: Efficient offset-based pagination
- **Search**: Multi-field search with proper indexing

### **5. Error Handling Specifics**
- **Unique constraint errors**: User-friendly messages
- **Array validation errors**: Per-element error reporting
- **Decimal validation errors**: Precision-specific messages
- **Business logic errors**: Contextual error explanations

---

## 📋 **TESTING REQUIREMENTS**

### **Unit Tests**:
- [ ] Validation schemas (especially arrays and decimals)
- [ ] Database queries (CRUD with complex filters)
- [ ] React hooks (data fetching and mutations)
- [ ] Utility functions (array handling, decimal formatting)

### **Integration Tests**:
- [ ] API routes (authentication, validation, business logic)
- [ ] Form submission (complex data handling)
- [ ] Error scenarios (unique constraints, invalid data)

### **Component Tests**:
- [ ] ProcessForm (all input types, validation)
- [ ] ProcessList (filtering, sorting, pagination)
- [ ] Error states and loading states

---

## 🎯 **SUCCESS CRITERIA**

After completing this implementation, the system should support:

✅ **Full CRUD operations** for processes with ownership checks
✅ **Complex data types**: Arrays, decimals, enums, booleans
✅ **Advanced filtering**: By category, type, status, department
✅ **Business logic validation**: Unique constraints, dependencies
✅ **Performance optimization**: Proper indexing and pagination
✅ **Type safety**: End-to-end TypeScript coverage
✅ **Error handling**: User-friendly error messages
✅ **UI consistency**: Following Yamato-SaaS design patterns

---

## 📚 **REFERENCE PATTERNS**

**Follow todos implementation exactly** for:
- File structure and naming conventions
- API response format and error handling
- React hook patterns and dependency management
- Form validation and state management
- Loading states and error displays
- Internationalization integration

**Adapt for Process-specific features**:
- Array field handling (prerequisiteProcesses)
- Decimal precision (defectTolerancePercent)
- Enum validations (processCategory, processType, status)
- Business logic constraints (unique codes, sequences)
- Complex filtering capabilities

---

This plan provides complete step-by-step guidance for implementing the Process table following the established todos pattern while handling the additional complexity of the process domain.