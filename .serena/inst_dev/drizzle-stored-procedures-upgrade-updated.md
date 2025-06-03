# Plan: Nâng cấp API Todos với Drizzle Stored Procedures (UPDATED FINAL)

## Audit Findings - Issues Fixed + New Additions

After reviewing the actual codebase and plan analysis, added critical missing sections:

### ✅ New Additions to Plan:
1. **Type Safety Validation** - Zod schemas for stored procedure results
2. **Detailed Testing Strategy** - TDD-compliant test scenarios
3. **Migration Scripts** - Drizzle-specific migration commands
4. **Rollback Procedures** - Complete rollback strategy
5. **Performance Monitoring** - Metrics and alerts setup
6. **Error Handling Precision** - Exact error message preservation
7. **Database Permissions** - Security validation
8. **Load Testing** - Performance validation

## Current Implementation Analysis (Verified)

### Database Schema (Actual):
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

### Current Functions (All 8 functions verified):
- `getPaginatedTodos(params)` 
- `createTodo(data)`
- `getTodoById(id, ownerId)`
- `updateTodo(id, ownerId, data)` ⚠️ **Special merge logic**
- `deleteTodo(id, ownerId)` 
- `getTodoStats(ownerId)`
- `getTodosByOwner(params)` - Internal use
- `getTodosCount(ownerId, search)` - Internal use
- `todoExists(id, ownerId)` - Utility function

### Critical Logic to Preserve:
```typescript
// UpdateTodo merge logic - MUST preserve exactly
const [updatedTodo] = await db.update(todoSchema).set({
  title: data.title ?? existingTodo.title,        // ⚠️ CRITICAL
  message: data.message ?? existingTodo.message,  // ⚠️ CRITICAL
  updatedAt: new Date(),
})
```

## Phase 1: Create Database Stored Procedures + Type Safety

### 1.1 Create Type Validation Schemas
**File: `src/libs/validations/stored-procedures.ts`**

```typescript
import { z } from 'zod';

// Stored procedure result validation schemas
export const StoredProcedureTodoSchema = z.object({
  id: z.number().int().positive(),
  owner_id: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  created_at: z.date(),
  updated_at: z.date(),
});

export const StoredProcedureStatsSchema = z.object({
  total: z.number().int().min(0),
  today: z.number().int().min(0),
  this_week: z.number().int().min(0),
  this_month: z.number().int().min(0),
});

export const StoredProcedurePaginatedSchema = z.object({
  id: z.number().int().positive(),
  owner_id: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  created_at: z.date(),
  updated_at: z.date(),
  total_count: z.number().int().min(0),
});

// Validation helper functions
export function validateStoredProcedureTodo(row: unknown): z.infer<typeof StoredProcedureTodoSchema> {
  return StoredProcedureTodoSchema.parse(row);
}

export function validateStoredProcedureStats(row: unknown): z.infer<typeof StoredProcedureStatsSchema> {
  return StoredProcedureStatsSchema.parse(row);
}

export function validateStoredProcedurePaginated(row: unknown): z.infer<typeof StoredProcedurePaginatedSchema> {
  return StoredProcedurePaginatedSchema.parse(row);
}
```

### 1.2 Database Migration Script
**File: `migrations/YYYY-MM-DD-create-todo-stored-procedures.sql`**

