# Plan Feature Implementation Plan

## 🎯 **OVERVIEW & CONTEXT**

Plan represents monthly production plans (T.6, T.7, T.8, T.9) that serve as containers for detailed production allocations. It's the simplest table in our production planning system, focusing on high-level planning, approval workflows, and quantity target management.

**Key Characteristics:**
- Monthly planning system (T.6 = June 2025, T.7 = July 2025)
- Approval workflow (draft → active → completed)
- Quantity target management with aggregation from PlanDetails
- Date range planning for execution periods
- Status lifecycle management

**Based on Todos Pattern:** Direct application of Yamato-SaaS architecture with minimal complexity

**Simpler than Previous Tables:** No foreign keys, straightforward business logic, clean UI requirements

---

## 🔧 **PREREQUISITES & DEPENDENCIES**

**Required Dependencies:**
- Existing todos feature (as reference pattern)
- Drizzle ORM setup
- Clerk authentication
- Shadcn UI components
- Next.js App Router

**Optional Integrations (can be implemented later):**
- PlanDetail integration for quantity aggregation
- User management for approval workflow

**No Hard Dependencies:** Plan is a foundation table that other tables will reference

**Mock Data Strategy:**
Basic plans for development:
```typescript
const mockPlans = [
  { planCode: 'T.6', planName: '06.2025', planYear: 2025, planMonth: 6, status: 'draft' },
  { planCode: 'T.7', planName: '07.2025', planYear: 2025, planMonth: 7, status: 'active' },
  { planCode: 'T.8', planName: '08.2025', planYear: 2025, planMonth: 8, status: 'completed' },
];
```

---

## 📁 **FILE STRUCTURE TO CREATE**

```
src/
├── types/
│   └── plan.ts                               # TypeScript types
├── libs/
│   ├── validations/
│   │   └── plan.ts                          # Zod validation schemas
│   ├── queries/
│   │   └── plan.ts                          # Database queries
│   └── api/
│       └── plan.ts                          # Client API functions
├── hooks/
│   ├── usePlans.ts                          # Data fetching hook
│   ├── usePlanMutations.ts                  # CRUD mutations hook
│   └── usePlanFilters.ts                    # Filter state management
├── features/
│   └── plan/
│       ├── PlanList.tsx                     # List component
│       ├── PlanForm.tsx                     # Create/Edit form
│       ├── PlanSkeleton.tsx                 # Loading skeleton
│       ├── PlanStatus.tsx                   # Status indicator
│       ├── PlanCalendar.tsx                 # Monthly planning calendar
│       ├── PlanApproval.tsx                 # Approval workflow component
│       └── __tests__/                       # Component tests
├── app/
│   ├── api/
│   │   └── plans/
│   │       ├── route.ts                     # GET /api/plans, POST
│   │       ├── approve/
│   │       │   └── route.ts                 # POST /api/plans/approve
│   │       ├── stats/
│   │       │   └── route.ts                 # GET /api/plans/stats
│   │       └── [id]/
│   │           └── route.ts                 # GET, PUT, DELETE /api/plans/[id]
│   └── [locale]/
│       └── (auth)/
│           └── dashboard/
│               └── plans/
│                   └── page.tsx             # Main dashboard page
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **PHASE 1: Foundation Layer (Types, Validation, Database)**

#### Step 1.1: Create TypeScript Types
**File:** `src/types/plan.ts`

```typescript
import type { planSchema } from '@/models/schema_new';

// Base types from schema
export type PlanDb = typeof planSchema.$inferSelect;

export type Plan = Omit<PlanDb, 'createdAt' | 'updatedAt' | 'planStartDate' | 'planEndDate' | 'approvedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  planStartDate: string | Date | null;
  planEndDate: string | Date | null;
  approvedAt: string | Date | null;
};

export type CreatePlanInput = typeof planSchema.$inferInsert;

export type UpdatePlanInput = Partial<Omit<CreatePlanInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Plan status enum
export type PlanStatus = 'draft' | 'active' | 'completed' | 'cancelled';

