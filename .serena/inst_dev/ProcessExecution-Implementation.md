# ProcessExecution Feature Implementation Plan

## 🎯 **OVERVIEW & CONTEXT**

ProcessExecution is the most complex table in our production planning system. It tracks the actual execution of production processes on specific work tables, managing quantities, scheduling, quality, and performance metrics.

**Key Characteristics:**
- Multiple foreign key relationships (PlanDetail, ProcessSub, WorkTable)
- Complex business logic for status transitions and quantity management
- Performance tracking and quality control
- Real-time scheduling and resource assignment

**Based on Todos Pattern:** Following the proven Yamato-SaaS architecture used in todos feature

---

## 🔧 **PREREQUISITES & DEPENDENCIES**

**Required Tables (Must exist first):**
- `PlanDetail` table with CRUD operations
- `ProcessSub` table with CRUD operations  
- `WorkTable` table with CRUD operations
- `Process` table (for reference data)
- `ProductSub` table (for reference data)

**Development Dependencies:**
- Existing todos feature (as reference pattern)
- Drizzle ORM setup
- Clerk authentication
- Shadcn UI components
- Next.js App Router

**Mock Data Strategy:**
If dependencies aren't ready, create mock data factories for:
- Mock PlanDetail records
- Mock ProcessSub records
- Mock WorkTable records

---

## 📁 **FILE STRUCTURE TO CREATE**

```
src/
├── types/
│   └── processExecution.ts                    # TypeScript types
├── libs/
│   ├── validations/
│   │   └── processExecution.ts               # Zod validation schemas
│   ├── queries/
│   │   └── processExecution.ts               # Database queries
│   └── api/
│       └── processExecution.ts               # Client API functions
├── hooks/
│   ├── useProcessExecutions.ts               # Data fetching hook
│   ├── useProcessExecutionMutations.ts       # CRUD mutations hook
│   └── useProcessExecutionFilters.ts         # Filter state management
├── features/
│   └── processExecution/
│       ├── ProcessExecutionList.tsx          # List component
│       ├── ProcessExecutionForm.tsx          # Create/Edit form
│       ├── ProcessExecutionSkeleton.tsx      # Loading skeleton
│       ├── ProcessExecutionStatus.tsx        # Status indicator component
│       ├── ProcessExecutionMetrics.tsx       # Performance metrics display
│       └── __tests__/                        # Component tests
├── app/
│   ├── api/
│   │   └── process-executions/
│   │       ├── route.ts                      # GET /api/process-executions, POST
│   │       ├── stats/
│   │       │   └── route.ts                  # GET /api/process-executions/stats
│   │       └── [id]/
│   │           └── route.ts                  # GET, PUT, DELETE /api/process-executions/[id]
│   └── [locale]/
│       └── (auth)/
│           └── dashboard/
│               └── process-executions/
│                   └── page.tsx              # Main dashboard page
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **PHASE 1: Foundation Layer (Types, Validation, Database)**

#### Step 1.1: Create TypeScript Types
**File:** `src/types/processExecution.ts`

```typescript
// Follow todos pattern but with ProcessExecution complexity
export type ProcessExecutionDb = typeof processExecutionSchema.$inferSelect;

export type ProcessExecution = Omit<ProcessExecutionDb, 'createdAt' | 'updatedAt' | 'plannedDate' | 'actualStartDate' | 'actualCompletionDate'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  plannedDate: string | Date | null;
  actualStartDate: string | Date | null;
  actualCompletionDate: string | Date | null;
};

export type CreateProcessExecutionInput = typeof processExecutionSchema.$inferInsert;

export type UpdateProcessExecutionInput = Partial<Omit<CreateProcessExecutionInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Complex filter types
export type ProcessExecutionFilters = {
  search: string;
  processType?: string;
  status?: string;
  qualityStatus?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  planDetailId?: number;
  workTableId?: number;
  sortBy: 'createdAt' | 'plannedDate' | 'status' | 'completionPercentage';
  sortOrder: 'asc' | 'desc';
};

// Business logic types
export type StatusTransition = {
  from: string;
  to: string;
  allowed: boolean;
  conditions?: string[];
};

export type QuantityValidation = {
  plannedQuantity: number;
  actualQuantity: number;
  defectQuantity: number;
  reworkQuantity: number;
  isValid: boolean;
  errors: string[];
};
```

#### Step 1.2: Create Validation Schemas
**File:** `src/libs/validations/processExecution.ts`

```typescript
import { z } from 'zod';