```sql
-- Create stored procedures for Todo CRUD operations
-- Version: 1.0.0
-- Date: $(date)

-- 1. Get todo by ID with ownership check
CREATE OR REPLACE FUNCTION get_todo_by_id(p_todo_id INTEGER, p_owner_id TEXT)
RETURNS TABLE(
  id INTEGER,
  owner_id TEXT,
  title TEXT,
  message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.owner_id, t.title, t.message, t.created_at, t.updated_at
  FROM todo t
  WHERE t.id = p_todo_id AND t.owner_id = p_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get todos count with search
CREATE OR REPLACE FUNCTION get_todos_count(p_owner_id TEXT, p_search TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  result_count INTEGER;
BEGIN
  IF p_search IS NULL OR p_search = '' THEN
    SELECT COUNT(*) INTO result_count
    FROM todo t
    WHERE t.owner_id = p_owner_id;
  ELSE
    SELECT COUNT(*) INTO result_count
    FROM todo t
    WHERE t.owner_id = p_owner_id
    AND (t.title ILIKE '%' || p_search || '%' OR t.message ILIKE '%' || p_search || '%');
  END IF;
  
  RETURN COALESCE(result_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get paginated todos
CREATE OR REPLACE FUNCTION get_paginated_todos(
  p_owner_id TEXT, 
  p_page INTEGER, 
  p_limit INTEGER, 
  p_search TEXT, 
  p_sort_by TEXT, 
  p_sort_order TEXT
)
RETURNS TABLE(
  id INTEGER,
  owner_id TEXT,
  title TEXT,
  message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  total_count BIGINT
) AS $$
DECLARE
  offset_val INTEGER;
  sort_column TEXT;
  order_direction TEXT;
  total_records BIGINT;
BEGIN
  offset_val := (p_page - 1) * p_limit;
  sort_column := COALESCE(p_sort_by, 'created_at');
  order_direction := COALESCE(p_sort_order, 'desc');
  
  -- Get total count first
  SELECT get_todos_count(p_owner_id, p_search) INTO total_records;
  
  -- Return paginated results with total count
  RETURN QUERY
  EXECUTE format('
    SELECT t.id, t.owner_id, t.title, t.message, t.created_at, t.updated_at, %L::BIGINT as total_count
    FROM todo t
    WHERE t.owner_id = %L
    %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L',
    total_records,
    p_owner_id,
    CASE 
      WHEN p_search IS NOT NULL AND p_search != '' THEN
        format('AND (t.title ILIKE %L OR t.message ILIKE %L)', 
               '%' || p_search || '%', '%' || p_search || '%')
      ELSE ''
    END,
    sort_column,
    order_direction,
    p_limit,
    offset_val
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create todo
CREATE OR REPLACE FUNCTION create_todo(p_owner_id TEXT, p_title TEXT, p_message TEXT)
RETURNS TABLE(
  id INTEGER,
  owner_id TEXT,
  title TEXT,
  message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
DECLARE
  new_todo_id INTEGER;
BEGIN
  INSERT INTO todo (owner_id, title, message)
  VALUES (p_owner_id, p_title, p_message)
  RETURNING todo.id INTO new_todo_id;
  
  IF new_todo_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create todo';
  END IF;
  
  RETURN QUERY
  SELECT t.id, t.owner_id, t.title, t.message, t.created_at, t.updated_at
  FROM todo t
  WHERE t.id = new_todo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update todo with merge logic
CREATE OR REPLACE FUNCTION update_todo(
  p_todo_id INTEGER, 
  p_owner_id TEXT, 
  p_title TEXT, 
  p_message TEXT
)
RETURNS TABLE(
  id INTEGER,
  owner_id TEXT,
  title TEXT,
  message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
DECLARE
  existing_todo RECORD;
  final_title TEXT;
  final_message TEXT;
BEGIN
  -- Check if todo exists and get current values
  SELECT t.title, t.message INTO existing_todo
  FROM todo t
  WHERE t.id = p_todo_id AND t.owner_id = p_owner_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Todo not found or access denied';
  END IF;
  
  -- Apply merge logic (preserve existing if new value is NULL)
  final_title := COALESCE(p_title, existing_todo.title);
  final_message := COALESCE(p_message, existing_todo.message);
  
  -- Update the todo
  UPDATE todo 
  SET 
    title = final_title,
    message = final_message,
    updated_at = NOW()
  WHERE todo.id = p_todo_id AND todo.owner_id = p_owner_id;
  
  -- Return updated todo
  RETURN QUERY
  SELECT t.id, t.owner_id, t.title, t.message, t.created_at, t.updated_at
  FROM todo t
  WHERE t.id = p_todo_id AND t.owner_id = p_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Delete todo
CREATE OR REPLACE FUNCTION delete_todo(p_todo_id INTEGER, p_owner_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Check if todo exists first
  IF NOT EXISTS (SELECT 1 FROM todo WHERE id = p_todo_id AND owner_id = p_owner_id) THEN
    RAISE EXCEPTION 'Todo not found or access denied';
  END IF;
  
  -- Delete the todo
  DELETE FROM todo 
  WHERE id = p_todo_id AND owner_id = p_owner_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Get todo statistics
CREATE OR REPLACE FUNCTION get_todo_stats(p_owner_id TEXT)
RETURNS TABLE(
  total INTEGER,
  today INTEGER,
  this_week INTEGER,
  this_month INTEGER
) AS $$
DECLARE
  today_start TIMESTAMP;
  week_start TIMESTAMP;
  month_start TIMESTAMP;
BEGIN
  today_start := DATE_TRUNC('day', NOW());
  week_start := DATE_TRUNC('week', NOW());
  month_start := DATE_TRUNC('month', NOW());
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM todo WHERE owner_id = p_owner_id) as total,
    (SELECT COUNT(*)::INTEGER FROM todo WHERE owner_id = p_owner_id AND created_at >= today_start) as today,
    (SELECT COUNT(*)::INTEGER FROM todo WHERE owner_id = p_owner_id AND created_at >= week_start) as this_week,
    (SELECT COUNT(*)::INTEGER FROM todo WHERE owner_id = p_owner_id AND created_at >= month_start) as this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Check if todo exists
CREATE OR REPLACE FUNCTION todo_exists(p_todo_id INTEGER, p_owner_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM todo 
    WHERE id = p_todo_id AND owner_id = p_owner_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_todo_owner_id ON todo(owner_id);
CREATE INDEX IF NOT EXISTS idx_todo_created_at ON todo(created_at);
CREATE INDEX IF NOT EXISTS idx_todo_title_search ON todo USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_todo_message_search ON todo USING gin(to_tsvector('english', message));

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_todo_by_id(INTEGER, TEXT) TO your_app_user;
GRANT EXECUTE ON FUNCTION get_todos_count(TEXT, TEXT) TO your_app_user;
GRANT EXECUTE ON FUNCTION get_paginated_todos(TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT) TO your_app_user;
GRANT EXECUTE ON FUNCTION create_todo(TEXT, TEXT, TEXT) TO your_app_user;
GRANT EXECUTE ON FUNCTION update_todo(INTEGER, TEXT, TEXT, TEXT) TO your_app_user;
GRANT EXECUTE ON FUNCTION delete_todo(INTEGER, TEXT) TO your_app_user;
GRANT EXECUTE ON FUNCTION get_todo_stats(TEXT) TO your_app_user;
GRANT EXECUTE ON FUNCTION todo_exists(INTEGER, TEXT) TO your_app_user;
```

