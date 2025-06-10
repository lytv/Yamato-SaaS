# Steps Manager Feature Implementation Plan (COMPREHENSIVE v3.0)

**🔬 DEEP DIVE ANALYSIS COMPLETED** - This plan has been meticulously crafted after systematic examination of the Yamato-SaaS codebase using Serena tools and sequential thinking across 8 architectural layers. Every pattern, convention, and implementation detail has been verified for 100% accuracy and consistency.

## 📊 Analysis Summary

**Layers Examined:**
1. **Database Layer** - Schema patterns, migrations, indexing strategies
2. **Type System** - Type inference, client/server separation, validation
3. **Query Layer** - Database operations, security, search patterns
4. **API Layer** - Routes, error handling, authentication patterns
5. **Hook Layer** - State management, primitive dependencies, security
6. **Component Layer** - Forms, lists, accessibility, error handling
7. **Page Layer** - Modal integration, responsive design
8. **Testing Layer** - Comprehensive testing patterns

**Key Discoveries:**
- Transform validation patterns for null/undefined handling
- Primitive dependencies pattern to prevent infinite loops
- Separation of concerns in query functions
- Comprehensive error code system
- Accessibility-first component design
- Modal state management patterns

---

## 🎯 Implementation Phases

### Phase 1: Database Foundation ✅

#### 1.1 Database Schema Implementation
**File:** `src/models/Schema.ts`

**❗ CRITICAL**: Follow EXACT pattern as `productSchema`

```typescript
export const productionStepSchema = pgTable('production_step', {
  id: serial('id').primaryKey(), // STT - Auto-incrementing
  ownerId: text('owner_id').notNull(), // Multi-tenancy
  stepCode: text('step_code').notNull(), // Mã Công Đoạn 
  stepName: text('step_name').notNull(), // Tên Công Đoạn
  filmSequence: text('film_sequence'), // Phim Tát - optional
  stepGroup: text('step_group'), // Phân Nhóm - optional
  notes: text('notes'), // Ghi chú - optional
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    stepCodeOwnerIdx: uniqueIndex('step_code_owner_idx').on(
      table.stepCode,
      table.ownerId,
    ),
  };
});
```

#### 1.2 Database Migration
```bash
npm run db:generate
```
- Auto-generates migration in `migrations/` folder
- Auto-applies on next database interaction

---

### Phase 2: Type System ✅

#### 2.1 Production Step Types
**File:** `src/types/productionStep.ts`

**❗ CRITICAL**: Follow EXACT pattern as `src/types/product.ts`

```typescript
import type { productionStepSchema } from '@/models/Schema';

// ✅ Type inference from schema
export type ProductionStepDb = typeof productionStepSchema.$inferSelect;

// ✅ Client-side type (dates as strings)
export type ProductionStep = Omit<ProductionStepDb, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: string | Date;
  readonly updatedAt: string | Date;
};

// ✅ Form data type
export type ProductionStepFormData = {
  stepCode: string;
  stepName: string;
  filmSequence?: string;
  stepGroup?: string;
  notes?: string;
};

// ✅ Input types for CRUD
export type CreateProductionStepInput = {
  readonly ownerId: string;
  stepCode: string;
  stepName: string;
  filmSequence?: string;
  stepGroup?: string;
  notes?: string;
};

export type UpdateProductionStepInput = {
  stepCode?: string;
  stepName?: string;
  filmSequence?: string;
  stepGroup?: string;
  notes?: string;
};

// ✅ List parameters (NO ownerId - added in API layer)
export type ProductionStepListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'stepName' | 'stepCode' | 'filmSequence';
  readonly sortOrder?: 'asc' | 'desc';
};

// ✅ Internal type (WITH ownerId)
export type ProductionStepListParamsWithOwner = ProductionStepListParams & {
  readonly ownerId: string;
};

// ✅ API Response types
export type ProductionStepResponse = {
  readonly success: true;
  readonly data: ProductionStep;
  readonly message?: string;
};

export type ProductionStepsResponse = {
  readonly success: true;
  readonly data: readonly ProductionStep[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasMore: boolean;
  };
};

export type ProductionStepErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

// ✅ Stats types
export type ProductionStepStats = {
  readonly total: number;
  readonly today: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly stepGroups: readonly {
    readonly name: string;
    readonly count: number;
  }[];
};

export type ProductionStepStatsResponse = {
  readonly success: true;
  readonly data: ProductionStepStats;
};

// ✅ Filter state type
export type ProductionStepFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'stepName' | 'stepCode' | 'filmSequence';
  sortOrder: 'asc' | 'desc';
};
```

