# 📋 TODOS IMPLEMENTATION PATTERN - COMPREHENSIVE GUIDE

## 🎯 **Mục đích**
Đây là pattern implementation đầy đủ cho CRUD features trong Yamato-SaaS, được sử dụng làm base cho các tính năng khác. Pattern này đảm bảo type safety, multi-tenancy, authentication, và best practices.

## 🏗️ **ARCHITECTURE OVERVIEW**

```
┌─ Page Component (UI Entry Point)
├─ React Hooks (State Management)
├─ API Client (Frontend → Backend)
├─ API Routes (HTTP Handlers)
├─ Database Queries (Drizzle ORM)
├─ Validation Schemas (Zod)
├─ Type Definitions (TypeScript)
└─ Database Schema (Drizzle)
```

## 📁 **FILE STRUCTURE PATTERN**

```
src/
├── models/Schema.ts                    # Database schema
├── types/[feature].ts                  # TypeScript types
├── libs/
│   ├── validations/[feature].ts        # Zod validation schemas
│   ├── queries/[feature].ts            # Database queries
│   └── api/[feature].ts                # API client functions
├── hooks/
│   ├── use[Feature]s.ts                # Data fetching hook
│   ├── use[Feature]Mutations.ts        # CRUD mutations hook
│   └── use[Feature]Filters.ts          # Filtering/search hook
├── features/[feature]/
│   ├── [Feature]Form.tsx               # Create/Edit form
│   ├── [Feature]List.tsx               # List component
│   └── [Feature]Skeleton.tsx           # Loading skeleton
├── app/api/[features]/
│   ├── route.ts                        # GET (list), POST (create)
│   ├── [id]/route.ts                   # GET, PUT, DELETE by ID
│   └── stats/route.ts                  # Statistics endpoint
└── app/[locale]/(auth)/dashboard/[features]/
    └── page.tsx                        # Main page component
```

## 🗄️ **1. DATABASE SCHEMA LAYER**

**File**: `src/models/Schema.ts`

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const [feature]Schema = pgTable('[feature]', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(), // Support multi-tenancy
  title: text('title').notNull(),
  message: text('message').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});
```

**Key Patterns:**
- Always include `ownerId` for multi-tenancy
- Use `serial` for auto-incrementing IDs
- Include `createdAt` và `updatedAt` timestamps
- Use `mode: 'date'` for proper Date objects

## 🔧 **2. TYPE DEFINITIONS LAYER**

**File**: `src/types/[feature].ts`

```typescript
import type { [feature]Schema } from '@/models/Schema';

// Server-side type (with Date objects)
export type [Feature]Db = typeof [feature]Schema.$inferSelect;

// Client-side type (dates as strings from API)
export type [Feature] = Omit<[Feature]Db, 'createdAt' | 'updatedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Input types
export type Create[Feature]Input = typeof [feature]Schema.$inferInsert;
export type Update[Feature]Input = Partial<Omit<Create[Feature]Input, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// API request/response types
export type [Feature]ListParams = {
  search?: string;
  ownerId: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
};

export type [Feature]sResponse = {
  success: true;
  data: [Feature][];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type [Feature]Response = {
  success: true;
  data: [Feature];
  message?: string;
};

export type [Feature]ErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Form data type
export type [Feature]FormData = {
  title: string;
  message: string;
};

// Filter state type
export type [Feature]Filters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
};
```

**Key Patterns:**
- Separate `Db` and client types for Date handling
- Use Drizzle's `$inferSelect` and `$inferInsert`
- Consistent response format với `success` boolean
- Separate form data from API types

## ✅ **3. VALIDATION LAYER**

**File**: `src/libs/validations/[feature].ts`

```typescript
import { z } from 'zod';

// Base schemas
export const Create[Feature]Schema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
});

export const Update[Feature]Schema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters').optional(),
}).refine(
  data => data.title !== undefined || data.message !== undefined,
  { message: 'At least one field must be provided' },
);

