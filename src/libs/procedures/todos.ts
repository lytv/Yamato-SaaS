/**
 * Todo Stored Procedure Wrappers
 * Following TDD approach - REFACTOR phase implementation
 * Provides type-safe wrappers around PostgreSQL stored procedures
 * with validation and error handling
 */

import { sql } from 'drizzle-orm';

import { db } from '@/libs/DB';
import {
  validateStoredProcedurePaginated,
  validateStoredProcedureStats,
  validateStoredProcedureTodo,
} from '@/libs/validations/stored-procedures';
import type { Todo, TodoStats } from '@/types/todo';

// Types for function parameters
export type CreateTodoData = {
  ownerId: string;
  title: string;
  message: string;
};

export type UpdateTodoData = {
  title?: string;
  message?: string;
};

export type PaginatedTodosParams = {
  ownerId: string;
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export type PaginatedTodosResult = {
  todos: Todo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

// Helper function to safely cast database results
function castToArray(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) {
    return result;
  }
  // Handle Drizzle result types
  if (result && typeof result === 'object' && 'rows' in result) {
    return (result as any).rows || [];
  }
  return [];
}

// Type-safe property access
function getProperty(obj: Record<string, unknown>, key: string): unknown {
  return obj?.[key];
}

// Transform functions
function transformTodoFromDb(dbTodo: Record<string, unknown>): Todo {
  return {
    id: dbTodo.id as number,
    ownerId: dbTodo.owner_id as string,
    title: dbTodo.title as string,
    message: dbTodo.message as string,
    createdAt: dbTodo.created_at as Date,
    updatedAt: dbTodo.updated_at as Date,
  };
}

function transformStatsFromDb(dbStats: Record<string, unknown>): TodoStats {
  return {
    total: dbStats.total as number,
    today: dbStats.today as number,
    thisWeek: dbStats.this_week as number,
    thisMonth: dbStats.this_month as number,
  };
}

// Wrapper functions
export async function callGetTodoById(todoId: number, ownerId: string): Promise<Todo | null> {
  const result = await db.execute(sql`
    SELECT * FROM get_todo_by_id(${todoId}, ${ownerId})
  `);

  const resultArray = castToArray(result);
  if (!result || resultArray.length === 0) {
    return null;
  }

  const validatedRow = validateStoredProcedureTodo(resultArray[0]);
  return transformTodoFromDb(validatedRow);
}

export async function callCreateTodo(data: CreateTodoData): Promise<Todo> {
  const result = await db.execute(sql`
    SELECT * FROM create_todo(${data.ownerId}, ${data.title}, ${data.message})
  `);

  const resultArray = castToArray(result);
  if (!result || resultArray.length === 0) {
    throw new Error('Failed to create todo');
  }

  const validatedRow = validateStoredProcedureTodo(resultArray[0]);
  return transformTodoFromDb(validatedRow);
}

export async function callUpdateTodo(todoId: number, ownerId: string, data: UpdateTodoData): Promise<Todo> {
  const result = await db.execute(sql`
    SELECT * FROM update_todo(${todoId}, ${ownerId}, ${data.title || null}, ${data.message || null})
  `);

  const resultArray = castToArray(result);
  if (!result || resultArray.length === 0) {
    throw new Error('Todo not found or access denied');
  }

  const validatedRow = validateStoredProcedureTodo(resultArray[0]);
  return transformTodoFromDb(validatedRow);
}

export async function callDeleteTodo(todoId: number, ownerId: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT delete_todo(${todoId}, ${ownerId}) as success
  `);

  const resultArray = castToArray(result);
  const success = getProperty(resultArray[0] || {}, 'success');
  return Boolean(success);
}

export async function callGetTodoStats(ownerId: string): Promise<TodoStats> {
  const result = await db.execute(sql`
    SELECT * FROM get_todo_stats(${ownerId})
  `);

  if (!result || castToArray(result).length === 0) {
    return {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    };
  }

  const validatedRow = validateStoredProcedureStats(castToArray(result)[0]);
  return transformStatsFromDb(validatedRow);
}

export async function callGetPaginatedTodos(params: PaginatedTodosParams): Promise<PaginatedTodosResult> {
  const result = await db.execute(sql`
    SELECT * FROM get_paginated_todos(
      ${params.ownerId}, 
      ${params.page}, 
      ${params.limit}, 
      ${params.search}, 
      ${params.sortBy}, 
      ${params.sortOrder}
    )
  `);

  if (!result || castToArray(result).length === 0) {
    return {
      todos: [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: 0,
        hasMore: false,
      },
    };
  }

  const todos = castToArray(result).map((row) => {
    const validatedRow = validateStoredProcedurePaginated(row);
    return transformTodoFromDb(validatedRow);
  });

  const firstRow = castToArray(result)[0] || {};
  const totalCount = Number(getProperty(firstRow, 'total_count')) || 0;

  return {
    todos,
    pagination: {
      page: params.page,
      limit: params.limit,
      total: totalCount,
      hasMore: (params.page * params.limit) < totalCount,
    },
  };
}

export async function callGetTodosCount(ownerId: string, search?: string): Promise<number> {
  const result = await db.execute(sql`
    SELECT get_todos_count(${ownerId}, ${search || null}) as count
  `);

  const resultArray = castToArray(result);
  const count = getProperty(resultArray[0] || {}, 'count');
  return Number(count) || 0;
}

export async function callTodoExists(todoId: number, ownerId: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT todo_exists(${todoId}, ${ownerId}) as exists
  `);

  const resultArray = castToArray(result);
  const exists = getProperty(resultArray[0] || {}, 'exists');
  return Boolean(exists);
}