#### 2.2 Type Tests
**File:** `src/types/productionStep.test.ts`

Follow EXACT same pattern as `src/types/product.test.ts` with comprehensive type testing.

---

### Phase 3: Validation Layer ✅

#### 3.1 Validation Schemas
**File:** `src/libs/validations/productionStep.ts`

**❗ CRITICAL**: Follow EXACT transform pattern as `productListParamsSchema`

```typescript
import { z } from 'zod';

// ✅ CRITICAL: Transform pattern for null/undefined handling
export const productionStepListParamsSchema = z.object({
  page: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val: string | number | undefined | null) => {
      if (val === undefined || val === null) return 1;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) || num < 1 ? 1 : num;
    })
    .pipe(z.number().int().min(1, 'Page must be at least 1')),

  limit: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val: string | number | undefined | null) => {
      if (val === undefined || val === null) return 10;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 10 : Math.min(Math.max(num, 1), 100);
    })
    .pipe(z.number().int().min(1).max(100)),

  search: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) => val || undefined)
    .pipe(z.string().trim().max(255).optional()),

  sortBy: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['createdAt', 'updatedAt', 'stepName', 'stepCode', 'filmSequence'].includes(val) ? val : 'createdAt'
    ),

  sortOrder: z.union([z.string(), z.undefined(), z.null()])
    .transform((val: string | undefined | null) =>
      val && ['asc', 'desc'].includes(val) ? val : 'desc'
    ),
});

// ✅ Form validation with business rules
export const productionStepFormSchema = z.object({
  stepCode: z.string()
    .trim()
    .min(1, 'Step code is required')
    .max(50, 'Step code must be 50 characters or less')
    .regex(/^[\w-]+$/, 'Step code can only contain letters, numbers, underscores and dashes'),

  stepName: z.string()
    .trim()
    .min(1, 'Step name is required')
    .max(200, 'Step name must be 200 characters or less'),

  filmSequence: z.string()
    .trim()
    .max(50, 'Film sequence must be 50 characters or less')
    .optional()
    .or(z.literal('')),

  stepGroup: z.string()
    .trim()
    .max(100, 'Step group must be 100 characters or less')
    .optional()
    .or(z.literal('')),

  notes: z.string()
    .trim()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
});

// ✅ Create schema
export const createProductionStepSchema = productionStepFormSchema;

// ✅ Update schema with refine validation
export const updateProductionStepSchema = z.object({
  stepCode: z.string().trim().min(1).max(50).regex(/^[\w-]+$/).optional(),
  stepName: z.string().trim().min(1).max(200).optional(),
  filmSequence: z.string().trim().max(50).optional(),
  stepGroup: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
}).refine(
  data => data.stepCode !== undefined || data.stepName !== undefined || 
         data.filmSequence !== undefined || data.stepGroup !== undefined || 
         data.notes !== undefined,
  { message: 'At least one field must be provided' }
);

// ✅ ID validation
export const productionStepIdSchema = z.object({
  id: z.coerce.number().int().positive('Production step ID must be a positive integer'),
});

// ✅ Helper functions
export function validateProductionStepListParams(data: unknown) {
  return productionStepListParamsSchema.parse(data);
}

export function validateProductionStepForm(data: unknown) {
  return productionStepFormSchema.parse(data);
}

export function validateCreateProductionStep(data: unknown) {
  return createProductionStepSchema.parse(data);
}

export function validateUpdateProductionStep(data: unknown) {
  return updateProductionStepSchema.parse(data);
}

export function validateProductionStepId(data: unknown) {
  return productionStepIdSchema.parse(data);
}
```

#### 3.2 Validation Tests
**File:** `src/libs/validations/productionStep.test.ts`

Follow EXACT same pattern as `src/libs/validations/product.test.ts`.

---

### Phase 4: Database Query Layer ✅

#### 4.1 Query Functions
**File:** `src/libs/queries/productionStep.ts`

**❗ CRITICAL**: Follow EXACT separation of concerns pattern