// Status enums
const ProcessExecutionStatus = z.enum(['planned', 'in_progress', 'completed', 'cancelled', 'on_hold']);
const QualityStatus = z.enum(['passed', 'failed', 'pending', 'rework_required']);

// Base schema for form data
export const processExecutionFormSchema = z.object({
  planDetailId: z.number().int().positive('Plan Detail is required'),
  processSubId: z.number().int().positive('Process Sub is required'),
  workTableId: z.number().int().positive('Work Table is required'),
  
  processType: z.string().min(1, 'Process Type is required'),
  processSubName: z.string().min(1, 'Process Sub Name is required'),
  
  productCode: z.string().min(1, 'Product Code is required'),
  productSubCode: z.string().min(1, 'Product Sub Code is required'),
  productSubDetail: z.string().optional(),
  
  tableNumber: z.string().min(1, 'Table Number is required'),
  operatorAssigned: z.string().optional(),
  
  // Quantity validation with business rules
  totalQuantity: z.number().int().min(0).optional(),
  plannedQuantity: z.number().int().min(1, 'Planned Quantity must be at least 1'),
  actualQuantity: z.number().int().min(0).default(0),
  defectQuantity: z.number().int().min(0).default(0),
  reworkQuantity: z.number().int().min(0).default(0),
  
  // Date validations
  plannedDate: z.string().optional().or(z.date().optional()),
  actualStartDate: z.string().optional().or(z.date().optional()),
  actualCompletionDate: z.string().optional().or(z.date().optional()),
  
  estimatedDuration: z.number().int().min(1).optional(),
  actualDuration: z.number().int().min(0).optional(),
  
  status: ProcessExecutionStatus.default('planned'),
  qualityStatus: QualityStatus.optional(),
  completionPercentage: z.number().min(0).max(100).default(0),
  
  efficiencyRating: z.number().min(0).max(5).optional(),
  qualityScore: z.number().min(0).max(5).optional(),
  
  issuesEncountered: z.string().optional(),
  solutionsApplied: z.string().optional(),
  note: z.string().optional(),
}).refine((data) => {
  // Business rule: total quantities cannot exceed planned
  const totalActual = data.actualQuantity + data.defectQuantity + data.reworkQuantity;
  return totalActual <= data.plannedQuantity;
}, {
  message: "Total actual + defect + rework quantities cannot exceed planned quantity",
  path: ["actualQuantity"]
}).refine((data) => {
  // Business rule: completion date after start date
  if (data.actualStartDate && data.actualCompletionDate) {
    return new Date(data.actualStartDate) <= new Date(data.actualCompletionDate);
  }
  return true;
}, {
  message: "Completion date must be after start date",
  path: ["actualCompletionDate"]
});

export const createProcessExecutionSchema = processExecutionFormSchema;
export const updateProcessExecutionSchema = processExecutionFormSchema.partial();