## Phase 2: Create Drizzle Wrapper Functions (UPDATED)

**File: `src/libs/procedures/todos.ts`**

```typescript
import { sql } from 'drizzle-orm';
import { db } from '@/libs/DB';
import type { TodoDb, TodoListParams, CreateTodoInput, UpdateTodoInput, TodoStats } from '@/types/todo';
import { 
  validateStoredProcedureTodo, 
  validateStoredProcedureStats,
  validateStoredProcedurePaginated 
} from '@/libs/validations/stored-procedures';

// Error wrapper for consistent error handling
function wrapStoredProcedureError(error: unknown, operation: string): never {
  console.error(`Stored procedure error in ${operation}:`, error);
  if (error instanceof Error && error.message.includes('not found or access denied')) {
    throw new Error('Todo not found or access denied');
  }
  if (error instanceof Error && error.message.includes('Failed to create')) {
    throw new Error('Failed to create todo');
  }
  if (error instanceof Error && error.message.includes('Failed to update')) {
    throw new Error('Failed to update todo');
  }
  throw error;
}

export async function callGetTodoById(id: number, ownerId: string): Promise<TodoDb | null> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM get_todo_by_id(${id}, ${ownerId})
    `);
    const rows = result as any[];
    
    if (rows.length === 0) return null;
    
    const validatedRow = validateStoredProcedureTodo(rows[0]);
    return transformTodoRow(validatedRow);
  } catch (error) {
    wrapStoredProcedureError(error, 'getTodoById');
  }
}

export async function callGetTodosCount(ownerId: string, search?: string): Promise<number> {
  try {
    const result = await db.execute(sql`
      SELECT get_todos_count(${ownerId}, ${search || null}) as count
    `);
    return (result as any[])[0]?.count || 0;
  } catch (error) {
    wrapStoredProcedureError(error, 'getTodosCount');
  }
}

export async function callGetPaginatedTodos(params: TodoListParams): Promise<{
  todos: TodoDb[];
  pagination: { page: number; limit: number; total: number; hasMore: boolean; };
}> {
  try {
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
    
    const rows = result as any[];
    const validatedRows = rows.map(row => validateStoredProcedurePaginated(row));
    
    return transformPaginatedResult(validatedRows, params);
  } catch (error) {
    wrapStoredProcedureError(error, 'getPaginatedTodos');
  }
}