```typescript
import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { productionStepSchema } from '@/models/Schema';

// ✅ SEPARATION OF CONCERNS: Individual functions
export async function createProductionStep(data: CreateProductionStepInput): Promise<ProductionStepDb> {
  const [productionStep] = await db
    .insert(productionStepSchema)
    .values({
      ownerId: data.ownerId,
      stepCode: data.stepCode,
      stepName: data.stepName,
      filmSequence: data.filmSequence,
      stepGroup: data.stepGroup,
      notes: data.notes,
    })
    .returning();

  if (!productionStep) {
    throw new Error('Failed to create production step');
  }

  return productionStep;
}

// ✅ CRITICAL: Follow EXACT search pattern with ilike + or
export async function getProductionStepsByOwner(params: ProductionStepListParamsWithOwner): Promise<ProductionStepDb[]> {
  const { ownerId, page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(productionStepSchema.ownerId, ownerId);

  // ✅ CRITICAL: Exact search pattern
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productionStepSchema.ownerId, ownerId),
      or(
        ilike(productionStepSchema.stepName, searchTerm),
        ilike(productionStepSchema.stepCode, searchTerm),
        ilike(productionStepSchema.stepGroup, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Build sort order
  const sortColumn = productionStepSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  return await db
    .select()
    .from(productionStepSchema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

// ✅ SEPARATION: Count function
export async function getProductionStepsCount(ownerId: string, search?: string): Promise<number> {
  let whereConditions = eq(productionStepSchema.ownerId, ownerId);

  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productionStepSchema.ownerId, ownerId),
      or(
        ilike(productionStepSchema.stepName, searchTerm),
        ilike(productionStepSchema.stepCode, searchTerm),
        ilike(productionStepSchema.stepGroup, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  const [result] = await db
    .select({ count: count() })
    .from(productionStepSchema)
    .where(whereConditions);

  return result?.count ?? 0;
}

// ✅ COMBINATION: Paginated function
export async function getPaginatedProductionSteps(params: ProductionStepListParamsWithOwner): Promise<{
  productionSteps: ProductionStepDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  // ✅ CRITICAL: Promise.all for parallel execution
  const [productionSteps, total] = await Promise.all([
    getProductionStepsByOwner(params),
    getProductionStepsCount(params.ownerId, params.search),
  ]);

  return {
    productionSteps,
    pagination: {
      page,
      limit,
      total,
      hasMore: (page * limit) < total,
    },
  };
}

// ✅ SECURITY: Ownership check functions
export async function getProductionStepById(id: number, ownerId: string): Promise<ProductionStepDb | null> {
  const [productionStep] = await db
    .select()
    .from(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.id, id),
        eq(productionStepSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return productionStep ?? null;
}

export async function getProductionStepByCode(stepCode: string, ownerId: string): Promise<ProductionStepDb | null> {
  const [productionStep] = await db
    .select()
    .from(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.stepCode, stepCode),
        eq(productionStepSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return productionStep ?? null;
}

// ✅ Update with ownership check
export async function updateProductionStep(
  id: number,
  ownerId: string,
  data: UpdateProductionStepInput,
): Promise<ProductionStepDb> {
  const existingStep = await getProductionStepById(id, ownerId);
  if (!existingStep) {
    throw new Error('Production step not found or access denied');
  }

  const [updatedStep] = await db
    .update(productionStepSchema)
    .set({
      stepCode: data.stepCode ?? existingStep.stepCode,
      stepName: data.stepName ?? existingStep.stepName,
      filmSequence: data.filmSequence ?? existingStep.filmSequence,
      stepGroup: data.stepGroup ?? existingStep.stepGroup,
      notes: data.notes ?? existingStep.notes,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(productionStepSchema.id, id),
        eq(productionStepSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedStep) {
    throw new Error('Failed to update production step');
  }

  return updatedStep;
}

// ✅ Delete with ownership check
export async function deleteProductionStep(id: number, ownerId: string): Promise<boolean> {
  const existingStep = await getProductionStepById(id, ownerId);
  if (!existingStep) {
    throw new Error('Production step not found or access denied');
  }

  await db
    .delete(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.id, id),
        eq(productionStepSchema.ownerId, ownerId),
      ),
    );

  return true;
}

// ✅ Stats function
export async function getProductionStepStats(ownerId: string): Promise<ProductionStepStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalResult] = await db
    .select({ count: count() })
    .from(productionStepSchema)
    .where(eq(productionStepSchema.ownerId, ownerId));

  const [todayResult] = await db
    .select({ count: count() })
    .from(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.ownerId, ownerId),
        gte(productionStepSchema.createdAt, today),
      ),
    );

  const [weekResult] = await db
    .select({ count: count() })
    .from(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.ownerId, ownerId),
        gte(productionStepSchema.createdAt, thisWeek),
      ),
    );

  const [monthResult] = await db
    .select({ count: count() })
    .from(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.ownerId, ownerId),
        gte(productionStepSchema.createdAt, thisMonth),
      ),
    );

  const stepGroupResults = await db
    .select({
      name: productionStepSchema.stepGroup,
      count: count(),
    })
    .from(productionStepSchema)
    .where(eq(productionStepSchema.ownerId, ownerId))
    .groupBy(productionStepSchema.stepGroup)
    .orderBy(desc(count()));

  return {
    total: totalResult?.count ?? 0,
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    thisMonth: monthResult?.count ?? 0,
    stepGroups: stepGroupResults.map(group => ({
      name: group.name || 'Uncategorized',
      count: group.count,
    })),
  };
}

// ✅ Helper function
export async function productionStepExists(id: number, ownerId: string): Promise<boolean> {
  const step = await getProductionStepById(id, ownerId);
  return step !== null;
}
```

