# Plan: Nâng cấp API Todos với Drizzle Stored Procedures (FINAL CORRECTED)

## Audit Findings - Issues Fixed

After reviewing the actual codebase, I identified several critical mapping issues that have been corrected:

### ❌ Issues Found in Previous Plan:
1. **TodoStats type mismatch** - Wrong property names
2. **Missing todoExists function** - Not covered in plan
3. **Incorrect stored procedure signatures** - Didn't match current implementation
4. **Database field mapping issues** - Snake_case vs camelCase
5. **API response format mismatch** - Plan didn't match current response structure

### ✅ Corrections Made:
1. **Matched TodoStats exactly** with current implementation
2. **Added todoExists stored procedure** to plan
3. **Fixed all function signatures** to match current code
4. **Corrected database field mapping** 
5. **Aligned response formats** with existing API contracts

## Current Implementation Analysis

### Current API Functions Used:
- `GET /api/todos` → `getPaginatedTodos(params)` 
- `POST /api/todos` → `createTodo(data)`
- `GET /api/todos/[id]` → `getTodoById(id, ownerId)`
- `PUT /api/todos/[id]` → `updateTodo(id, ownerId, data)`
- `DELETE /api/todos/[id]` → `deleteTodo(id, ownerId)` 
- `GET /api/todos/stats` → `getTodoStats(ownerId)`

### Additional Functions in Current Code:
- `getTodosByOwner(params)` - Used internally by getPaginatedTodos
- `getTodosCount(ownerId, search)` - Used internally by getPaginatedTodos  
- `todoExists(id, ownerId)` - Utility function

### Current Database Schema:
```sql
CREATE TABLE todo (
  id SERIAL PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL, 
  message TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Current Types (EXACT MATCH REQUIRED):
```typescript
export type TodoDb = {
  id: number;
  ownerId: string;
  title: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TodoStats = {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  completed?: number; // Optional, not implemented yet
};

export type TodoListParams = {
  search?: string;
  ownerId: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
};
```

## Corrected Plan Implementation

### Phase 1: Create Database Stored Procedures (CORRECTED)

**All stored procedures must match EXACTLY with current function signatures:**

1. **`get_todo_by_id(p_todo_id INTEGER, p_owner_id TEXT)`**
   ```sql
   RETURNS TABLE(
     id INTEGER,
     owner_id TEXT,
     title TEXT,
     message TEXT,
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   )
   ```

2. **`get_todos_count(p_owner_id TEXT, p_search TEXT DEFAULT NULL)`**
   ```sql
   RETURNS INTEGER
   ```

3. **`get_paginated_todos(p_owner_id TEXT, p_page INTEGER, p_limit INTEGER, p_search TEXT, p_sort_by TEXT, p_sort_order TEXT)`**
   ```sql
   RETURNS TABLE(
     id INTEGER,
     owner_id TEXT,
     title TEXT,
     message TEXT,
     created_at TIMESTAMP,
     updated_at TIMESTAMP,
     total_count BIGINT
   )
   ```

4. **`create_todo(p_owner_id TEXT, p_title TEXT, p_message TEXT)`**
   ```sql
   RETURNS TABLE(
     id INTEGER,
     owner_id TEXT,
     title TEXT,
     message TEXT,
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   )
   ```

5. **`update_todo(p_todo_id INTEGER, p_owner_id TEXT, p_title TEXT, p_message TEXT)`**
   ```sql
   RETURNS TABLE(
     id INTEGER,
     owner_id TEXT,
     title TEXT,
     message TEXT,
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   )
   ```

6. **`delete_todo(p_todo_id INTEGER, p_owner_id TEXT)`**
   ```sql
   RETURNS BOOLEAN
   ```

7. **`get_todo_stats(p_owner_id TEXT)`**
   ```sql
   RETURNS TABLE(
     total INTEGER,
     today INTEGER,
     this_week INTEGER,
     this_month INTEGER
   )
   ```

8. **`todo_exists(p_todo_id INTEGER, p_owner_id TEXT)`** ← NEW, missing in previous plan
   ```sql
   RETURNS BOOLEAN
   ```

### Phase 2: Create Drizzle Wrapper Functions (CORRECTED)

**File: `src/libs/procedures/todos.ts`**

```typescript
import { sql } from 'drizzle-orm';
import { db } from '@/libs/DB';
import type { TodoDb, TodoListParams, CreateTodoInput, UpdateTodoInput, TodoStats } from '@/types/todo';

// EXACT MATCH with current function signatures

export async function callGetTodoById(id: number, ownerId: string): Promise<TodoDb | null> {
  const result = await db.execute(sql`
    SELECT * FROM get_todo_by_id(${id}, ${ownerId})
  `);
  const rows = result as any[];
  return rows.length > 0 ? transformTodoRow(rows[0]) : null;
}

export async function callGetTodosCount(ownerId: string, search?: string): Promise<number> {
  const result = await db.execute(sql`
    SELECT get_todos_count(${ownerId}, ${search || null}) as count
  `);
  return (result as any[])[0]?.count || 0;
}

export async function callGetPaginatedTodos(params: TodoListParams): Promise<{
  todos: TodoDb[];
  pagination: { page: number; limit: number; total: number; hasMore: boolean; };
}> {
  const result = await db.execute(sql`
    SELECT * FROM get_paginated_todos(
      ${params.ownerId}, 
      ${params.page}, 
      ${params.limit}, 
      ${params.search || null}, 
      ${params.sortBy || 'createdAt'}, 
      ${params.sortOrder || 'desc'}
    )
  `);
  return transformPaginatedResult(result, params);
}

export async function callCreateTodo(data: CreateTodoInput): Promise<TodoDb> {
  const result = await db.execute(sql`
    SELECT * FROM create_todo(${data.ownerId}, ${data.title}, ${data.message})
  `);
  return transformTodoRow((result as any[])[0]);
}

export async function callUpdateTodo(id: number, ownerId: string, data: UpdateTodoInput): Promise<TodoDb> {
  const result = await db.execute(sql`
    SELECT * FROM update_todo(${id}, ${ownerId}, ${data.title}, ${data.message})
  `);
  const rows = result as any[];
  if (rows.length === 0) {
    throw new Error('Todo not found or access denied');
  }
  return transformTodoRow(rows[0]);
}

export async function callDeleteTodo(id: number, ownerId: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT delete_todo(${id}, ${ownerId}) as success
  `);
  return (result as any[])[0]?.success || false;
}

export async function callGetTodoStats(ownerId: string): Promise<TodoStats> {
  const result = await db.execute(sql`
    SELECT * FROM get_todo_stats(${ownerId})
  `);
  const rows = result as any[];
  if (rows.length === 0) {
    return { total: 0, today: 0, thisWeek: 0, thisMonth: 0 };
  }
  const stats = rows[0];
  return {
    total: stats.total,
    today: stats.today,
    thisWeek: stats.this_week,
    thisMonth: stats.this_month,
  };
}

export async function callTodoExists(id: number, ownerId: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT todo_exists(${id}, ${ownerId}) as exists
  `);
  return (result as any[])[0]?.exists || false;
}