export async function callCreateTodo(data: CreateTodoInput): Promise<TodoDb> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM create_todo(${data.ownerId}, ${data.title}, ${data.message})
    `);
    
    const rows = result as any[];
    if (rows.length === 0) {
      throw new Error('Failed to create todo');
    }
    
    const validatedRow = validateStoredProcedureTodo(rows[0]);
    return transformTodoRow(validatedRow);
  } catch (error) {
    wrapStoredProcedureError(error, 'createTodo');
  }
}

export async function callUpdateTodo(id: number, ownerId: string, data: UpdateTodoInput): Promise<TodoDb> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM update_todo(${id}, ${ownerId}, ${data.title || null}, ${data.message || null})
    `);
    
    const rows = result as any[];
    if (rows.length === 0) {
      throw new Error('Todo not found or access denied');
    }
    
    const validatedRow = validateStoredProcedureTodo(rows[0]);
    return transformTodoRow(validatedRow);
  } catch (error) {
    wrapStoredProcedureError(error, 'updateTodo');
  }
}

export async function callDeleteTodo(id: number, ownerId: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT delete_todo(${id}, ${ownerId}) as success
    `);
    return (result as any[])[0]?.success || false;
  } catch (error) {
    wrapStoredProcedureError(error, 'deleteTodo');
  }
}

export async function callGetTodoStats(ownerId: string): Promise<TodoStats> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM get_todo_stats(${ownerId})
    `);
    
    const rows = result as any[];
    if (rows.length === 0) {
      return { total: 0, today: 0, thisWeek: 0, thisMonth: 0 };
    }
    
    const validatedStats = validateStoredProcedureStats(rows[0]);
    return {
      total: validatedStats.total,
      today: validatedStats.today,
      thisWeek: validatedStats.this_week,
      thisMonth: validatedStats.this_month,
    };
  } catch (error) {
    wrapStoredProcedureError(error, 'getTodoStats');
  }
}

export async function callTodoExists(id: number, ownerId: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT todo_exists(${id}, ${ownerId}) as exists
    `);
    return (result as any[])[0]?.exists || false;
  } catch (error) {
    wrapStoredProcedureError(error, 'todoExists');
  }
}

// Helper functions
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

function transformPaginatedResult(rows: any[], params: TodoListParams): {
  todos: TodoDb[];
  pagination: { page: number; limit: number; total: number; hasMore: boolean; };
} {
  const todos = rows.map(row => transformTodoRow(row));
  const total = rows.length > 0 ? rows[0].total_count : 0;
  const hasMore = params.page * params.limit < total;
  
  return {
    todos,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      hasMore,
    },
  };
}
```

## Phase 3: Comprehensive Testing Strategy (TDD Compliant)

### 3.1 Test Structure
**File: `tests/libs/procedures/todos.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/libs/DB';
import {
  callGetTodoById,
  callCreateTodo,
  callUpdateTodo,
  callDeleteTodo,
  callGetTodoStats,
  callTodoExists,
  callGetPaginatedTodos,
} from '@/libs/procedures/todos';

describe('Todo Stored Procedures', () => {
  const mockOwnerId = 'test-user-123';
  const mockOrgId = 'test-org-456';
  
  beforeEach(async () => {
    // Setup test data
    await cleanupTestData();
  });
  
  afterEach(async () => {
    // Cleanup test data
    await cleanupTestData();
  });
  
  describe('callCreateTodo', () => {
    it('should create todo with valid data', async () => {
      const todoData = {
        ownerId: mockOwnerId,
        title: 'Test Todo',
        message: 'Test Message',
      };
      
      const result = await callCreateTodo(todoData);
      
      expect(result).toMatchObject({
        id: expect.any(Number),
        ownerId: mockOwnerId,
        title: 'Test Todo',
        message: 'Test Message',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
    
    it('should throw error for empty title', async () => {
      const todoData = {
        ownerId: mockOwnerId,
        title: '',
        message: 'Test Message',
      };
      
      await expect(callCreateTodo(todoData)).rejects.toThrow();
    });
  });
  
  describe('callUpdateTodo', () => {
    it('should update only title when message is undefined', async () => {
      // Create initial todo
      const initial = await callCreateTodo({
        ownerId: mockOwnerId,
        title: 'Original Title',
        message: 'Original Message',
      });
      
      // Update only title
      const updated = await callUpdateTodo(initial.id, mockOwnerId, {
        title: 'Updated Title',
        // message is undefined - should preserve original
      });
      
      expect(updated.title).toBe('Updated Title');
      expect(updated.message).toBe('Original Message'); // ⚠️ CRITICAL TEST
    });
    
    it('should update only message when title is undefined', async () => {
      // Create initial todo
      const initial = await callCreateTodo({
        ownerId: mockOwnerId,
        title: 'Original Title',
        message: 'Original Message',
      });
      
      // Update only message
      const updated = await callUpdateTodo(initial.id, mockOwnerId, {
        // title is undefined - should preserve original
        message: 'Updated Message',
      });
      
      expect(updated.title).toBe('Original Title'); // ⚠️ CRITICAL TEST
      expect(updated.message).toBe('Updated Message');
    });
    
    it('should throw "Todo not found or access denied" for wrong owner', async () => {
      const todo = await callCreateTodo({
        ownerId: mockOwnerId,
        title: 'Test',
        message: 'Test',
      });
      
      await expect(
        callUpdateTodo(todo.id, 'wrong-owner', { title: 'Updated' })
      ).rejects.toThrow('Todo not found or access denied');
    });
  });
  
  describe('callGetPaginatedTodos', () => {
    it('should return correct pagination with search', async () => {
      // Create test todos
      await callCreateTodo({ ownerId: mockOwnerId, title: 'Apple Todo', message: 'Fruit' });
      await callCreateTodo({ ownerId: mockOwnerId, title: 'Banana Todo', message: 'Yellow' });
      await callCreateTodo({ ownerId: mockOwnerId, title: 'Cherry Todo', message: 'Red' });
      
      const result = await callGetPaginatedTodos({
        ownerId: mockOwnerId,
        page: 1,
        limit: 2,
        search: 'Apple',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      expect(result.todos).toHaveLength(1);
      expect(result.todos[0].title).toBe('Apple Todo');
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('should maintain exact error messages from current implementation', async () => {
      // Test exact error message matching
      await expect(
        callUpdateTodo(999999, mockOwnerId, { title: 'Test' })
      ).rejects.toThrow('Todo not found or access denied');
      
      await expect(
        callDeleteTodo(999999, mockOwnerId)
      ).rejects.toThrow('Todo not found or access denied');
    });
  });
  
  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Create 1000 test todos
      const todos = Array.from({ length: 1000 }, (_, i) => ({
        ownerId: mockOwnerId,
        title: `Todo ${i}`,
        message: `Message ${i}`,
      }));
      
      const startTime = Date.now();
      
      // Test pagination performance
      const result = await callGetPaginatedTodos({
        ownerId: mockOwnerId,
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.todos).toHaveLength(50);
      expect(result.pagination.total).toBe(1000);
    });
  });
});

async function cleanupTestData() {
  await db.execute(sql`DELETE FROM todo WHERE owner_id LIKE 'test-%'`);
}
```

### 3.2 Integration Tests
**File: `tests/integration/api-stored-procedures.test.ts`**

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createTodos } from '../helpers/todo-helpers';