export const [Feature]IdSchema = z.object({
  id: z.coerce.number().int().positive('[Feature] ID must be a positive integer'),
});

// List parameters với robust null/undefined handling
export const [Feature]ListParamsSchema = z.object({
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

  sortBy: z.union([z.enum(['createdAt', 'updatedAt', 'title']), z.undefined(), z.null()])
    .transform(val => val && ['createdAt', 'updatedAt', 'title'].includes(val) ? val : 'createdAt'),

  sortOrder: z.union([z.enum(['asc', 'desc']), z.undefined(), z.null()])
    .transform(val => val && ['asc', 'desc'].includes(val) ? val : 'desc'),
});

// API request schemas
export const Create[Feature]RequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  message: z.string().min(1, 'Message is required').max(2000),
});

// Form validation schema
export const [Feature]FormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  message: z.string().min(1, 'Message is required').max(2000),
});

// Type exports
export type Create[Feature]Request = z.infer<typeof Create[Feature]RequestSchema>;
export type Update[Feature]Request = z.infer<typeof Update[Feature]Schema>;
export type [Feature]ListParams = z.infer<typeof [Feature]ListParamsSchema>;
export type [Feature]FormData = z.infer<typeof [Feature]FormSchema>;

// Validation helpers
export function validateCreate[Feature](data: unknown): Create[Feature]Request {
  return Create[Feature]RequestSchema.parse(data);
}

export function validateUpdate[Feature](data: unknown): Update[Feature]Request {
  return Update[Feature]Schema.parse(data);
}

export function validate[Feature]Id(data: unknown): { id: number } {
  return [Feature]IdSchema.parse(data);
}

export function validate[Feature]ListParams(data: unknown): [Feature]ListParams {
  return [Feature]ListParamsSchema.parse(data);
}
```

**Key Patterns:**
- Robust handling của `null`/`undefined` từ query parameters
- Transform functions để convert strings to numbers
- Refine validation cho complex business rules
- Separate schemas cho different use cases
- Helper functions để avoid repetitive parsing

## 🗃️ **4. DATABASE QUERIES LAYER**

**File**: `src/libs/queries/[feature].ts`

```typescript
import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { [feature]Schema } from '@/models/Schema';

/**
 * Create new [feature]
 */
export async function create[Feature](data: Create[Feature]Input): Promise<[Feature]Db> {
  const [[feature]] = await db
    .insert([feature]Schema)
    .values({
      ownerId: data.ownerId,
      title: data.title,
      message: data.message,
    })
    .returning();

  if (![feature]) {
    throw new Error('Failed to create [feature]');
  }

  return [feature];
}

/**
 * Get [feature]s by owner với pagination and filtering
 */