// Helper function to transform database rows to TypeScript objects
function transformTodoRow(row: any): TodoDb {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

### Phase 3: Update Query Layer with Feature Flags (CORRECTED)

**File: `src/libs/queries/todo.ts` - Add feature flag support**

```typescript
// Import stored procedure wrappers
import {
  callGetTodoById,
  callGetTodosCount,
  callGetPaginatedTodos,
  callCreateTodo,
  callUpdateTodo,
  callDeleteTodo,
  callGetTodoStats,
  callTodoExists,
} from '@/libs/procedures/todos';

// Feature flag check
function useStoredProcedures(): boolean {
  return process.env.USE_STORED_PROCEDURES === 'true';
}

// Update each function to support feature flag
export async function getPaginatedTodos(params: TodoListParams): Promise<{
  todos: TodoDb[];
  pagination: { page: number; limit: number; total: number; hasMore: boolean; };
}> {
  if (useStoredProcedures()) {
    return await callGetPaginatedTodos(params);
  }
  
  // Original implementation (fallback)
  const [todos, total] = await Promise.all([
    getTodosByOwner(params),
    getTodosCount(params.ownerId, params.search),
  ]);

  const hasMore = params.page * params.limit < total;
  return { todos, pagination: { page: params.page, limit: params.limit, total, hasMore } };
}

export async function getTodoById(id: number, ownerId: string): Promise<TodoDb | null> {
  if (useStoredProcedures()) {
    return await callGetTodoById(id, ownerId);
  }
  
  // Original implementation (fallback)
  const [todo] = await db
    .select()
    .from(todoSchema)
    .where(and(eq(todoSchema.id, id), eq(todoSchema.ownerId, ownerId)))
    .limit(1);
  return todo ?? null;
}

export async function createTodo(data: CreateTodoInput): Promise<TodoDb> {
  if (useStoredProcedures()) {
    return await callCreateTodo(data);
  }
  
  // Original implementation (fallback)
  const [todo] = await db.insert(todoSchema).values(data).returning();
  if (!todo) throw new Error('Failed to create todo');
  return todo;
}

export async function updateTodo(id: number, ownerId: string, data: UpdateTodoInput): Promise<TodoDb> {
  if (useStoredProcedures()) {
    return await callUpdateTodo(id, ownerId, data);
  }
  
  // Original implementation (fallback)
  const existingTodo = await getTodoById(id, ownerId);
  if (!existingTodo) throw new Error('Todo not found or access denied');
  
  const [updatedTodo] = await db
    .update(todoSchema)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(todoSchema.id, id), eq(todoSchema.ownerId, ownerId)))
    .returning();
  
  if (!updatedTodo) throw new Error('Failed to update todo');
  return updatedTodo;
}

export async function deleteTodo(id: number, ownerId: string): Promise<boolean> {
  if (useStoredProcedures()) {
    return await callDeleteTodo(id, ownerId);
  }
  
  // Original implementation (fallback)
  const existingTodo = await getTodoById(id, ownerId);
  if (!existingTodo) throw new Error('Todo not found or access denied');
  
  await db.delete(todoSchema).where(and(eq(todoSchema.id, id), eq(todoSchema.ownerId, ownerId)));
  return true;
}

export async function getTodoStats(ownerId: string): Promise<TodoStats> {
  if (useStoredProcedures()) {
    return await callGetTodoStats(ownerId);
  }
  
  // Original implementation (fallback) - unchanged
  // ... existing implementation
}

export async function todoExists(id: number, ownerId: string): Promise<boolean> {
  if (useStoredProcedures()) {
    return await callTodoExists(id, ownerId);
  }
  
  // Original implementation (fallback)
  const todo = await getTodoById(id, ownerId);
  return todo !== null;
}

// Helper functions remain unchanged
export async function getTodosByOwner(params: TodoListParams): Promise<TodoDb[]> {
  // Original implementation - only used as fallback
}

export async function getTodosCount(ownerId: string, search?: string): Promise<number> {
  // Original implementation - only used as fallback  
}
```

### Phase 4: API Endpoints (NO CHANGES REQUIRED)

**IMPORTANT: API endpoints do NOT need changes** because we're updating the underlying query functions to support feature flags. The API routes will automatically use stored procedures when the feature flag is enabled.

All API routes remain exactly the same:
- `src/app/api/todos/route.ts` - NO CHANGES
- `src/app/api/todos/[id]/route.ts` - NO CHANGES  
- `src/app/api/todos/stats/route.ts` - NO CHANGES

### Phase 5: Environment Configuration

**Add to `.env`:**
```
# Feature flag for stored procedures
USE_STORED_PROCEDURES=false
```

**Add to `.env.production`:**
```
# Enable stored procedures in production after testing
USE_STORED_PROCEDURES=true
```

## Migration Strategy (CORRECTED)

### Week 1: Database Layer
1. Create all 8 stored procedures (including todoExists)
2. Create migration scripts  
3. Test each procedure individually
4. Create performance indexes

### Week 2: Application Layer  
1. Create wrapper functions with exact signatures
2. Update query layer with feature flags
3. Unit test all wrapper functions
4. Integration testing

### Week 3: Deployment & Testing
1. Deploy stored procedures to staging
2. Test with feature flag OFF (ensure no breaking changes)
3. Test with feature flag ON (verify stored procedures work)
4. Performance testing and comparison

### Week 4: Production Rollout
1. Deploy to production with feature flag OFF
2. Monitor system stability
3. Gradually enable feature flag
4. Monitor performance improvements
5. Full rollout after validation

## Critical Success Factors

1. **EXACT API Compatibility** - No changes to API contracts
2. **Type Safety** - All TypeScript types remain exactly the same
3. **Error Handling** - Same error messages and status codes
4. **Performance** - Measure before/after metrics
5. **Rollback Capability** - Feature flag allows instant rollback

## Next Steps

1. **Start with todoExists** - Simplest function to implement first
2. **Test thoroughly** - Each stored procedure individually
3. **Implement gradually** - One function at a time
4. **Monitor closely** - Track performance and errors
5. **Document everything** - For future maintenance