describe('API Integration with Stored Procedures', () => {
  beforeAll(() => {
    // Set feature flag for testing
    process.env.USE_STORED_PROCEDURES = 'true';
  });
  
  it('should handle complete CRUD workflow', async () => {
    // Test full CRUD cycle with stored procedures
    // POST -> GET -> PUT -> DELETE
  });
  
  it('should maintain API response format compatibility', async () => {
    // Ensure response format is identical to current implementation
  });
});
```

## Phase 4: Performance Monitoring Setup

### 4.1 Performance Metrics Collection
**File: `src/libs/monitoring/performance.ts`**

```typescript
import { performance } from 'perf_hooks';

interface PerformanceMetric {
  operation: string;
  executionTime: number;
  timestamp: Date;
  success: boolean;
  errorType?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  
  async measureOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    let success = true;
    let errorType: string | undefined;
    
    try {
      const result = await fn();
      return result;
    } catch (error) {
      success = false;
      errorType = error instanceof Error ? error.constructor.name : 'Unknown';
      throw error;
    } finally {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      this.metrics.push({
        operation,
        executionTime,
        timestamp: new Date(),
        success,
        errorType,
      });
      
      // Log slow operations
      if (executionTime > 1000) {
        console.warn(`Slow operation detected: ${operation} took ${executionTime}ms`);
      }
    }
  }
  
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  getAverageExecutionTime(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;
    
    const total = operationMetrics.reduce((sum, m) => sum + m.executionTime, 0);
    return total / operationMetrics.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Wrapper for monitoring stored procedures
export function withPerformanceMonitoring<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return performanceMonitor.measureOperation(operation, () => fn(...args));
  };
}
```

## Phase 5: Migration & Rollback Strategy

### 5.1 Drizzle Migration Commands
**File: `scripts/migrate-stored-procedures.sh`**

```bash
#!/bin/bash