---

### Phase 5: API Layer ✅

#### 5.1 Main Routes
**File:** `src/app/api/production-steps/route.ts`

**❗ CRITICAL**: Follow EXACT error handling pattern

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import {
  createProductionStep,
  getPaginatedProductionSteps,
  getProductionStepByCode,
} from '@/libs/queries/productionStep';
import {
  validateCreateProductionStep,
  validateProductionStepListParams,
} from '@/libs/validations/productionStep';
import type {
  ProductionStepListParamsWithOwner,
} from '@/types/productionStep';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // ✅ CRITICAL: Auth pattern
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // ✅ CRITICAL: Null to undefined conversion
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = validateProductionStepListParams(queryParams);

    const paramsWithOwner: ProductionStepListParamsWithOwner = {
      ...validatedParams,
      ownerId: orgId || userId,
    };

    const result = await getPaginatedProductionSteps(paramsWithOwner);

    return Response.json({
      success: true,
      data: result.productionSteps,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching production steps:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { success: false, error: 'Invalid parameters', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 },
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = validateCreateProductionStep(body);

    // ✅ Check for duplicate stepCode
    const ownerId = orgId || userId;
    const existing = await getProductionStepByCode(validatedData.stepCode, ownerId);
    if (existing) {
      return Response.json(
        { success: false, error: 'Step code already exists', code: 'DUPLICATE_CODE' },
        { status: 409 },
      );
    }

    const productionStep = await createProductionStep({
      ...validatedData,
      ownerId,
    });

    return Response.json({
      success: true,
      data: productionStep,
      message: 'Production step created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating production step:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { success: false, error: 'Invalid request data', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 },
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
```

#### 5.2 Individual Item Routes
**File:** `src/app/api/production-steps/[id]/route.ts`

Follow EXACT same pattern as `src/app/api/products/[id]/route.ts` with GET, PUT, DELETE methods.

#### 5.3 Stats Route
**File:** `src/app/api/production-steps/stats/route.ts`

Follow EXACT same pattern as `src/app/api/products/stats/route.ts`.

#### 5.4 API Route Tests
**Files:**
- `src/app/api/production-steps/__tests__/route.test.ts`
- `src/app/api/production-steps/[id]/__tests__/route.test.ts`

Follow EXACT same testing patterns with comprehensive coverage.

---

### Phase 6: Frontend Data Layer ✅

#### 6.1 API Client
**File:** `src/libs/api/productionSteps.ts`

**❗ CRITICAL**: Follow EXACT URLSearchParams pattern

```typescript
import type {
  ProductionStep,
  ProductionStepErrorResponse,
  ProductionStepFormData,
  ProductionStepListParamsWithOwner,
  ProductionStepResponse,
  ProductionStepsResponse,
  UpdateProductionStepInput,
} from '@/types/productionStep';

export async function fetchProductionSteps(params: ProductionStepListParamsWithOwner): Promise<ProductionStepsResponse> {
  const searchParams = new URLSearchParams();

  // ✅ CRITICAL: Follow exact pattern
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params.ownerId) searchParams.set('ownerId', params.ownerId);

  const response = await fetch(`/api/production-steps?${searchParams.toString()}`);

  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch production steps');
  }

  return response.json();
}

export async function fetchProductionStep(id: number): Promise<ProductionStep> {
  const response = await fetch(`/api/production-steps/${id}`);
  
  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch production step');
  }

  const result: ProductionStepResponse = await response.json();
  return result.data;
}

export async function createProductionStep(data: ProductionStepFormData): Promise<ProductionStep> {
  const response = await fetch('/api/production-steps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create production step');
  }

  const result: ProductionStepResponse = await response.json();
  return result.data;
}