// Monthly planning types
export type PlanMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type PlanCode = `T.${number}`;

export type MonthlyPlan = {
  month: PlanMonth;
  year: number;
  code: PlanCode;
  name: string;
  hasExistingPlan: boolean;
  plan?: Plan;
};

// Filter types
export type PlanFilters = {
  search: string;
  status?: PlanStatus;
  year?: number;
  month?: PlanMonth;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy: 'createdAt' | 'planStartDate' | 'planYear' | 'planMonth' | 'status';
  sortOrder: 'asc' | 'desc';
};

// List parameters
export type PlanListParams = {
  ownerId: string;
  page: number;
  limit: number;
} & Omit<PlanFilters, 'search'> & {
  search?: string;
};

// Approval workflow
export type ApprovalRequest = {
  planId: number;
  approvedBy: string;
  note?: string;
};

// Statistics
export type PlanStats = {
  total: number;
  byStatus: Record<PlanStatus, number>;
  byYear: Record<number, number>;
  currentMonthTarget: number;
  currentMonthActual: number;
  totalTargetQuantity: number;
  totalActualQuantity: number;
  completionRate: number;
};

// API Response types
export type PlansResponse = {
  success: true;
  data: Plan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type PlanResponse = {
  success: true;
  data: Plan;
  message?: string;
};

export type PlanStatsResponse = {
  success: true;
  data: PlanStats;
};

export type PlanErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Form data
export type PlanFormData = {
  planCode: string;
  planName: string;
  planYear: number;
  planMonth: PlanMonth;
  totalTargetQuantity?: number;
  status: PlanStatus;
  planStartDate?: string | Date;
  planEndDate?: string | Date;
  note?: string;
};

// Calendar view types
export type CalendarPlan = {
  id: number;
  month: PlanMonth;
  year: number;
  status: PlanStatus;
  planCode: string;
  planName: string;
  targetQuantity: number;
  actualQuantity: number;
  completionRate: number;
};

export type PlanningCalendar = {
  year: number;
  months: Array<{
    month: PlanMonth;
    plan: CalendarPlan | null;
    isCurrentMonth: boolean;
    isPastMonth: boolean;
  }>;
};
```

#### Step 1.2: Create Validation Schemas
**File:** `src/libs/validations/plan.ts`

```typescript
import { z } from 'zod';

// Status enum
const PlanStatus = z.enum(['draft', 'active', 'completed', 'cancelled']);

// Month validation (1-12)
const planMonthSchema = z.number().int().min(1).max(12);

// Year validation (current year and future years)
const planYearSchema = z.number().int().min(new Date().getFullYear());

// Plan code validation (T.6, T.7, T.8 format)
const planCodeSchema = z.string().regex(
  /^T\.\d{1,2}$/,
  'Plan code must follow format T.6, T.7, T.8, etc.'
);

// Plan name validation (06.2025, 07.2025 format)
const planNameSchema = z.string().regex(
  /^\d{2}\.\d{4}$/,
  'Plan name must follow format MM.YYYY (e.g., 06.2025)'
);

// Form schema
export const planFormSchema = z.object({
  planCode: planCodeSchema,
  planName: planNameSchema,
  planYear: planYearSchema,
  planMonth: planMonthSchema,
  
  totalTargetQuantity: z.number().int().min(0).optional(),
  totalActualQuantity: z.number().int().min(0).default(0),
  
  status: PlanStatus.default('draft'),
  
  planStartDate: z.string().optional().or(z.date().optional()),
  planEndDate: z.string().optional().or(z.date().optional()),
  
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional().or(z.date().optional()),
  
  note: z.string().optional(),
}).refine((data) => {
  // Validate plan code matches month
  const codeMonth = parseInt(data.planCode.split('.')[1]);
  return codeMonth === data.planMonth;
}, {
  message: "Plan code month must match plan month",
  path: ["planCode"]
}).refine((data) => {
  // Validate plan name matches month and year
  const [nameMonth, nameYear] = data.planName.split('.');
  return parseInt(nameMonth) === data.planMonth && parseInt(nameYear) === data.planYear;
}, {
  message: "Plan name must match month and year",
  path: ["planName"]
}).refine((data) => {
  // Validate date range
  if (data.planStartDate && data.planEndDate) {
    return new Date(data.planStartDate) <= new Date(data.planEndDate);
  }
  return true;
}, {
  message: "Plan end date must be after start date",
  path: ["planEndDate"]
});

// CRUD schemas
export const createPlanSchema = planFormSchema;
export const updatePlanSchema = planFormSchema.partial();

// List parameters schema
export const planListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: PlanStatus.optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  sortBy: z.enum(['createdAt', 'planStartDate', 'planYear', 'planMonth', 'status']).default('planYear'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Approval schema
export const approvalSchema = z.object({
  planId: z.number().int().positive('Plan ID is required'),
  approvedBy: z.string().min(1, 'Approver is required'),
  note: z.string().optional(),
});

// Quick plan creation schema (for monthly planning)
export const quickPlanSchema = z.object({
  year: planYearSchema,
  months: z.array(planMonthSchema).min(1, 'At least one month is required'),
  templateData: z.object({
    totalTargetQuantity: z.number().int().min(0).optional(),
    note: z.string().optional(),
  }).optional(),
});

// Validation functions
export function validateCreatePlan(data: unknown) {
  return createPlanSchema.parse(data);
}

export function validateUpdatePlan(data: unknown) {
  return updatePlanSchema.parse(data);
}

export function validatePlanListParams(data: unknown) {
  return planListParamsSchema.parse(data);
}

export function validateApproval(data: unknown) {
  return approvalSchema.parse(data);
}

export function validateQuickPlan(data: unknown) {
  return quickPlanSchema.parse(data);
}

// Helper validation functions
export function generatePlanCode(month: number): string {
  return `T.${month}`;
}

export function generatePlanName(month: number, year: number): string {
  return `${month.toString().padStart(2, '0')}.${year}`;
}

export function validatePlanUniqueness(month: number, year: number, ownerId: string): {
  planCode: string;
  planName: string;
  isUnique: boolean;
} {
  const planCode = generatePlanCode(month);
  const planName = generatePlanName(month, year);
  
  // This will be used in the database layer to check uniqueness
  return {
    planCode,
    planName,
    isUnique: true, // Will be validated in database queries
  };
}

// Business logic helpers
export function canApprove(plan: Plan, currentUserId: string): boolean {
  return plan.status === 'draft' && plan.ownerId === currentUserId;
}

export function canEdit(plan: Plan, currentUserId: string): boolean {
  return (plan.status === 'draft' || plan.status === 'active') && plan.ownerId === currentUserId;
}

export function canDelete(plan: Plan, currentUserId: string): boolean {
  return plan.status === 'draft' && plan.ownerId === currentUserId;
}

export function getNextStatus(currentStatus: PlanStatus): PlanStatus[] {
  const statusTransitions: Record<PlanStatus, PlanStatus[]> = {
    'draft': ['active', 'cancelled'],
    'active': ['completed', 'cancelled'],
    'completed': [], // Terminal state
    'cancelled': ['draft'], // Can restart
  };
  
  return statusTransitions[currentStatus] || [];
}
```

#### Step 1.3: Create Database Queries
**File:** `src/libs/queries/plan.ts`

```typescript
import { and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { planSchema } from '@/models/schema_new';
import type {
  CreatePlanInput,
  PlanDb,
  PlanListParams,
  UpdatePlanInput,
  ApprovalRequest,
  PlanStats,
} from '@/types/plan';

// CREATE operations
export async function createPlan(data: CreatePlanInput): Promise<PlanDb> {
  // Check for duplicate month/year combination
  const existing = await db
    .select()
    .from(planSchema)
    .where(and(
      eq(planSchema.ownerId, data.ownerId),
      eq(planSchema.planYear, data.planYear),
      eq(planSchema.planMonth, data.planMonth)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Plan already exists for ${data.planMonth}/${data.planYear}`);
  }

  const [plan] = await db
    .insert(planSchema)
    .values(data)
    .returning();

  if (!plan) {
    throw new Error('Failed to create plan');
  }

  return plan;
}

// Bulk create for multiple months
export async function createMultiplePlans(
  year: number,
  months: number[],
  ownerId: string,
  templateData?: Partial<CreatePlanInput>
): Promise<PlanDb[]> {
  const plans: CreatePlanInput[] = months.map(month => ({
    ownerId,
    planCode: `T.${month}`,
    planName: `${month.toString().padStart(2, '0')}.${year}`,
    planYear: year,
    planMonth: month,
    totalTargetQuantity: templateData?.totalTargetQuantity || 0,
    totalActualQuantity: 0,
    status: 'draft',
    note: templateData?.note,
  }));

  // Check for existing plans
  const existing = await db
    .select({ planMonth: planSchema.planMonth })
    .from(planSchema)
    .where(and(
      eq(planSchema.ownerId, ownerId),
      eq(planSchema.planYear, year)
    ));

  const existingMonths = existing.map(p => p.planMonth);
  const newPlans = plans.filter(p => !existingMonths.includes(p.planMonth));

  if (newPlans.length === 0) {
    throw new Error('All specified months already have plans');
  }

  const createdPlans = await db
    .insert(planSchema)
    .values(newPlans)
    .returning();

  return createdPlans;
}

// READ operations
export async function getPlanById(id: number, ownerId: string): Promise<PlanDb | null> {
  const [plan] = await db
    .select()
    .from(planSchema)
    .where(and(
      eq(planSchema.id, id),
      eq(planSchema.ownerId, ownerId)
    ))
    .limit(1);

  return plan || null;
}

export async function getPlanByMonthYear(
  month: number,
  year: number,
  ownerId: string
): Promise<PlanDb | null> {
  const [plan] = await db
    .select()
    .from(planSchema)
    .where(and(
      eq(planSchema.ownerId, ownerId),
      eq(planSchema.planYear, year),
      eq(planSchema.planMonth, month)
    ))
    .limit(1);

  return plan || null;
}

// List with pagination and filtering
export async function getPaginatedPlans(params: PlanListParams) {
  const { 
    ownerId, page, limit, search, status, year, month, sortBy, sortOrder 
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [eq(planSchema.ownerId, ownerId)];

  if (search) {
    whereConditions.push(
      or(
        ilike(planSchema.planCode, `%${search}%`),
        ilike(planSchema.planName, `%${search}%`),
        ilike(planSchema.note, `%${search}%`)
      )
    );
  }

  if (status) {
    whereConditions.push(eq(planSchema.status, status));
  }

  if (year) {
    whereConditions.push(eq(planSchema.planYear, year));
  }

  if (month) {
    whereConditions.push(eq(planSchema.planMonth, month));
  }

  // Order by clause
  const orderColumn = planSchema[sortBy] || planSchema.planYear;
  let orderDirection;
  
  if (sortBy === 'planYear' || sortBy === 'planMonth') {
    // For date-based sorting, we want newest first by default
    orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);
  } else {
    orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);
  }

  // Execute queries
  const [plans, [{ total }]] = await Promise.all([
    db
      .select()
      .from(planSchema)
      .where(and(...whereConditions))
      .orderBy(orderDirection, sortBy === 'planYear' ? asc(planSchema.planMonth) : undefined)
      .limit(limit)
      .offset(offset),
    
    db
      .select({ total: count() })
      .from(planSchema)
      .where(and(...whereConditions))
  ]);

  return {
    plans,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + plans.length < total,
    },
  };
}

// Get plans for calendar view
export async function getPlansForYear(year: number, ownerId: string): Promise<PlanDb[]> {
  return await db
    .select()
    .from(planSchema)
    .where(and(
      eq(planSchema.ownerId, ownerId),
      eq(planSchema.planYear, year)
    ))
    .orderBy(asc(planSchema.planMonth));
}

// UPDATE operations
export async function updatePlan(
  id: number,
  ownerId: string,
  data: UpdatePlanInput
): Promise<PlanDb> {
  const [updated] = await db
    .update(planSchema)
    .set(data)
    .where(and(
      eq(planSchema.id, id),
      eq(planSchema.ownerId, ownerId)
    ))
    .returning();

  if (!updated) {
    throw new Error('Plan not found or failed to update');
  }

  return updated;
}

// Status update with validation
export async function updatePlanStatus(
  id: number,
  ownerId: string,
  newStatus: string,
  additionalData?: Partial<PlanDb>
): Promise<PlanDb> {
  const current = await getPlanById(id, ownerId);
  if (!current) {
    throw new Error('Plan not found');
  }

  // Status transition validation
  const validTransitions = {
    'draft': ['active', 'cancelled'],
    'active': ['completed', 'cancelled'],
    'completed': [], // Terminal state
    'cancelled': ['draft'], // Can restart
  };

  if (!validTransitions[current.status]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${current.status} to ${newStatus}`);
  }

  const updateData = {
    status: newStatus,
    ...additionalData,
  };

  return await updatePlan(id, ownerId, updateData);
}

// Approval workflow
export async function approvePlan(request: ApprovalRequest): Promise<PlanDb> {
  const plan = await getPlanById(request.planId, ''); // We'll validate ownership in API
  
  if (!plan) {
    throw new Error('Plan not found');
  }

  if (plan.status !== 'draft') {
    throw new Error('Only draft plans can be approved');
  }

  const updateData = {
    status: 'active' as const,
    approvedBy: request.approvedBy,
    approvedAt: new Date(),
    note: request.note ? `${plan.note || ''}\n\nApproval: ${request.note}` : plan.note,
  };

  const [updated] = await db
    .update(planSchema)
    .set(updateData)
    .where(eq(planSchema.id, request.planId))
    .returning();

  if (!updated) {
    throw new Error('Failed to approve plan');
  }

  return updated;
}

// DELETE operations
export async function deletePlan(id: number, ownerId: string): Promise<void> {
  // Check if plan can be deleted (only draft status)
  const plan = await getPlanById(id, ownerId);
  if (!plan) {
    throw new Error('Plan not found');
  }

  if (plan.status !== 'draft') {
    throw new Error('Only draft plans can be deleted');
  }

  const result = await db
    .delete(planSchema)
    .where(and(
      eq(planSchema.id, id),
      eq(planSchema.ownerId, ownerId)
    ));

  if (result.rowCount === 0) {
    throw new Error('Plan not found');
  }
}

// STATISTICS and aggregations
export async function getPlanStats(ownerId: string): Promise<PlanStats> {
  const [statusStats] = await db
    .select({
      total: count(),
      draft: count(eq(planSchema.status, 'draft')),
      active: count(eq(planSchema.status, 'active')),
      completed: count(eq(planSchema.status, 'completed')),
      cancelled: count(eq(planSchema.status, 'cancelled')),
    })
    .from(planSchema)
    .where(eq(planSchema.ownerId, ownerId));

  const yearStats = await db
    .select({
      planYear: planSchema.planYear,
      count: count(),
    })
    .from(planSchema)
    .where(eq(planSchema.ownerId, ownerId))
    .groupBy(planSchema.planYear);

  // Current month plan
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const currentPlan = await getPlanByMonthYear(currentMonth, currentYear, ownerId);

  return {
    total: statusStats?.total || 0,
    byStatus: {
      draft: statusStats?.draft || 0,
      active: statusStats?.active || 0,
      completed: statusStats?.completed || 0,
      cancelled: statusStats?.cancelled || 0,
    },
    byYear: Object.fromEntries(yearStats.map(y => [y.planYear, y.count])),
    currentMonthTarget: currentPlan?.totalTargetQuantity || 0,
    currentMonthActual: currentPlan?.totalActualQuantity || 0,
    totalTargetQuantity: 0, // Will be calculated from all active plans
    totalActualQuantity: 0,  // Will be calculated from all active plans
    completionRate: 0,       // Will be calculated
  };
}

// Helper functions
export async function planExists(id: number, ownerId: string): Promise<boolean> {
  const [result] = await db
    .select({ id: planSchema.id })
    .from(planSchema)
    .where(and(
      eq(planSchema.id, id),
      eq(planSchema.ownerId, ownerId)
    ))
    .limit(1);

  return !!result;
}

export async function getPlansByStatus(status: string, ownerId: string): Promise<PlanDb[]> {
  return await db
    .select()
    .from(planSchema)
    .where(and(
      eq(planSchema.ownerId, ownerId),
      eq(planSchema.status, status)
    ))
    .orderBy(desc(planSchema.planYear), asc(planSchema.planMonth));
}

export async function getAvailableMonthsForYear(year: number, ownerId: string): Promise<number[]> {
  const existingPlans = await db
    .select({ planMonth: planSchema.planMonth })
    .from(planSchema)
    .where(and(
      eq(planSchema.ownerId, ownerId),
      eq(planSchema.planYear, year)
    ));

  const existingMonths = existingPlans.map(p => p.planMonth);
  const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  return allMonths.filter(month => !existingMonths.includes(month));
}
```

### **PHASE 2: API Layer**

#### Step 2.1: Main API Route
**File:** `src/app/api/plans/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { 
  createPlan, 
  createMultiplePlans,
  getPaginatedPlans 
} from '@/libs/queries/plan';
import {
  validateCreatePlan,
  validatePlanListParams,
  validateQuickPlan,
} from '@/libs/validations/plan';

// GET /api/plans
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
      status: searchParams.get('status') || undefined,
      year: searchParams.get('year') || undefined,
      month: searchParams.get('month') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = { ...validatePlanListParams(queryParams), ownerId };
    const result = await getPaginatedPlans(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.plans,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/plans
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const body = await request.json();

    // Check if it's a bulk creation request
    if (body.months && Array.isArray(body.months)) {
      const validatedData = validateQuickPlan(body);
      const plans = await createMultiplePlans(
        validatedData.year,
        validatedData.months,
        ownerId,
        validatedData.templateData
      );

      return NextResponse.json(
        { 
          success: true, 
          data: plans, 
          message: `${plans.length} plans created successfully` 
        },
        { status: 201 }
      );
    } else {
      // Single plan creation
      const validatedData = validateCreatePlan(body);
      const plan = await createPlan({
        ...validatedData,
        ownerId,
      });

      return NextResponse.json(
        { success: true, data: plan, message: 'Plan created successfully' },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error creating plan:', error);
    
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

#### Step 2.2: Approval Route
**File:** `src/app/api/plans/approve/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { approvePlan } from '@/libs/queries/plan';
import { validateApproval } from '@/libs/validations/plan';

// POST /api/plans/approve
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = validateApproval(body);

    // Use current user as approver
    const approvalRequest = {
      ...validatedData,
      approvedBy: userId,
    };

    const plan = await approvePlan(approvalRequest);

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Plan approved successfully',
    });
  } catch (error) {
    console.error('Error approving plan:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### **PHASE 3: Client API & Hooks Layer**

#### Step 3.1: Client API Functions
**File:** `src/libs/api/plan.ts`

```typescript
// Following exact todos pattern but with Plan-specific features
export async function fetchPlans(params = {}) {
  // Implementation following fetchTodos pattern
  // Additional parameters for year, month, status filtering
}

export async function createPlan(data) {
  // Implementation following createTodo pattern
}

export async function createMultiplePlans(data) {
  // New functionality for bulk monthly plan creation
}

export async function approvePlan(planId, note) {
  // New functionality for approval workflow
}

export async function updatePlan(id, data) {
  // Implementation following updateTodo pattern
}

export async function deletePlan(id) {
  // Implementation following deleteTodo pattern
}

export async function fetchPlanStats() {
  // Implementation following fetchTodoStats pattern
}
```

### **PHASE 4: UI Components Layer**

#### Step 4.1: Calendar Component
**File:** `src/features/plan/PlanCalendar.tsx`

```typescript
// Specialized component for monthly planning view
// - Calendar grid showing 12 months
// - Plan status indicators
// - Quick creation for missing months
// - Monthly targets display
```

#### Step 4.2: List Component
**File:** `src/features/plan/PlanList.tsx`

```typescript
// Following TodoList pattern but with:
// - Monthly grouping
// - Status indicators with colors
// - Target vs actual progress bars
// - Approval status display
// - Quick actions for status changes
```

#### Step 4.3: Form Component
**File:** `src/features/plan/PlanForm.tsx`

```typescript
// Following TodoForm pattern but with:
// - Month/year picker
// - Auto-generation of plan codes and names
// - Target quantity input
// - Date range pickers
// - Status workflow controls
```

### **PHASE 5: Page Integration**

#### Step 5.1: Dashboard Page
**File:** `src/app/[locale]/(auth)/dashboard/plans/page.tsx`

```typescript
// Following TodosPage pattern but with:
// - Calendar view as default
// - Quick month selection
// - Bulk plan creation modal
// - Annual overview widgets
// - Status-based filtering
```

---

## 🧪 **TESTING STRATEGY**

### Focus Areas:
1. **Month/year uniqueness** validation
2. **Plan code generation** (T.6, T.7 format)
3. **Date range validation**
4. **Status workflow** transitions
5. **Approval process** workflow
6. **Bulk creation** for multiple months

### Test Files:
```
src/
├── libs/validations/__tests__/plan.test.ts
├── libs/queries/__tests__/plan.test.ts
├── hooks/__tests__/usePlans.test.ts
└── features/plan/__tests__/
    ├── PlanList.test.tsx
    ├── PlanForm.test.tsx
    └── PlanCalendar.test.tsx
```

---

## ✅ **ACCEPTANCE CRITERIA**

### Functional Requirements:
- [ ] Create plans for specific months (T.6, T.7, T.8)
- [ ] Validate month/year uniqueness per owner
- [ ] List with filtering by year, month, status
- [ ] Search by plan code, name, notes
- [ ] Edit with business rule validation
- [ ] Delete draft plans only
- [ ] Status workflow (draft → active → completed)
- [ ] Approval workflow with tracking
- [ ] Bulk creation for multiple months
- [ ] Calendar view for yearly overview

### Technical Requirements:
- [ ] Month/year validation (1-12, current year+)
- [ ] Plan code auto-generation (T.6 format)
- [ ] Plan name auto-generation (06.2025 format)
- [ ] Uniqueness constraints (month+year+owner)
- [ ] Status transition validation
- [ ] Date range validation
- [ ] Approval workflow integration

### Business Rules:
- [ ] Only one plan per month per year per owner
- [ ] Plan codes follow T.X format
- [ ] Plan names follow MM.YYYY format
- [ ] Only draft plans can be deleted
- [ ] Only draft plans can be approved
- [ ] Status transitions follow workflow rules

---

## 🚀 **GETTING STARTED**

1. **Start Simple**: Begin with basic CRUD, add workflow later
2. **Month/Year Validation**: This is the key business rule
3. **Calendar UI**: Focus on intuitive monthly planning interface
4. **Test Uniqueness**: Ensure month/year combinations work correctly
5. **Build Workflow**: Add approval process incrementally

**Estimated Timeline**: 1-2 weeks

**Key Features**: Monthly planning, approval workflow, calendar interface

This plan provides the foundation table that PlanDetail will reference, with clean monthly planning features and approval workflow.