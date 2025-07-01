# PlanDetail Feature Implementation Plan

## 🎯 **OVERVIEW & CONTEXT**

PlanDetail represents location-based production allocation within monthly production plans. It manages the distribution of products across different locations (both alpha-coded like K04, K01 and numeric like 2, 7, 4) with scheduling and quantity tracking.

**Key Characteristics:**
- Location-based production allocation (dual coding system)
- Date range planning (planned vs actual)
- Quantity management (planned vs actual with progress tracking)
- Priority system (1-10 levels)
- Product reference management (productCode + productSubCode)
- Status workflow management

**Based on Todos Pattern:** Following proven Yamato-SaaS architecture with moderate complexity

**Simpler than ProcessExecution:** Single main FK, less complex business rules, more straightforward UI

---

## 🔧 **PREREQUISITES & DEPENDENCIES**

**Required Tables (Must exist first):**
- `Plan` table with CRUD operations (main dependency)

**Optional References (can be mocked initially):**
- `ProductSub` table (for product validation)
- `Product` table (for product reference)

**Development Dependencies:**
- Existing todos feature (as reference pattern)
- ProcessExecution implementation (for advanced patterns)
- Drizzle ORM setup
- Clerk authentication
- Shadcn UI components
- Next.js App Router

**Mock Data Strategy:**
If Plan table isn't ready, create mock Plan records with basic structure:
```typescript
const mockPlans = [
  { id: 1, planCode: 'T.6', planName: '06.2025', planYear: 2025, planMonth: 6 },
  { id: 2, planCode: 'T.7', planName: '07.2025', planYear: 2025, planMonth: 7 },
];
```

---

## 📁 **FILE STRUCTURE TO CREATE**

```
src/
├── types/
│   └── planDetail.ts                          # TypeScript types
├── libs/
│   ├── validations/
│   │   └── planDetail.ts                     # Zod validation schemas
│   ├── queries/
│   │   └── planDetail.ts                     # Database queries
│   └── api/
│       └── planDetail.ts                     # Client API functions
├── hooks/
│   ├── usePlanDetails.ts                     # Data fetching hook
│   ├── usePlanDetailMutations.ts             # CRUD mutations hook
│   └── usePlanDetailFilters.ts               # Filter state management
├── features/
│   └── planDetail/
│       ├── PlanDetailList.tsx                # List component
│       ├── PlanDetailForm.tsx                # Create/Edit form
│       ├── PlanDetailSkeleton.tsx            # Loading skeleton
│       ├── LocationPicker.tsx                # Location selection component
│       ├── PlanDetailStatus.tsx              # Status indicator
│       ├── PlanDetailProgress.tsx            # Progress tracking component
│       └── __tests__/                        # Component tests
├── app/
│   ├── api/
│   │   └── plan-details/
│   │       ├── route.ts                      # GET /api/plan-details, POST
│   │       ├── bulk/
│   │       │   └── route.ts                  # POST /api/plan-details/bulk
│   │       ├── stats/
│   │       │   └── route.ts                  # GET /api/plan-details/stats
│   │       └── [id]/
│   │           └── route.ts                  # GET, PUT, DELETE /api/plan-details/[id]
│   └── [locale]/
│       └── (auth)/
│           └── dashboard/
│               └── plan-details/
│                   └── page.tsx              # Main dashboard page
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **PHASE 1: Foundation Layer (Types, Validation, Database)**

#### Step 1.1: Create TypeScript Types
**File:** `src/types/planDetail.ts`

```typescript
import type { planDetailSchema } from '@/models/schema_new';

// Base types from schema
export type PlanDetailDb = typeof planDetailSchema.$inferSelect;

export type PlanDetail = Omit<PlanDetailDb, 'createdAt' | 'updatedAt' | 'plannedStartDate' | 'plannedEndDate' | 'actualStartDate' | 'actualEndDate'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  plannedStartDate: string | Date | null;
  plannedEndDate: string | Date | null;
  actualStartDate: string | Date | null;
  actualEndDate: string | Date | null;
};

export type CreatePlanDetailInput = typeof planDetailSchema.$inferInsert;