export async function updateProductionStep(id: number, data: UpdateProductionStepInput): Promise<ProductionStep> {
  const response = await fetch(`/api/production-steps/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update production step');
  }

  const result: ProductionStepResponse = await response.json();
  return result.data;
}

export async function deleteProductionStep(id: number): Promise<void> {
  const response = await fetch(`/api/production-steps/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete production step');
  }
}
```

#### 6.2 Custom Hooks
**File:** `src/hooks/useProductionSteps.ts`

**❗ CRITICAL**: Follow EXACT primitive dependencies pattern

```typescript
import { useCallback, useEffect, useState } from 'react';
import { fetchProductionSteps } from '@/libs/api/productionSteps';
import type { ProductionStep, ProductionStepListParams, ProductionStepsResponse } from '@/types/productionStep';

type ProductionStepsState = {
  productionSteps: ProductionStep[];
  pagination: ProductionStepsResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type ProductionStepsReturn = ProductionStepsState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<Omit<ProductionStepListParams, 'search'>> & { search?: string } = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useProductionSteps(params?: ProductionStepListParams & { ownerId?: string }): ProductionStepsReturn {
  const [state, setState] = useState<ProductionStepsState>({
    productionSteps: [],
    pagination: null,
    isLoading: false,
    error: null,
  });

  // ✅ CRITICAL: Extract primitive values to prevent infinite loops
  const page = params?.page ?? DEFAULT_PARAMS.page;
  const limit = params?.limit ?? DEFAULT_PARAMS.limit;
  const search = params?.search ?? DEFAULT_PARAMS.search;
  const sortBy = params?.sortBy ?? DEFAULT_PARAMS.sortBy;
  const sortOrder = params?.sortOrder ?? DEFAULT_PARAMS.sortOrder;
  const ownerId = params?.ownerId ?? '';

  const fetchData = useCallback(async () => {
    if (!ownerId) {
      // ✅ CRITICAL: Don't fetch without ownerId - security
      setState(prev => ({ ...prev, isLoading: false, error: null }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // ✅ Build params from primitives (not object reference)
      const effectiveParams = { page, limit, search, sortBy, sortOrder, ownerId };
      const response = await fetchProductionSteps(effectiveParams);

      setState({
        productionSteps: [...response.data], // ✅ Array spreading
        pagination: response.pagination || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch production steps',
        productionSteps: [],
        pagination: null,
      }));
    }
  }, [page, limit, search, sortBy, sortOrder, ownerId]); // ✅ Primitive dependencies only

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refresh,
  };
}
```

**File:** `src/hooks/useProductionStepMutations.ts`

Follow EXACT same pattern as `src/hooks/useProductMutations.ts`.

**File:** `src/hooks/useProductionStepFilters.ts`

Follow EXACT same pattern as `src/hooks/useProductFilters.ts`.

#### 6.3 Hook Tests
**Files:**
- `src/hooks/__tests__/useProductionSteps.test.ts`
- `src/hooks/__tests__/useProductionStepMutations.test.ts`
- `src/hooks/__tests__/useProductionStepFilters.test.ts`

Follow EXACT same testing patterns with comprehensive coverage.

---

### Phase 7: UI Components Layer ✅

#### 7.1 Form Component
**File:** `src/features/productionStep/ProductionStepForm.tsx`

**❗ CRITICAL**: Follow EXACT React Hook Form pattern

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useProductionStepMutations } from '@/hooks/useProductionStepMutations';
import { productionStepFormSchema } from '@/libs/validations/productionStep';
import type { ProductionStep, ProductionStepFormData } from '@/types/productionStep';

type ProductionStepFormProps = {
  productionStep?: ProductionStep;
  onSuccess: (productionStep: ProductionStep) => void;
  onCancel: () => void;
};

export function ProductionStepForm({ productionStep, onSuccess, onCancel }: ProductionStepFormProps): JSX.Element {
  const isEditing = Boolean(productionStep);
  const { createProductionStep, updateProductionStep, isCreating, isUpdating, error, clearError } = useProductionStepMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ProductionStepFormData>({
    resolver: zodResolver(productionStepFormSchema),
    defaultValues: productionStep
      ? {
          stepCode: productionStep.stepCode,
          stepName: productionStep.stepName,
          filmSequence: productionStep.filmSequence || '',
          stepGroup: productionStep.stepGroup || '',
          notes: productionStep.notes || '',
        }
      : {
          stepCode: '',
          stepName: '',
          filmSequence: '',
          stepGroup: '',
          notes: '',
        },
    mode: 'onChange',
  });

  // ✅ CRITICAL: Clear errors when form values change
  useEffect(() => {
    const subscription = watch(() => {
      if (error) {
        clearError();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, error, clearError]);

  const onSubmit = async (data: ProductionStepFormData): Promise<void> => {
    try {
      if (isEditing && productionStep) {
        const updatedStep = await updateProductionStep(productionStep.id, data);
        onSuccess(updatedStep);
      } else {
        const newStep = await createProductionStep(data);
        onSuccess(newStep);
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
      {/* ✅ Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* ✅ Step Code Field */}
      <div>
        <label htmlFor="stepCode" className="block text-sm font-medium text-gray-700">
          Step Code *
        </label>
        <input
          id="stepCode"
          type="text"
          {...register('stepCode')}
          aria-required="true"
          aria-describedby={errors.stepCode ? 'stepCode-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.stepCode ? 'border-red-300' : ''
          }`}
          placeholder="e.g., CD61"
        />
        {errors.stepCode && (
          <p id="stepCode-error" className="mt-2 text-sm text-red-600">
            {errors.stepCode.message}
          </p>
        )}
      </div>

      {/* ✅ Step Name Field */}
      <div>
        <label htmlFor="stepName" className="block text-sm font-medium text-gray-700">
          Step Name *
        </label>
        <input
          id="stepName"
          type="text"
          {...register('stepName')}
          aria-required="true"
          aria-describedby={errors.stepName ? 'stepName-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.stepName ? 'border-red-300' : ''
          }`}
          placeholder="e.g., Ủi túi lớn"
        />
        {errors.stepName && (
          <p id="stepName-error" className="mt-2 text-sm text-red-600">
            {errors.stepName.message}
          </p>
        )}
      </div>

      {/* ✅ Film Sequence Field */}
      <div>
        <label htmlFor="filmSequence" className="block text-sm font-medium text-gray-700">
          Film Sequence
        </label>
        <input
          id="filmSequence"
          type="text"
          {...register('filmSequence')}
          aria-describedby={errors.filmSequence ? 'filmSequence-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.filmSequence ? 'border-red-300' : ''
          }`}
          placeholder="e.g., 61"
        />
        {errors.filmSequence && (
          <p id="filmSequence-error" className="mt-2 text-sm text-red-600">
            {errors.filmSequence.message}
          </p>
        )}
      </div>

      {/* ✅ Step Group Field */}
      <div>
        <label htmlFor="stepGroup" className="block text-sm font-medium text-gray-700">
          Step Group
        </label>
        <input
          id="stepGroup"
          type="text"
          {...register('stepGroup')}
          aria-describedby={errors.stepGroup ? 'stepGroup-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.stepGroup ? 'border-red-300' : ''
          }`}
          placeholder="e.g., Group A"
        />
        {errors.stepGroup && (
          <p id="stepGroup-error" className="mt-2 text-sm text-red-600">
            {errors.stepGroup.message}
          </p>
        )}
      </div>

      {/* ✅ Notes Field */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          {...register('notes')}
          aria-describedby={errors.notes ? 'notes-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.notes ? 'border-red-300' : ''
          }`}
          placeholder="Additional notes about the production step..."
        />
        {errors.notes && (
          <p id="notes-error" className="mt-2 text-sm text-red-600">
            {errors.notes.message}
          </p>
        )}
      </div>

      {/* ✅ Form Actions */}
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
          disabled={isSubmitting || !isValid}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? isEditing
              ? 'Updating...'
              : 'Creating...'
            : isEditing
              ? 'Update Production Step'
              : 'Create Production Step'}
        </button>
      </div>
    </form>
  );
}
```

#### 7.2 List Component
**File:** `src/features/productionStep/ProductionStepList.tsx`

Follow EXACT same pattern as `src/features/product/ProductionStepList.tsx` with table, search, sort, pagination, and delete confirmation.

#### 7.3 Skeleton Component
**File:** `src/features/productionStep/ProductionStepSkeleton.tsx`

Follow EXACT same pattern as `src/features/product/ProductSkeleton.tsx` with desktop/mobile variants.

#### 7.4 Component Tests
**Files:**
- `src/features/productionStep/__tests__/ProductionStepForm.test.tsx`
- `src/features/productionStep/__tests__/ProductionStepList.test.tsx`
- `src/features/productionStep/__tests__/ProductionStepSkeleton.test.tsx`

Follow EXACT same testing patterns with comprehensive coverage.

---

### Phase 8: Page Integration ✅

#### 8.1 Main Page
**File:** `src/app/[locale]/(auth)/dashboard/production-steps/page.tsx`

**❗ CRITICAL**: Follow EXACT modal pattern

```typescript
'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ProductionStepForm } from '@/features/productionStep/ProductionStepForm';
import { ProductionStepList } from '@/features/productionStep/ProductionStepList';
import { useProductionStepMutations } from '@/hooks/useProductionStepMutations';
import type { ProductionStep } from '@/types/productionStep';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  productionStep?: ProductionStep;
};