# Stored Procedures Migration Script
# Usage: ./migrate-stored-procedures.sh [up|down]

set -e

ACTION=${1:-up}

case $ACTION in
  "up")
    echo "🚀 Applying stored procedures migration..."
    
    # Generate migration
    npm run db:generate
    
    # Apply migration
    npm run db:migrate
    
    # Verify migration
    npm run db:check
    
    echo "✅ Stored procedures migration completed"
    ;;
    
  "down")
    echo "🔄 Rolling back stored procedures migration..."
    
    # Apply rollback script
    psql $DATABASE_URL -f migrations/rollback-stored-procedures.sql
    
    echo "✅ Rollback completed"
    ;;
    
  *)
    echo "Usage: $0 [up|down]"
    exit 1
    ;;
esac
```

### 5.2 Rollback Script
**File: `migrations/rollback-stored-procedures.sql`**

```sql
-- Rollback script for stored procedures
-- This script removes all stored procedures and indexes created

-- Drop stored procedures
DROP FUNCTION IF EXISTS get_todo_by_id(INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_todos_count(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_paginated_todos(TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_todo(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_todo(INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS delete_todo(INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_todo_stats(TEXT);
DROP FUNCTION IF EXISTS todo_exists(INTEGER, TEXT);

-- Drop performance indexes (if they don't exist in original schema)
DROP INDEX IF EXISTS idx_todo_title_search;
DROP INDEX IF EXISTS idx_todo_message_search;

-- Note: Keep original indexes
-- idx_todo_owner_id and idx_todo_created_at may be needed by original implementation

COMMIT;

-- Log rollback
INSERT INTO migration_log (action, timestamp) VALUES ('stored_procedures_rollback', NOW());
```

## Phase 6: Updated Migration Timeline

### Week 1: Preparation & Database Layer
- [ ] **Day 1-2**: Create type validation schemas
- [ ] **Day 3-4**: Create stored procedures with exact error handling
- [ ] **Day 5**: Create performance monitoring setup
- [ ] **Day 6-7**: Database testing with unit tests

### Week 2: Application Layer & Testing
- [ ] **Day 1-2**: Create wrapper functions with validation
- [ ] **Day 3-4**: Update query layer with feature flags
- [ ] **Day 5**: Comprehensive testing (unit + integration)
- [ ] **Day 6-7**: Performance testing and optimization

### Week 3: Staging Deployment & Validation
- [ ] **Day 1**: Deploy stored procedures to staging
- [ ] **Day 2**: Test with `USE_STORED_PROCEDURES=false` (fallback mode)
- [ ] **Day 3**: Test with `USE_STORED_PROCEDURES=true` (stored procedures mode)
- [ ] **Day 4-5**: Load testing and performance comparison
- [ ] **Day 6-7**: Security audit and permission validation

### Week 4: Production Rollout
- [ ] **Day 1**: Deploy application code with `USE_STORED_PROCEDURES=false`
- [ ] **Day 2**: Monitor system stability for 24 hours
- [ ] **Day 3**: Deploy stored procedures to production
- [ ] **Day 4**: Gradually enable feature flag (25% traffic)
- [ ] **Day 5**: Scale to 75% traffic if metrics are good
- [ ] **Day 6-7**: Full rollout after validation

## Critical Success Metrics

### Performance Metrics:
- [ ] Average query time < 100ms for simple operations
- [ ] Pagination queries < 200ms for 10k+ records
- [ ] Error rate < 0.1%
- [ ] 99th percentile response time < 500ms

### Compatibility Metrics:
- [ ] 100% API response format compatibility
- [ ] 100% error message compatibility
- [ ] Zero breaking changes for frontend
- [ ] All existing tests pass

### Rollback Criteria:
- [ ] If error rate > 1%
- [ ] If average response time increases > 50%
- [ ] If any data inconsistency detected
- [ ] If critical functionality breaks

## Final Checklist

### Before Starting:
- [ ] Verify database permissions for stored procedures
- [ ] Backup production database
- [ ] Setup monitoring alerts
- [ ] Prepare rollback procedures

### During Implementation:
- [ ] Test each stored procedure individually
- [ ] Verify type safety with validation schemas
- [ ] Monitor performance metrics continuously
- [ ] Document any deviations from plan

### After Completion:
- [ ] Performance comparison report
- [ ] Documentation update
- [ ] Team training on new architecture
- [ ] Monitoring dashboard setup 