// List parameters schema
export const processExecutionListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  processType: z.string().optional(),
  status: ProcessExecutionStatus.optional(),
  qualityStatus: QualityStatus.optional(),
  planDetailId: z.coerce.number().int().optional(),
  workTableId: z.coerce.number().int().optional(),
  sortBy: z.enum(['createdAt', 'plannedDate', 'status', 'completionPercentage']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Validation functions
export function validateCreateProcessExecution(data: unknown) {
  return createProcessExecutionSchema.parse(data);
}

export function validateUpdateProcessExecution(data: unknown) {
  return updateProcessExecutionSchema.parse(data);
}

export function validateProcessExecutionListParams(data: unknown) {
  return processExecutionListParamsSchema.parse(data);
}
```

#### Step 1.3: Create Database Queries
**File:** `src/libs/queries/processExecution.ts`

```typescript
import { and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { processExecutionSchema, planDetailSchema, processSubSchema, workTableSchema } from '@/models/schema_new';

// CREATE
export async function createProcessExecution(data: CreateProcessExecutionInput): Promise<ProcessExecutionDb> {
  // Validate foreign key relationships exist
  const [planDetail] = await db.select().from(planDetailSchema).where(eq(planDetailSchema.id, data.planDetailId)).limit(1);
  if (!planDetail) {
    throw new Error('Plan Detail not found');
  }

  const [processSub] = await db.select().from(processSubSchema).where(eq(processSubSchema.id, data.processSubId)).limit(1);
  if (!processSub) {
    throw new Error('Process Sub not found');
  }

  const [workTable] = await db.select().from(workTableSchema).where(eq(workTableSchema.id, data.workTableId)).limit(1);
  if (!workTable) {
    throw new Error('Work Table not found');
  }

  const [processExecution] = await db
    .insert(processExecutionSchema)
    .values(data)
    .returning();

  if (!processExecution) {
    throw new Error('Failed to create process execution');
  }

  return processExecution;
}

// READ with JOIN queries
export async function getProcessExecutionById(id: number, ownerId: string): Promise<ProcessExecutionDb | null> {
  const [processExecution] = await db
    .select()
    .from(processExecutionSchema)
    .where(and(
      eq(processExecutionSchema.id, id),
      eq(processExecutionSchema.ownerId, ownerId)
    ))
    .limit(1);

  return processExecution || null;
}

// Complex pagination with joins and filtering
export async function getPaginatedProcessExecutions(params: ProcessExecutionListParams) {
  const { ownerId, page, limit, search, processType, status, qualityStatus, planDetailId, workTableId, sortBy, sortOrder } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [eq(processExecutionSchema.ownerId, ownerId)];

  if (search) {
    whereConditions.push(
      or(
        ilike(processExecutionSchema.productCode, `%${search}%`),
        ilike(processExecutionSchema.productSubCode, `%${search}%`),
        ilike(processExecutionSchema.operatorAssigned, `%${search}%`)
      )
    );
  }

  if (processType) {
    whereConditions.push(eq(processExecutionSchema.processType, processType));
  }

  if (status) {
    whereConditions.push(eq(processExecutionSchema.status, status));
  }

  if (qualityStatus) {
    whereConditions.push(eq(processExecutionSchema.qualityStatus, qualityStatus));
  }

  if (planDetailId) {
    whereConditions.push(eq(processExecutionSchema.planDetailId, planDetailId));
  }

  if (workTableId) {
    whereConditions.push(eq(processExecutionSchema.workTableId, workTableId));
  }

  // Order by clause
  const orderColumn = processExecutionSchema[sortBy] || processExecutionSchema.createdAt;
  const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

  // Execute queries
  const [processExecutions, [{ total }]] = await Promise.all([
    db
      .select()
      .from(processExecutionSchema)
      .where(and(...whereConditions))
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset),
    
    db
      .select({ total: count() })
      .from(processExecutionSchema)
      .where(and(...whereConditions))
  ]);

  return {
    processExecutions,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + processExecutions.length < total,
    },
  };
}