export type UpdatePlanDetailInput = Partial<Omit<CreatePlanDetailInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Location management types
export type LocationType = 'alpha' | 'numeric';

export type LocationCode = {
  code: string;
  type: LocationType;
  displayName: string;
};

// Filter types
export type PlanDetailFilters = {
  search: string;
  planId?: number;
  locationCode?: string;
  locationType?: LocationType;
  status?: string;
  productCode?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  priorityRange?: {
    min: number;
    max: number;
  };
  sortBy: 'createdAt' | 'plannedStartDate' | 'priority' | 'status' | 'locationCode';
  sortOrder: 'asc' | 'desc';
};

// List parameters
export type PlanDetailListParams = {
  ownerId: string;
  page: number;
  limit: number;
} & Omit<PlanDetailFilters, 'search'> & {
  search?: string;
};

// Progress tracking
export type PlanDetailProgress = {
  planned: number;
  actual: number;
  percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
};

// Bulk operations
export type BulkPlanDetailInput = {
  planId: number;
  assignments: Array<{
    locationCode: string;
    locationType: LocationType;
    productCode: string;
    productSubCode: string;
    plannedQuantity: number;
    priority?: number;
  }>;
};

// API Response types
export type PlanDetailsResponse = {
  success: true;
  data: PlanDetail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type PlanDetailResponse = {
  success: true;
  data: PlanDetail;
  message?: string;
};

export type PlanDetailStatsResponse = {
  success: true;
  data: {
    total: number;
    byStatus: Record<string, number>;
    byLocation: Record<string, number>;
    byPlan: Record<string, number>;
    totalPlannedQuantity: number;
    totalActualQuantity: number;
    averagePriority: number;
  };
};

export type PlanDetailErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Form data
export type PlanDetailFormData = {
  planId: number;
  locationCode: string;
  locationType: LocationType;
  productCode: string;
  productSubCode: string;
  plannedQuantity: number;
  actualQuantity?: number;
  plannedStartDate?: string | Date;
  plannedEndDate?: string | Date;
  actualStartDate?: string | Date;
  actualEndDate?: string | Date;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
  note?: string;
};
```

#### Step 1.2: Create Validation Schemas
**File:** `src/libs/validations/planDetail.ts`

```typescript
import { z } from 'zod';

// Enum definitions
const PlanDetailStatus = z.enum(['planned', 'in_progress', 'completed', 'cancelled']);
const LocationType = z.enum(['alpha', 'numeric']);

// Location code validation
const locationCodeSchema = z.string().min(1, 'Location code is required').refine((code) => {
  // Alpha codes: K04, K01, K31 pattern
  const alphaPattern = /^K\d{2,3}$/;
  // Numeric codes: 2, 7, 4, 10, 5 pattern  
  const numericPattern = /^\d{1,2}$/;
  
  return alphaPattern.test(code) || numericPattern.test(code);
}, {
  message: 'Location code must be alpha format (K04, K01) or numeric format (2, 7, 4)',
});

// Product code validation
const productCodeSchema = z.string().min(1, 'Product code is required').regex(
  /^[A-Z]{3}\d{2}[A-Z]?$/,
  'Product code must follow format like NHA01, NHA02A'
);

const productSubCodeSchema = z.string().min(1, 'Product sub code is required').regex(
  /^[A-Z]{3}_\d{2}_[A-Z]{2,}$/,
  'Product sub code must follow format like NHA_01_CM, NHA_02_CO'
);

// Priority validation (1-10 scale)
const prioritySchema = z.number().int().min(1, 'Priority must be at least 1').max(10, 'Priority cannot exceed 10');

// Form schema
export const planDetailFormSchema = z.object({
  planId: z.number().int().positive('Plan is required'),
  
  locationCode: locationCodeSchema,
  locationType: LocationType,
  
  productCode: productCodeSchema,
  productSubCode: productSubCodeSchema,
  
  plannedQuantity: z.number().int().min(1, 'Planned quantity must be at least 1'),
  actualQuantity: z.number().int().min(0).default(0),
  
  plannedStartDate: z.string().optional().or(z.date().optional()),
  plannedEndDate: z.string().optional().or(z.date().optional()),
  actualStartDate: z.string().optional().or(z.date().optional()),
  actualEndDate: z.string().optional().or(z.date().optional()),
  
  status: PlanDetailStatus.default('planned'),
  priority: prioritySchema.default(5),
  
  note: z.string().optional(),
}).refine((data) => {
  // Validate location code matches location type
  const alphaPattern = /^K\d{2,3}$/;
  const isAlpha = alphaPattern.test(data.locationCode);
  
  return (data.locationType === 'alpha' && isAlpha) || 
         (data.locationType === 'numeric' && !isAlpha);
}, {
  message: "Location code format must match location type",
  path: ["locationCode"]
}).refine((data) => {
  // Validate planned date range
  if (data.plannedStartDate && data.plannedEndDate) {
    return new Date(data.plannedStartDate) <= new Date(data.plannedEndDate);
  }
  return true;
}, {
  message: "Planned end date must be after start date",
  path: ["plannedEndDate"]
}).refine((data) => {
  // Validate actual date range
  if (data.actualStartDate && data.actualEndDate) {
    return new Date(data.actualStartDate) <= new Date(data.actualEndDate);
  }
  return true;
}, {
  message: "Actual end date must be after start date",
  path: ["actualEndDate"]
}).refine((data) => {
  // Validate actual quantity doesn't exceed planned
  return data.actualQuantity <= data.plannedQuantity;
}, {
  message: "Actual quantity cannot exceed planned quantity",
  path: ["actualQuantity"]
});

// CRUD schemas
export const createPlanDetailSchema = planDetailFormSchema;
export const updatePlanDetailSchema = planDetailFormSchema.partial();

// List parameters schema
export const planDetailListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  planId: z.coerce.number().int().optional(),
  locationCode: z.string().optional(),
  locationType: LocationType.optional(),
  status: PlanDetailStatus.optional(),
  productCode: z.string().optional(),
  priorityMin: z.coerce.number().int().min(1).max(10).optional(),
  priorityMax: z.coerce.number().int().min(1).max(10).optional(),
  sortBy: z.enum(['createdAt', 'plannedStartDate', 'priority', 'status', 'locationCode']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Bulk operations schema
export const bulkPlanDetailSchema = z.object({
  planId: z.number().int().positive('Plan ID is required'),
  assignments: z.array(z.object({
    locationCode: locationCodeSchema,
    locationType: LocationType,
    productCode: productCodeSchema,
    productSubCode: productSubCodeSchema,
    plannedQuantity: z.number().int().min(1),
    priority: prioritySchema.optional().default(5),
  })).min(1, 'At least one assignment is required'),
});

// Validation functions
export function validateCreatePlanDetail(data: unknown) {
  return createPlanDetailSchema.parse(data);
}

export function validateUpdatePlanDetail(data: unknown) {
  return updatePlanDetailSchema.parse(data);
}

export function validatePlanDetailListParams(data: unknown) {
  return planDetailListParamsSchema.parse(data);
}

export function validateBulkPlanDetail(data: unknown) {
  return bulkPlanDetailSchema.parse(data);
}

// Business logic validation helpers
export function validateLocationCodeFormat(code: string): { isValid: boolean; type: LocationType | null; error?: string } {
  const alphaPattern = /^K\d{2,3}$/;
  const numericPattern = /^\d{1,2}$/;
  
  if (alphaPattern.test(code)) {
    return { isValid: true, type: 'alpha' };
  }
  
  if (numericPattern.test(code)) {
    return { isValid: true, type: 'numeric' };
  }
  
  return { 
    isValid: false, 
    type: null, 
    error: 'Location code must be alpha format (K04, K01) or numeric format (2, 7, 4)' 
  };
}

export function calculateProgress(planned: number, actual: number): PlanDetailProgress {
  const percentage = planned > 0 ? Math.round((actual / planned) * 100) : 0;
  
  let status: PlanDetailProgress['status'] = 'not_started';
  if (actual === 0) {
    status = 'not_started';
  } else if (actual < planned) {
    status = 'in_progress';
  } else {
    status = 'completed';
  }
  
  return {
    planned,
    actual,
    percentage: Math.min(percentage, 100),
    status,
  };
}
```

#### Step 1.3: Create Database Queries
**File:** `src/libs/queries/planDetail.ts`

```typescript
import { and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { planDetailSchema, planSchema } from '@/models/schema_new';
import type {
  CreatePlanDetailInput,
  PlanDetailDb,
  PlanDetailListParams,
  UpdatePlanDetailInput,
  BulkPlanDetailInput,
} from '@/types/planDetail';

// CREATE operations
export async function createPlanDetail(data: CreatePlanDetailInput): Promise<PlanDetailDb> {
  // Validate plan exists
  const [plan] = await db.select().from(planSchema).where(eq(planSchema.id, data.planId)).limit(1);
  if (!plan) {
    throw new Error('Plan not found');
  }

  // Check for duplicate allocation
  const existing = await db
    .select()
    .from(planDetailSchema)
    .where(and(
      eq(planDetailSchema.ownerId, data.ownerId),
      eq(planDetailSchema.planId, data.planId),
      eq(planDetailSchema.locationCode, data.locationCode),
      eq(planDetailSchema.productSubCode, data.productSubCode)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Allocation already exists for this location and product combination');
  }

  const [planDetail] = await db
    .insert(planDetailSchema)
    .values(data)
    .returning();

  if (!planDetail) {
    throw new Error('Failed to create plan detail');
  }

  return planDetail;
}

// Bulk create operation
export async function createBulkPlanDetails(data: BulkPlanDetailInput, ownerId: string): Promise<PlanDetailDb[]> {
  // Validate plan exists
  const [plan] = await db.select().from(planSchema).where(eq(planSchema.id, data.planId)).limit(1);
  if (!plan) {
    throw new Error('Plan not found');
  }

  // Prepare bulk insert data
  const insertData = data.assignments.map(assignment => ({
    ownerId,
    planId: data.planId,
    locationCode: assignment.locationCode,
    locationType: assignment.locationType,
    productCode: assignment.productCode,
    productSubCode: assignment.productSubCode,
    plannedQuantity: assignment.plannedQuantity,
    actualQuantity: 0,
    status: 'planned' as const,
    priority: assignment.priority || 5,
  }));

  const planDetails = await db
    .insert(planDetailSchema)
    .values(insertData)
    .returning();

  return planDetails;
}

// READ operations
export async function getPlanDetailById(id: number, ownerId: string): Promise<PlanDetailDb | null> {
  const [planDetail] = await db
    .select()
    .from(planDetailSchema)
    .where(and(
      eq(planDetailSchema.id, id),
      eq(planDetailSchema.ownerId, ownerId)
    ))
    .limit(1);

  return planDetail || null;
}

// Complex list with filtering and joins
export async function getPaginatedPlanDetails(params: PlanDetailListParams) {
  const { 
    ownerId, page, limit, search, planId, locationCode, locationType, 
    status, productCode, priorityMin, priorityMax, sortBy, sortOrder 
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [eq(planDetailSchema.ownerId, ownerId)];

  if (search) {
    whereConditions.push(
      or(
        ilike(planDetailSchema.locationCode, `%${search}%`),
        ilike(planDetailSchema.productCode, `%${search}%`),
        ilike(planDetailSchema.productSubCode, `%${search}%`)
      )
    );
  }

  if (planId) {
    whereConditions.push(eq(planDetailSchema.planId, planId));
  }

  if (locationCode) {
    whereConditions.push(eq(planDetailSchema.locationCode, locationCode));
  }

  if (locationType) {
    whereConditions.push(eq(planDetailSchema.locationType, locationType));
  }

  if (status) {
    whereConditions.push(eq(planDetailSchema.status, status));
  }

  if (productCode) {
    whereConditions.push(ilike(planDetailSchema.productCode, `%${productCode}%`));
  }

  if (priorityMin) {
    whereConditions.push(gte(planDetailSchema.priority, priorityMin));
  }

  if (priorityMax) {
    whereConditions.push(lte(planDetailSchema.priority, priorityMax));
  }

  // Order by clause
  const orderColumn = planDetailSchema[sortBy] || planDetailSchema.createdAt;
  const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

  // Execute queries with JOIN to get plan information
  const [planDetails, [{ total }]] = await Promise.all([
    db
      .select({
        ...planDetailSchema,
        plan: {
          id: planSchema.id,
          planCode: planSchema.planCode,
          planName: planSchema.planName,
          planYear: planSchema.planYear,
          planMonth: planSchema.planMonth,
        },
      })
      .from(planDetailSchema)
      .leftJoin(planSchema, eq(planDetailSchema.planId, planSchema.id))
      .where(and(...whereConditions))
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset),
    
    db
      .select({ total: count() })
      .from(planDetailSchema)
      .where(and(...whereConditions))
  ]);

  return {
    planDetails,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + planDetails.length < total,
    },
  };
}

// Location-based queries
export async function getPlanDetailsByLocation(ownerId: string, locationCode: string): Promise<PlanDetailDb[]> {
  return await db
    .select()
    .from(planDetailSchema)
    .where(and(
      eq(planDetailSchema.ownerId, ownerId),
      eq(planDetailSchema.locationCode, locationCode)
    ))
    .orderBy(desc(planDetailSchema.createdAt));
}

export async function getLocationCodes(ownerId: string): Promise<Array<{ code: string; type: 'alpha' | 'numeric'; count: number }>> {
  const results = await db
    .select({
      locationCode: planDetailSchema.locationCode,
      locationType: planDetailSchema.locationType,
      count: count(),
    })
    .from(planDetailSchema)
    .where(eq(planDetailSchema.ownerId, ownerId))
    .groupBy(planDetailSchema.locationCode, planDetailSchema.locationType)
    .orderBy(asc(planDetailSchema.locationCode));

  return results.map(r => ({
    code: r.locationCode,
    type: r.locationType as 'alpha' | 'numeric',
    count: r.count,
  }));
}

// UPDATE operations
export async function updatePlanDetail(
  id: number,
  ownerId: string,
  data: UpdatePlanDetailInput
): Promise<PlanDetailDb> {
  const [updated] = await db
    .update(planDetailSchema)
    .set(data)
    .where(and(
      eq(planDetailSchema.id, id),
      eq(planDetailSchema.ownerId, ownerId)
    ))
    .returning();

  if (!updated) {
    throw new Error('Plan detail not found or failed to update');
  }

  return updated;
}

// Status update with business logic
export async function updatePlanDetailStatus(
  id: number,
  ownerId: string,
  newStatus: string,
  additionalData?: Partial<PlanDetailDb>
): Promise<PlanDetailDb> {
  const current = await getPlanDetailById(id, ownerId);
  if (!current) {
    throw new Error('Plan detail not found');
  }

  // Status transition validation
  const validTransitions = {
    'planned': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [], // Terminal state
    'cancelled': ['planned'], // Can restart
  };

  if (!validTransitions[current.status]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${current.status} to ${newStatus}`);
  }

  const updateData = {
    status: newStatus,
    ...additionalData,
    ...(newStatus === 'in_progress' && !current.actualStartDate ? { actualStartDate: new Date() } : {}),
    ...(newStatus === 'completed' && !current.actualEndDate ? { actualEndDate: new Date() } : {}),
  };

  return await updatePlanDetail(id, ownerId, updateData);
}

// DELETE operations
export async function deletePlanDetail(id: number, ownerId: string): Promise<void> {
  const result = await db
    .delete(planDetailSchema)
    .where(and(
      eq(planDetailSchema.id, id),
      eq(planDetailSchema.ownerId, ownerId)
    ));

  if (result.rowCount === 0) {
    throw new Error('Plan detail not found');
  }
}

// STATISTICS
export async function getPlanDetailStats(ownerId: string) {
  const [statusStats] = await db
    .select({
      total: count(),
      planned: count(eq(planDetailSchema.status, 'planned')),
      inProgress: count(eq(planDetailSchema.status, 'in_progress')),
      completed: count(eq(planDetailSchema.status, 'completed')),
      cancelled: count(eq(planDetailSchema.status, 'cancelled')),
    })
    .from(planDetailSchema)
    .where(eq(planDetailSchema.ownerId, ownerId));

  const locationStats = await db
    .select({
      locationCode: planDetailSchema.locationCode,
      locationType: planDetailSchema.locationType,
      count: count(),
    })
    .from(planDetailSchema)
    .where(eq(planDetailSchema.ownerId, ownerId))
    .groupBy(planDetailSchema.locationCode, planDetailSchema.locationType);

  const planStats = await db
    .select({
      planId: planDetailSchema.planId,
      planCode: planSchema.planCode,
      count: count(),
    })
    .from(planDetailSchema)
    .leftJoin(planSchema, eq(planDetailSchema.planId, planSchema.id))
    .where(eq(planDetailSchema.ownerId, ownerId))
    .groupBy(planDetailSchema.planId, planSchema.planCode);

  return {
    ...statusStats,
    byLocation: Object.fromEntries(locationStats.map(l => [l.locationCode, l.count])),
    byPlan: Object.fromEntries(planStats.map(p => [p.planCode || `Plan ${p.planId}`, p.count])),
    totalPlannedQuantity: 0, // Will be calculated in separate query if needed
    totalActualQuantity: 0,   // Will be calculated in separate query if needed
    averagePriority: 0,       // Will be calculated in separate query if needed
  };
}

// Helper functions
export async function planDetailExists(id: number, ownerId: string): Promise<boolean> {
  const [result] = await db
    .select({ id: planDetailSchema.id })
    .from(planDetailSchema)
    .where(and(
      eq(planDetailSchema.id, id),
      eq(planDetailSchema.ownerId, ownerId)
    ))
    .limit(1);

  return !!result;
}
```

### **PHASE 2: API Layer**

#### Step 2.1: Main API Route
**File:** `src/app/api/plan-details/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { 
  createPlanDetail, 
  getPaginatedPlanDetails 
} from '@/libs/queries/planDetail';
import {
  validateCreatePlanDetail,
  validatePlanDetailListParams,
} from '@/libs/validations/planDetail';

// GET /api/plan-details
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
      planId: searchParams.get('planId') || undefined,
      locationCode: searchParams.get('locationCode') || undefined,
      locationType: searchParams.get('locationType') || undefined,
      status: searchParams.get('status') || undefined,
      productCode: searchParams.get('productCode') || undefined,
      priorityMin: searchParams.get('priorityMin') || undefined,
      priorityMax: searchParams.get('priorityMax') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = { ...validatePlanDetailListParams(queryParams), ownerId };
    const result = await getPaginatedPlanDetails(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.planDetails,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching plan details:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/plan-details
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const body = await request.json();
    const validatedData = validateCreatePlanDetail(body);

    const planDetail = await createPlanDetail({
      ...validatedData,
      ownerId,
    });

    return NextResponse.json(
      { success: true, data: planDetail, message: 'Plan detail created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating plan detail:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Step 2.2: Bulk Operations Route
**File:** `src/app/api/plan-details/bulk/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { createBulkPlanDetails } from '@/libs/queries/planDetail';
import { validateBulkPlanDetail } from '@/libs/validations/planDetail';

// POST /api/plan-details/bulk
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const body = await request.json();
    const validatedData = validateBulkPlanDetail(body);

    const planDetails = await createBulkPlanDetails(validatedData, ownerId);

    return NextResponse.json(
      { 
        success: true, 
        data: planDetails, 
        message: `${planDetails.length} plan details created successfully` 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating bulk plan details:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### **PHASE 3: Client API & Hooks Layer**

#### Step 3.1: Client API Functions
**File:** `src/libs/api/planDetail.ts`

```typescript
// Following todos pattern exactly but with PlanDetail-specific parameters
export async function fetchPlanDetails(params = {}) {
  // Implementation following fetchTodos pattern
  // Additional parameters for location, plan filtering
}

export async function createPlanDetail(data) {
  // Implementation following createTodo pattern
}

export async function createBulkPlanDetails(data) {
  // New functionality for bulk operations
}

export async function updatePlanDetail(id, data) {
  // Implementation following updateTodo pattern
}

export async function deletePlanDetail(id) {
  // Implementation following deleteTodo pattern
}

export async function fetchPlanDetailStats() {
  // Implementation following fetchTodoStats pattern
}
```

### **PHASE 4: UI Components Layer**

#### Step 4.1: Location Picker Component
**File:** `src/features/planDetail/LocationPicker.tsx`

```typescript
// Specialized component for location code selection
// - Toggle between alpha and numeric codes
// - Validation display
// - Grouped display of existing locations
```

#### Step 4.2: List Component
**File:** `src/features/planDetail/PlanDetailList.tsx`

```typescript
// Following TodoList pattern but with:
// - Location grouping
// - Priority indicators
// - Progress bars for quantity tracking
// - Status color coding
// - Bulk operations toolbar
```

#### Step 4.3: Form Component
**File:** `src/features/planDetail/PlanDetailForm.tsx`

```typescript
// Following TodoForm pattern but with:
// - Plan selector dropdown
// - LocationPicker integration
// - Product code autocomplete
// - Date range pickers
// - Priority slider
// - Quantity validation display
```

### **PHASE 5: Page Integration**

#### Step 5.1: Dashboard Page
**File:** `src/app/[locale]/(auth)/dashboard/plan-details/page.tsx`

```typescript
// Following TodosPage pattern but with:
// - Location overview cards
// - Plan selector
// - Bulk assignment modal
// - Priority-based sorting
// - Calendar view for date planning
```

---

## 🧪 **TESTING STRATEGY**

### Focus Areas:
1. **Location validation** (alpha vs numeric formats)
2. **Date range validation** (planned vs actual)
3. **Quantity validation** (actual ≤ planned)
4. **Priority system** (1-10 range)
5. **Status transitions** (planned → in_progress → completed)
6. **Bulk operations** (multiple location assignments)

### Test Files:
```
src/
├── libs/validations/__tests__/planDetail.test.ts
├── libs/queries/__tests__/planDetail.test.ts
├── hooks/__tests__/usePlanDetails.test.ts
└── features/planDetail/__tests__/
    ├── PlanDetailList.test.tsx
    ├── PlanDetailForm.test.tsx
    └── LocationPicker.test.tsx
```

---

## ✅ **ACCEPTANCE CRITERIA**

### Functional Requirements:
- [ ] Create plan details with location and product allocation
- [ ] Support both alpha (K04) and numeric (2, 7) location codes
- [ ] List with filtering by plan, location, status, priority
- [ ] Search by location, product codes
- [ ] Edit with date range and quantity validation
- [ ] Delete with confirmation
- [ ] Bulk assignment for multiple locations
- [ ] Status tracking (planned → in_progress → completed)
- [ ] Priority management (1-10 scale)
- [ ] Progress tracking (actual vs planned quantities)

### Technical Requirements:
- [ ] Location type validation (alpha vs numeric)
- [ ] Date range validation (start ≤ end)
- [ ] Quantity validation (actual ≤ planned)
- [ ] Foreign key validation (Plan exists)
- [ ] Duplicate prevention (same location + product)
- [ ] Bulk operations support
- [ ] Performance optimization for location grouping

### Business Rules:
- [ ] Priority range 1-10 (1=highest, 10=lowest)
- [ ] Status transitions follow workflow
- [ ] Location codes match expected patterns
- [ ] Product codes follow company format
- [ ] Actual quantities cannot exceed planned

---

## 🚀 **GETTING STARTED**

1. **Mock Plan Data**: Create basic Plan records if table doesn't exist
2. **Start with Location Validation**: This is the key differentiator
3. **Test Location Patterns**: Ensure alpha/numeric validation works
4. **Build Incrementally**: Start simple, add complexity
5. **Focus on UX**: Location picker and bulk operations are key features

**Estimated Timeline**: 2-3 weeks

**Key Complexity**: Location management system and bulk operations

This plan provides complete implementation guidance for PlanDetail while building on the proven todos pattern and preparing for integration with Plan table.