export async function get[Feature]sByOwner(params: [Feature]ListParams): Promise<[Feature]Db[]> {
  const { ownerId, page, limit, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq([feature]Schema.ownerId, ownerId);

  // Add search filter
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq([feature]Schema.ownerId, ownerId),
      or(
        ilike([feature]Schema.title, searchTerm),
        ilike([feature]Schema.message, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Build sort order
  const sortColumn = [feature]Schema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  return await db
    .select()
    .from([feature]Schema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get total count for pagination
 */
export async function get[Feature]sCount(ownerId: string, search?: string): Promise<number> {
  let whereConditions = eq([feature]Schema.ownerId, ownerId);

  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq([feature]Schema.ownerId, ownerId),
      or(
        ilike([feature]Schema.title, searchTerm),
        ilike([feature]Schema.message, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  const [result] = await db
    .select({ count: count() })
    .from([feature]Schema)
    .where(whereConditions);

  return result?.count ?? 0;
}

/**
 * Get single [feature] by ID với ownership check
 */
export async function get[Feature]ById(id: number, ownerId: string): Promise<[Feature]Db | null> {
  const [[feature]] = await db
    .select()
    .from([feature]Schema)
    .where(
      and(
        eq([feature]Schema.id, id),
        eq([feature]Schema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return [feature] ?? null;
}

/**
 * Update [feature] với ownership check
 */
export async function update[Feature](
  id: number,
  ownerId: string,
  data: Update[Feature]Input,
): Promise<[Feature]Db> {
  // Check ownership first
  const existing[Feature] = await get[Feature]ById(id, ownerId);
  if (!existing[Feature]) {
    throw new Error('[Feature] not found or access denied');
  }

  const [updated[Feature]] = await db
    .update([feature]Schema)
    .set({
      title: data.title ?? existing[Feature].title,
      message: data.message ?? existing[Feature].message,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq([feature]Schema.id, id),
        eq([feature]Schema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updated[Feature]) {
    throw new Error('Failed to update [feature]');
  }

  return updated[Feature];
}

/**
 * Delete [feature] với ownership check
 */
export async function delete[Feature](id: number, ownerId: string): Promise<boolean> {
  // Check ownership first
  const existing[Feature] = await get[Feature]ById(id, ownerId);
  if (!existing[Feature]) {
    throw new Error('[Feature] not found or access denied');
  }

  await db
    .delete([feature]Schema)
    .where(
      and(
        eq([feature]Schema.id, id),
        eq([feature]Schema.ownerId, ownerId),
      ),
    );

  return true;
}

/**
 * Get paginated [feature]s với metadata
 */
export async function getPaginated[Feature]s(params: [Feature]ListParams): Promise<{
  [feature]s: [Feature]Db[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const [[feature]s, total] = await Promise.all([
    get[Feature]sByOwner(params),
    get[Feature]sCount(params.ownerId, params.search),
  ]);

  const hasMore = params.page * params.limit < total;

  return {
    [feature]s,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      hasMore,
    },
  };
}
```

**Key Patterns:**
- Always include ownership checks trong CRUD operations
- Use Drizzle ORM's `and`, `or`, `eq` conditions
- Implement search với `ilike` for case-insensitive matching
- Consistent error messages
- Pagination với offset calculation
- Promise.all optimization để parallel queries

## 🌐 **5. API ROUTES LAYER**

### **Main Route**: `src/app/api/[features]/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { create[Feature], getPaginated[Feature]s } from '@/libs/queries/[feature]';
import { validateCreate[Feature], validate[Feature]ListParams } from '@/libs/validations/[feature]';

/**
 * GET /api/[features] - List [feature]s với pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // Multi-tenancy: Use orgId for organization, userId for personal
    const ownerId = orgId || userId;

    // Parse query parameters với proper null handling
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = { ...validate[Feature]ListParams(queryParams), ownerId };
    const result = await getPaginated[Feature]s(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.[feature]s,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching [feature]s:', error);

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
 * POST /api/[features] - Create new [feature]
 */
export async function POST(request: NextRequest) {
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
    const validatedData = validateCreate[Feature](body);

    // Create [feature] với owner information
    const [feature] = await create[Feature]({
      ...validatedData,
      ownerId,
    });

    return NextResponse.json(
      {
        success: true,
        data: [feature],
        message: '[Feature] created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating [feature]:', error);

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

### **Individual Route**: `src/app/api/[features]/[id]/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { delete[Feature], get[Feature]ById, update[Feature] } from '@/libs/queries/[feature]';
import { validate[Feature]Id, validateUpdate[Feature] } from '@/libs/validations/[feature]';

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * GET /api/[features]/[id] - Get single [feature]
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const ownerId = orgId || userId;
    const { id } = validate[Feature]Id({ id: params.id });

    const [feature] = await get[Feature]ById(id, ownerId);
    if (![feature]) {
      return NextResponse.json(
        { success: false, error: '[Feature] not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: [feature] });
  } catch (error) {
    // Handle errors...
  }
}

/**
 * PUT /api/[features]/[id] - Update [feature]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Similar implementation với validation và ownership check
}

/**
 * DELETE /api/[features]/[id] - Delete [feature]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  // Similar implementation với ownership check
}
```

**Key Patterns:**
- Always authenticate với Clerk's `auth()`
- Multi-tenancy support với `orgId || userId`
- Consistent error response format
- Proper HTTP status codes
- ZodError handling cho validation errors
- Convert `null` to `undefined` trong query parameters

## 🔌 **6. API CLIENT LAYER**

**File**: `src/libs/api/[features].ts`

```typescript
import type {
  Create[Feature]Input,
  [Feature],
  [Feature]ErrorResponse,
  [Feature]ListParams,
  [Feature]Response,
  [Feature]sResponse,
  Update[Feature]Input,
} from '@/types/[feature]';

/**
 * Fetch [feature]s với pagination and filtering
 */
export async function fetch[Feature]s(
  params: Omit<[Feature]ListParams, 'ownerId'> = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
): Promise<[Feature]sResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', params.page?.toString() || '1');
  searchParams.set('limit', params.limit?.toString() || '10');
  searchParams.set('sortBy', params.sortBy || 'createdAt');
  searchParams.set('sortOrder', params.sortOrder || 'desc');

  if (params.search) {
    searchParams.set('search', params.search);
  }

  const response = await fetch(`/api/[features]?${searchParams.toString()}`);

  if (!response.ok) {
    const error: [Feature]ErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch [feature]s');
  }

  return response.json();
}

/**
 * Create new [feature]
 */
export async function create[Feature](data: Omit<Create[Feature]Input, 'ownerId'>): Promise<[Feature]> {
  const response = await fetch('/api/[features]', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: [Feature]ErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create [feature]');
  }

  const result: [Feature]Response = await response.json();
  return result.data;
}

/**
 * Update [feature]
 */
export async function update[Feature](id: number, data: Update[Feature]Input): Promise<[Feature]> {
  const response = await fetch(`/api/[features]/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: [Feature]ErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update [feature]');
  }

  const result: [Feature]Response = await response.json();
  return result.data;
}

/**
 * Delete [feature]
 */
export async function delete[Feature](id: number): Promise<void> {
  const response = await fetch(`/api/[features]/${id}`, { method: 'DELETE' });

  if (!response.ok) {
    const error: [Feature]ErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete [feature]');
  }
}
```

**Key Patterns:**
- Omit `ownerId` từ client params (server sẽ add)
- Proper URLSearchParams construction
- Consistent error handling
- Type-safe responses
- Default parameter values

## 🎣 **7. REACT HOOKS LAYER**

### **Data Fetching Hook**: `src/hooks/use[Features].ts`

```typescript
import { useCallback, useEffect, useState } from 'react';
import { fetch[Feature]s } from '@/libs/api/[features]';

type [Feature]sState = {
  [feature]s: [Feature][];
  pagination: [Feature]sResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type [Feature]sReturn = [Feature]sState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Omit<[Feature]ListParams, 'ownerId'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function use[Feature]s(params?: Omit<[Feature]ListParams, 'ownerId'>): [Feature]sReturn {
  const [state, setState] = useState<[Feature]sState>({
    [feature]s: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  // Extract primitive values để avoid object reference issues
  const page = params?.page ?? DEFAULT_PARAMS.page;
  const limit = params?.limit ?? DEFAULT_PARAMS.limit;
  const search = params?.search ?? DEFAULT_PARAMS.search;
  const sortBy = params?.sortBy ?? DEFAULT_PARAMS.sortBy;
  const sortOrder = params?.sortOrder ?? DEFAULT_PARAMS.sortOrder;

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const effectiveParams = { page, limit, search, sortBy, sortOrder };
      const response = await fetch[Feature]s(effectiveParams);

      setState({
        [feature]s: response.data,
        pagination: response.pagination || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        [feature]s: [],
        pagination: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [page, limit, search, sortBy, sortOrder]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refresh };
}
```

### **Mutations Hook**: `src/hooks/use[Feature]Mutations.ts`

```typescript
import { useCallback, useState } from 'react';
import { create[Feature], delete[Feature], update[Feature] } from '@/libs/api/[features]';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  create[Feature]: (input: [Feature]FormData) => Promise<[Feature]>;
  update[Feature]: (id: number, input: Update[Feature]Input) => Promise<[Feature]>;
  delete[Feature]: (id: number) => Promise<void>;
  clearError: () => void;
};

export function use[Feature]Mutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreate[Feature] = useCallback(async (input: [Feature]FormData): Promise<[Feature]> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const [feature] = await create[Feature](input);
      setState(prev => ({ ...prev, isCreating: false }));
      return [feature];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create [feature]';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdate[Feature] = useCallback(async (id: number, input: Update[Feature]Input): Promise<[Feature]> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const [feature] = await update[Feature](id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return [feature];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update [feature]';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDelete[Feature] = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await delete[Feature](id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete [feature]';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    create[Feature]: handleCreate[Feature],
    update[Feature]: handleUpdate[Feature],
    delete[Feature]: handleDelete[Feature],
    clearError,
  };
}
```

### **Filters Hook**: `src/hooks/use[Feature]Filters.ts`

```typescript
import { useCallback, useState } from 'react';

type [Feature]FiltersReturn = [Feature]Filters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: [Feature]Filters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: [Feature]Filters['sortOrder']) => void;
  resetFilters: () => void;
};

const DEFAULT_FILTERS: [Feature]Filters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function use[Feature]Filters(initialFilters?: Partial<[Feature]Filters>): [Feature]FiltersReturn {
  const [filters, setFilters] = useState<[Feature]Filters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: [Feature]Filters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: [Feature]Filters['sortOrder']) => {
    setFilters(prev => ({ ...prev, sortOrder }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    ...filters,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    resetFilters,
  };
}
```

**Key Patterns:**
- Separate hooks for different concerns
- Use primitive values trong useCallback dependencies
- Consistent error handling patterns
- State management với loading states
- Optimistic updates where appropriate

## 🎨 **8. REACT COMPONENTS LAYER**

### **Form Component**: `src/features/[feature]/[Feature]Form.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { use[Feature]Mutations } from '@/hooks/use[Feature]Mutations';

type [Feature]FormProps = {
  mode: 'create' | 'edit';
  [feature]?: [Feature];
  onSuccess: () => void;
};

export function [Feature]Form({ mode, [feature], onSuccess }: [Feature]FormProps): JSX.Element {
  const t = useTranslations();
  const { create[Feature], update[Feature], isCreating, isUpdating, error } = use[Feature]Mutations();

  if (mode === 'edit' && ![feature]) {
    throw new Error('[Feature] is required for edit mode');
  }

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    setValue,
  } = useForm<[Feature]FormData>({
    defaultValues: {
      title: '',
      message: '',
    },
  });

  // Set form values for edit mode
  useEffect(() => {
    if (mode === 'edit' && [feature]) {
      setValue('title', [feature].title);
      setValue('message', [feature].message);
    }
  }, [mode, [feature], setValue]);

  const onSubmit = async (data: [Feature]FormData) => {
    try {
      if (mode === 'create') {
        await create[Feature](data);
        reset();
      } else if (mode === 'edit' && [feature]) {
        await update[Feature]([feature].id, data);
      }
      onSuccess();
    } catch {
      // Error is handled by the hook
    }
  };

  const isLoading = isCreating || isUpdating || isSubmitting;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {mode === 'create' ? t('[feature].create') : t('[feature].edit')}
      </h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{t('error.create[Feature]')}</p>
          <p className="mt-1 text-sm text-red-500">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">{t('[feature].form.title')}</Label>
          <Controller
            name="title"
            control={control}
            rules={{ required: 'Title is required' }}
            render={({ field, fieldState }) => (
              <div>
                <Input
                  {...field}
                  id="title"
                  type="text"
                  required
                  className={fieldState.error ? 'border-red-500' : ''}
                />
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">{t('[feature].form.message')}</Label>
          <Controller
            name="message"
            control={control}
            rules={{ required: 'Message is required' }}
            render={({ field, fieldState }) => (
              <div>
                <textarea
                  {...field}
                  id="message"
                  required
                  className={`w-full rounded-md border px-3 py-2 ${
                    fieldState.error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={4}
                />
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? (mode === 'create' ? t('[feature].form.creating') : t('[feature].form.updating'))
            : (mode === 'create' ? t('[feature].form.create') : t('[feature].form.update'))}
        </Button>
      </form>
    </div>
  );
}
```

### **List Component**: `src/features/[feature]/[Feature]List.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { use[Feature]Filters } from '@/hooks/use[Feature]Filters';
import { use[Feature]Mutations } from '@/hooks/use[Feature]Mutations';
import { use[Feature]s } from '@/hooks/use[Feature]s';

export function [Feature]List({
  onEdit,
  onDelete,
}: {
  onEdit?: ([feature]: [Feature]) => void;
  onDelete?: (id: number) => void;
} = {}): JSX.Element {
  const t = useTranslations();
  const { delete[Feature] } = use[Feature]Mutations();
  const {
    search,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleSortChange,
    resetFilters,
  } = use[Feature]Filters();

  const { [feature]s, pagination, isLoading, error, refresh } = use[Feature]s({
    page: 1,
    limit: 10,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const handleDelete = async (id: number) => {
    try {
      await delete[Feature](id);
      refresh();
      if (onDelete) {
        onDelete(id);
      }
    } catch {
      // Error is handled by the hook
    }
  };

  if (isLoading) {
    return <[Feature]ListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">{t('error.fetch[Feature]s')}</p>
        <p className="mt-1 text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          type="search"
          placeholder={t('[feature].searchPlaceholder')}
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="flex-1"
        />

        <select
          value={sortBy}
          onChange={e => handleSortChange(e.target.value as any)}
          className="rounded-md border bg-background px-3 py-2"
        >
          <option value="createdAt">{t('[feature].sort.createdAt')}</option>
          <option value="updatedAt">{t('[feature].sort.updatedAt')}</option>
          <option value="title">{t('[feature].sort.title')}</option>
        </select>

        {(search || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
          <Button variant="outline" onClick={resetFilters}>
            {t('[feature].resetFilters')}
          </Button>
        )}
      </div>

      {/* [Feature] List */}
      {[feature]s.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">{t('[feature].no[Feature]s')}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {[feature]s.map([feature] => (
            <li key={[feature].id} className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold">{[feature].title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{[feature].message}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date([feature].createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit([feature])}>
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete([feature].id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <div className="mt-6 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">
            {t('pagination.page')} {pagination.page}
          </span>
        </div>
      )}
    </div>
  );
}
```

### **Page Component**: `src/app/[locale]/(auth)/dashboard/[features]/page.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { [Feature]Form } from '@/features/[feature]/[Feature]Form';
import { [Feature]List } from '@/features/[feature]/[Feature]List';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  [feature]?: [Feature];
};

export default function [Feature]sPage(): JSX.Element {
  const t = useTranslations();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate[Feature] = () => {
    setModal({ isOpen: true, mode: 'create' });
  };

  const handleEdit[Feature] = ([feature]: [Feature]) => {
    setModal({ isOpen: true, mode: 'edit', [feature] });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, mode: 'create' });
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('[feature].pageTitle', { default: '[Feature]s' })}
          </h1>
          <p className="text-muted-foreground">
            {t('[feature].pageDescription', { default: 'Manage your [feature]s' })}
          </p>
        </div>

        <Button onClick={handleCreate[Feature]}>
          {t('[feature].createNew', { default: 'Create [Feature]' })}
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <[Feature]List
          key={refreshKey}
          onEdit={handleEdit[Feature]}
          onDelete={handleSuccess}
        />
      </div>

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {modal.mode === 'create' ? 'Create [Feature]' : 'Edit [Feature]'}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                ✕
              </Button>
            </div>

            <[Feature]Form
              mode={modal.mode}
              [feature]={modal.[feature]}
              onSuccess={() => {
                handleSuccess();
                handleCloseModal();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Key Patterns:**
- Use React Hook Form cho form handling
- Implement loading and error states
- Modal pattern cho create/edit forms
- Internationalization support
- Refresh mechanism sau mutations

## 🎯 **9. KEY IMPLEMENTATION PRINCIPLES**

### **🔐 Security & Authentication**
- Always check `userId` trong API routes
- Use `orgId || userId` cho multi-tenancy
- Implement ownership checks trong all CRUD operations
- Never expose `ownerId` từ client (server assigns)

### **✅ Type Safety**
- Use Drizzle's `$inferSelect` và `$inferInsert`
- Separate server (`TodoDb`) và client (`Todo`) types
- Validate all inputs với Zod schemas
- Type all API responses consistently

### **🚀 Performance**
- Use `Promise.all` cho parallel database queries
- Implement proper pagination
- Use `useCallback` correctly với primitive dependencies
- Optimize database queries với proper indexing

### **🛡️ Error Handling**
- Consistent error response format
- ZodError handling riêng biệt
- User-friendly error messages
- Proper HTTP status codes

### **🌍 Multi-tenancy**
- Support both personal (`userId`) và organization (`orgId`) ownership
- Filter all queries by `ownerId`
- Validate ownership trong all mutations

### **🔄 State Management**
- Separate hooks cho different concerns
- Use loading states appropriately
- Implement refresh mechanisms
- Handle optimistic updates carefully

## 📝 **10. CHECKLIST WHEN IMPLEMENTING NEW FEATURE**

### **✅ Database Layer**
- [ ] Create schema với `ownerId`, `createdAt`, `updatedAt`
- [ ] Add proper indexes
- [ ] Run migration

### **✅ Types Layer**
- [ ] Create types file với `Db` và client types
- [ ] Define input/output types
- [ ] Create API response types

### **✅ Validation Layer**
- [ ] Create Zod schemas cho all inputs
- [ ] Handle `null`/`undefined` values properly
- [ ] Create validation helper functions

### **✅ Database Queries Layer**
- [ ] Implement CRUD operations với ownership checks
- [ ] Add pagination và search functionality
- [ ] Handle errors properly

### **✅ API Routes Layer**
- [ ] Implement main route (GET list, POST create)
- [ ] Implement individual route (GET, PUT, DELETE by ID)
- [ ] Add proper authentication và validation
- [ ] Handle errors consistently

### **✅ API Client Layer**
- [ ] Create client functions cho all operations
- [ ] Handle errors properly
- [ ] Type all responses

### **✅ Hooks Layer**
- [ ] Create data fetching hook
- [ ] Create mutations hook
- [ ] Create filters hook
- [ ] Handle loading states

### **✅ Components Layer**
- [ ] Create form component
- [ ] Create list component
- [ ] Create page component
- [ ] Add internationalization

### **✅ Testing**
- [ ] Write unit tests cho hooks
- [ ] Write integration tests cho API routes
- [ ] Write component tests
- [ ] Test error scenarios

## 🚀 **CONCLUSION**

This pattern provides a robust, scalable, và maintainable foundation cho implementing CRUD features trong Yamato-SaaS. By following this pattern, bạn đảm bảo:

- **Type Safety** throughout the entire stack
- **Multi-tenancy** support out of the box
- **Consistent error handling** and user experience
- **Scalable architecture** that's easy to maintain
- **Security** với proper authentication và ownership checks

Use this pattern làm template cho all new features, adapting field names và business logic as needed.