// Business logic functions
export async function updateProcessExecutionStatus(
  id: number, 
  ownerId: string, 
  newStatus: string,
  additionalData?: Partial<ProcessExecutionDb>
): Promise<ProcessExecutionDb> {
  // Validate status transition
  const current = await getProcessExecutionById(id, ownerId);
  if (!current) {
    throw new Error('Process execution not found');
  }

  const validTransitions = {
    'planned': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'on_hold', 'cancelled'],
    'on_hold': ['in_progress', 'cancelled'],
    'completed': [], // Terminal state
    'cancelled': [], // Terminal state
  };

  if (!validTransitions[current.status]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${current.status} to ${newStatus}`);
  }

  const updateData = {
    status: newStatus,
    ...additionalData,
    ...(newStatus === 'in_progress' && !current.actualStartDate ? { actualStartDate: new Date() } : {}),
    ...(newStatus === 'completed' && !current.actualCompletionDate ? { actualCompletionDate: new Date(), completionPercentage: 100 } : {}),
  };

  const [updated] = await db
    .update(processExecutionSchema)
    .set(updateData)
    .where(and(
      eq(processExecutionSchema.id, id),
      eq(processExecutionSchema.ownerId, ownerId)
    ))
    .returning();

  if (!updated) {
    throw new Error('Failed to update process execution');
  }

  return updated;
}

// Statistics queries
export async function getProcessExecutionStats(ownerId: string) {
  const [stats] = await db
    .select({
      total: count(),
      planned: count(eq(processExecutionSchema.status, 'planned')),
      inProgress: count(eq(processExecutionSchema.status, 'in_progress')),
      completed: count(eq(processExecutionSchema.status, 'completed')),
      cancelled: count(eq(processExecutionSchema.status, 'cancelled')),
      onHold: count(eq(processExecutionSchema.status, 'on_hold')),
    })
    .from(processExecutionSchema)
    .where(eq(processExecutionSchema.ownerId, ownerId));

  return stats || {
    total: 0,
    planned: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    onHold: 0,
  };
}
```

### **PHASE 2: API Layer**

#### Step 2.1: Main API Route
**File:** `src/app/api/process-executions/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { 
  createProcessExecution, 
  getPaginatedProcessExecutions 
} from '@/libs/queries/processExecution';
import {
  validateCreateProcessExecution,
  validateProcessExecutionListParams,
} from '@/libs/validations/processExecution';

// GET /api/process-executions
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const { searchParams } = new URL(request.url);

    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      processType: searchParams.get('processType') || undefined,
      status: searchParams.get('status') || undefined,
      qualityStatus: searchParams.get('qualityStatus') || undefined,
      planDetailId: searchParams.get('planDetailId') || undefined,
      workTableId: searchParams.get('workTableId') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = { ...validateProcessExecutionListParams(queryParams), ownerId };
    const result = await getPaginatedProcessExecutions(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.processExecutions,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching process executions:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/process-executions
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const body = await request.json();
    const validatedData = validateCreateProcessExecution(body);

    const processExecution = await createProcessExecution({
      ...validatedData,
      ownerId,
    });

    return NextResponse.json(
      { success: true, data: processExecution, message: 'Process execution created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating process execution:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Step 2.2: Individual Resource Route
**File:** `src/app/api/process-executions/[id]/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { 
  getProcessExecutionById, 
  updateProcessExecution, 
  deleteProcessExecution 
} from '@/libs/queries/processExecution';
import { validateUpdateProcessExecution } from '@/libs/validations/processExecution';

type RouteParams = {
  params: { id: string };
};

// GET /api/process-executions/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const processExecution = await getProcessExecutionById(id, ownerId);

    if (!processExecution) {
      return NextResponse.json({ success: false, error: 'Process execution not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: processExecution });
  } catch (error) {
    console.error('Error fetching process execution:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/process-executions/[id] - with business logic
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const id = parseInt(params.id);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const validatedData = validateUpdateProcessExecution(body);

    // Special handling for status updates
    if (validatedData.status) {
      const processExecution = await updateProcessExecutionStatus(id, ownerId, validatedData.status, validatedData);
      return NextResponse.json({ success: true, data: processExecution, message: 'Process execution updated successfully' });
    } else {
      const processExecution = await updateProcessExecution(id, ownerId, validatedData);
      return NextResponse.json({ success: true, data: processExecution, message: 'Process execution updated successfully' });
    }
  } catch (error) {
    console.error('Error updating process execution:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/process-executions/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await deleteProcessExecution(id, ownerId);
    return NextResponse.json({ success: true, message: 'Process execution deleted successfully' });
  } catch (error) {
    console.error('Error deleting process execution:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### **PHASE 3: Client API & Hooks Layer**

#### Step 3.1: Client API Functions
**File:** `src/libs/api/processExecution.ts`

```typescript
// Following exact todos pattern but with ProcessExecution complexity
export async function fetchProcessExecutions(params = {}) {
  // Implementation similar to fetchTodos but with additional filters
}

export async function createProcessExecution(data) {
  // Implementation similar to createTodo
}

export async function updateProcessExecution(id, data) {
  // Implementation similar to updateTodo
}

export async function deleteProcessExecution(id) {
  // Implementation similar to deleteTodo
}

export async function fetchProcessExecutionStats() {
  // Implementation similar to fetchTodoStats
}
```

#### Step 3.2: Data Fetching Hook
**File:** `src/hooks/useProcessExecutions.ts`

```typescript
// Following exact useTodos pattern but with ProcessExecution parameters
export function useProcessExecutions(params) {
  // Implementation similar to useTodos
  // Additional state for complex filtering
  // Business logic for status filtering
}
```

#### Step 3.3: Mutations Hook
**File:** `src/hooks/useProcessExecutionMutations.ts`

```typescript
// Following exact useTodoMutations pattern
export function useProcessExecutionMutations() {
  // Implementation similar to useTodoMutations
  // Additional methods for status transitions
  // Business logic validation
}
```

#### Step 3.4: Filters Hook  
**File:** `src/hooks/useProcessExecutionFilters.ts`

```typescript
// Following exact useTodoFilters pattern but more complex
export function useProcessExecutionFilters() {
  // Implementation similar to useTodoFilters
  // Additional filter states for processType, status, dates
  // Reset functionality for complex filters
}
```

### **PHASE 4: UI Components Layer**

#### Step 4.1: List Component
**File:** `src/features/processExecution/ProcessExecutionList.tsx`

```typescript
// Following exact TodoList pattern but with additional complexity:
// - Status indicators with colors
// - Progress bars for completion percentage
// - Quantity displays
// - Performance metrics
// - Advanced filtering UI
```

#### Step 4.2: Form Component
**File:** `src/features/processExecution/ProcessExecutionForm.tsx`

```typescript
// Following exact TodoForm pattern but with:
// - Dropdown selectors for foreign keys
// - Date pickers for scheduling
// - Quantity input validation
// - Status transition controls
// - Conditional field visibility based on status
```

#### Step 4.3: Supporting Components
**Files:**
- `ProcessExecutionSkeleton.tsx` - Loading states
- `ProcessExecutionStatus.tsx` - Status indicators
- `ProcessExecutionMetrics.tsx` - Performance display

### **PHASE 5: Page Integration**

#### Step 5.1: Dashboard Page
**File:** `src/app/[locale]/(auth)/dashboard/process-executions/page.tsx`

```typescript
// Following exact TodosPage pattern but with:
// - Advanced filtering sidebar
// - Status overview cards
// - Performance metrics dashboard
// - Bulk operations support
```

---

## 🧪 **TESTING STRATEGY**

### Unit Tests (Follow todos test patterns):
1. **Validation Tests**: Test all Zod schemas with valid/invalid data
2. **Query Tests**: Test database functions with mock data
3. **Hook Tests**: Test React hooks with React Testing Library
4. **Component Tests**: Test UI components with user interactions

### Integration Tests:
1. **API Route Tests**: Test full request/response cycles
2. **Business Logic Tests**: Test status transitions and quantity validations
3. **Form Integration Tests**: Test complex form validations

### Test Files to Create:
```
src/
├── libs/
│   ├── validations/
│   │   └── processExecution.test.ts
│   └── queries/
│       └── processExecution.test.ts
├── hooks/
│   └── __tests__/
│       ├── useProcessExecutions.test.ts
│       ├── useProcessExecutionMutations.test.ts
│       └── useProcessExecutionFilters.test.ts
└── features/
    └── processExecution/
        └── __tests__/
            ├── ProcessExecutionList.test.tsx
            └── ProcessExecutionForm.test.tsx
```

---

## ✅ **ACCEPTANCE CRITERIA & DEFINITION OF DONE**

### Functional Requirements:
- [ ] Create new process executions with all required fields
- [ ] List process executions with pagination (10 items per page)
- [ ] Filter by processType, status, date range, planDetail, workTable
- [ ] Search by productCode, productSubCode, operatorAssigned
- [ ] Edit existing process executions with business rule validation
- [ ] Delete process executions with confirmation
- [ ] Status transitions follow business rules (planned → in_progress → completed)
- [ ] Quantity validations (actual + defect + rework ≤ planned)
- [ ] Date validations (completion after start)
- [ ] Performance metrics calculation and display

### Technical Requirements:
- [ ] All TypeScript types defined with proper inference
- [ ] All Zod validations implemented with business rules
- [ ] Database queries optimized with proper indexing
- [ ] API routes follow REST conventions with proper error handling
- [ ] React hooks follow Yamato-SaaS patterns
- [ ] UI components responsive and accessible
- [ ] Loading states and error handling implemented
- [ ] Multi-tenancy support (orgId/userId)

### Code Quality:
- [ ] Unit tests coverage > 80%
- [ ] Integration tests for critical business logic
- [ ] ESLint and Prettier passing
- [ ] TypeScript strict mode with no errors
- [ ] Components follow Shadcn UI patterns
- [ ] Consistent naming conventions with todos feature

### Performance:
- [ ] List page loads < 2 seconds with 1000+ records
- [ ] Form validation is real-time without lag
- [ ] Search/filter results update < 500ms
- [ ] Optimistic updates for better UX

### Business Logic Validation:
- [ ] Cannot create process execution with invalid foreign keys
- [ ] Status transitions respect business rules
- [ ] Quantity validations prevent invalid data
- [ ] Performance calculations are accurate
- [ ] Date validations prevent logical errors

---

## 🚀 **GETTING STARTED**

1. **Review Dependencies**: Ensure all required tables exist or create mock data
2. **Start with Phase 1**: Begin with types and validation - these are the foundation
3. **Test Each Phase**: Don't move to next phase until current phase tests pass
4. **Follow Todos Pattern**: When in doubt, reference how todos implements similar functionality
5. **Ask Questions**: If business rules are unclear, ask for clarification before coding

**Estimated Timeline**: 3-4 weeks for complete implementation with testing

**Priority Order**: Types → Validation → Database → API → Hooks → Components → Pages

This plan provides a complete roadmap for implementing ProcessExecution with the same quality and patterns as the existing todos feature, while handling the additional complexity of production planning business logic.