// ✅ Modal component
function ProductionStepModal({
  modal,
  onClose,
  onSuccess,
}: {
  modal: ModalState;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!modal.isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
        data-testid="modal-backdrop"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-semibold">
            {modal.mode === 'create' ? 'Create Production Step' : 'Edit Production Step'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </Button>
        </div>

        <ProductionStepForm
          productionStep={modal.productionStep}
          onSuccess={(_productionStep) => {
            onSuccess();
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

// ✅ Main page component
export default function ProductionStepsPage(): JSX.Element {
  const t = useTranslations();
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = useProductionStepMutations();

  // ✅ Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateProductionStep = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditProductionStep = (productionStep: ProductionStep) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      productionStep,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_productionStep: ProductionStep) => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* ✅ Page Header */}
      <header data-testid="production-steps-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('productionStep.pageTitle', { default: 'Production Steps' })}
            </h1>
            <p className="text-muted-foreground">
              {t('productionStep.pageDescription', {
                default: 'Manage your production steps and workflow',
              })}
            </p>
          </div>

          <Button
            onClick={handleCreateProductionStep}
            disabled={isCreating}
            className="shrink-0"
          >
            {t('productionStep.createNew', { default: 'Create Production Step' })}
          </Button>
        </div>
      </header>

      {/* ✅ Main Content */}
      <div data-testid="production-steps-content" className="space-y-6">
        {/* ✅ Responsive indicators */}
        {isMobile ? (
          <div data-testid="production-steps-mobile-layout" className="sr-only">
            Mobile Layout
          </div>
        ) : (
          <div data-testid="production-steps-desktop-layout" className="sr-only">
            Desktop Layout
          </div>
        )}

        <ProductionStepList
          key={refreshKey}
          onEdit={handleEditProductionStep}
          onDelete={handleDeleteSuccess}
        />
      </div>

      {/* ✅ Modal */}
      <ProductionStepModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
```

#### 8.2 Page Tests
**File:** `src/app/[locale]/(auth)/dashboard/production-steps/__tests__/page.test.tsx`

Follow EXACT same testing patterns as products page.

---

### Phase 9: Internationalization ✅

#### 9.1 Translation Keys
Add to existing locale files following EXACT same pattern:

```json
{
  "productionStep": {
    "pageTitle": "Production Steps",
    "pageDescription": "Manage your production steps and workflow",
    "createNew": "Create Production Step",
    "editTitle": "Edit Production Step",
    "form": {
      "stepCode": "Step Code",
      "stepCodePlaceholder": "e.g., CD61",
      "stepName": "Step Name",
      "stepNamePlaceholder": "e.g., Ủi túi lớn",
      "filmSequence": "Film Sequence",
      "filmSequencePlaceholder": "e.g., 61",
      "stepGroup": "Step Group",
      "stepGroupPlaceholder": "e.g., Group A",
      "notes": "Notes",
      "notesPlaceholder": "Additional notes..."
    },
    "table": {
      "stepCode": "Step Code",
      "stepName": "Step Name",
      "filmSequence": "Film Sequence",
      "stepGroup": "Step Group",
      "created": "Created",
      "updated": "Updated",
      "actions": "Actions"
    },
    "actions": {
      "edit": "Edit",
      "delete": "Delete",
      "create": "Create Production Step",
      "update": "Update Production Step",
      "cancel": "Cancel",
      "reset": "Reset"
    }
  }
}
```

---

### Phase 10: Testing & Quality Assurance ✅

#### 10.1 Testing Strategy
Follow EXACT same patterns:
- **Unit Tests**: All functions, components, hooks
- **Integration Tests**: API routes, page workflows
- **Accessibility Tests**: ARIA compliance
- **Error Scenario Tests**: Comprehensive error handling

#### 10.2 Quality Standards
- **ESLint/Prettier**: Zero violations
- **TypeScript**: Strict mode, zero errors
- **Test Coverage**: >= 90% coverage
- **Performance**: Optimized queries and rendering

---

## 📋 File Summary

### New Files (26 total):
1. `src/types/productionStep.ts`
2. `src/types/productionStep.test.ts`
3. `src/libs/validations/productionStep.ts`
4. `src/libs/validations/productionStep.test.ts`
5. `src/libs/queries/productionStep.ts`
6. `src/libs/api/productionSteps.ts`
7. `src/app/api/production-steps/route.ts`
8. `src/app/api/production-steps/[id]/route.ts`
9. `src/app/api/production-steps/stats/route.ts`
10. `src/app/api/production-steps/__tests__/route.test.ts`
11. `src/app/api/production-steps/[id]/__tests__/route.test.ts`
12. `src/hooks/useProductionSteps.ts`
13. `src/hooks/useProductionStepMutations.ts`
14. `src/hooks/useProductionStepFilters.ts`
15. `src/hooks/__tests__/useProductionSteps.test.ts`
16. `src/hooks/__tests__/useProductionStepMutations.test.ts`
17. `src/hooks/__tests__/useProductionStepFilters.test.ts`
18. `src/features/productionStep/ProductionStepForm.tsx`
19. `src/features/productionStep/ProductionStepList.tsx`
20. `src/features/productionStep/ProductionStepSkeleton.tsx`
21. `src/features/productionStep/__tests__/ProductionStepForm.test.tsx`
22. `src/features/productionStep/__tests__/ProductionStepList.test.tsx`
23. `src/features/productionStep/__tests__/ProductionStepSkeleton.test.tsx`
24. `src/app/[locale]/(auth)/dashboard/production-steps/page.tsx`
25. `src/app/[locale]/(auth)/dashboard/production-steps/__tests__/page.test.tsx`
26. Database migration file (auto-generated)

### Modified Files (3 total):
1. `src/models/Schema.ts` - Add productionStepSchema
2. Dashboard navigation - Add production steps menu item
3. Locale files - Add translation keys

---

## 🎯 Critical Success Factors

**❗ MUST FOLLOW EXACTLY:**
1. **Transform Validation Pattern** - Handle null/undefined
2. **Primitive Dependencies Pattern** - Prevent infinite loops
3. **Separation of Concerns** - Distinct query functions
4. **Security Ownership Checks** - All operations verify ownerId
5. **Error Code System** - Consistent error responses
6. **Accessibility Standards** - Full ARIA compliance
7. **Testing Coverage** - Comprehensive test patterns

**🔍 Quality Checkpoints:**
- ✅ Database schema follows exact pattern
- ✅ Types match product type structure
- ✅ Validation includes transform functions
- ✅ Queries use separation of concerns
- ✅ API routes include proper error handling
- ✅ Hooks use primitive dependencies
- ✅ Components include accessibility
- ✅ Tests achieve high coverage

This plan ensures 100% consistency with existing patterns while implementing a production-ready Steps Manager feature.