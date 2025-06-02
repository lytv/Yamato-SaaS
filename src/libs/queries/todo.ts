/**
 * Todo database queries using Drizzle ORM
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Supporting multi-tenancy (personal vs organization todos)
 */

import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { todoSchema } from '@/models/Schema';
import type {
  CreateTodoInput,
  TodoDb,
  TodoListParams,
  TodoStats,
  UpdateTodoInput,
} from '@/types/todo';

/**
 * Create a new todo
 * @param data - Todo creation data
 * @returns Promise resolving to created todo
 */
export async function createTodo(data: CreateTodoInput): Promise<TodoDb> {
  const [todo] = await db
    .insert(todoSchema)
    .values({
      ownerId: data.ownerId,
      title: data.title,
      message: data.message,
    })
    .returning();

  if (!todo) {
    throw new Error('Failed to create todo');
  }

  return todo;
}

/**
 * Get todos by owner with pagination and filtering
 * @param params - Query parameters including ownerId, pagination, and filters
 * @returns Promise resolving to array of todos
 */
export async function getTodosByOwner(params: TodoListParams): Promise<TodoDb[]> {
  const { ownerId, page, limit, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(todoSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(todoSchema.ownerId, ownerId),
      or(
        ilike(todoSchema.title, searchTerm),
        ilike(todoSchema.message, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Build sort order
  const sortColumn = todoSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute query with all conditions
  return await db
    .select()
    .from(todoSchema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get total count of todos for pagination
 * @param ownerId - Owner ID (userId or organizationId)
 * @param search - Optional search term
 * @returns Promise resolving to total count
 */
export async function getTodosCount(ownerId: string, search?: string): Promise<number> {
  // Build where conditions
  let whereConditions = eq(todoSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(todoSchema.ownerId, ownerId),
      or(
        ilike(todoSchema.title, searchTerm),
        ilike(todoSchema.message, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  const [result] = await db
    .select({ count: count() })
    .from(todoSchema)
    .where(whereConditions);

  return result?.count ?? 0;
}

/**
 * Get a single todo by ID with ownership check
 * @param id - Todo ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to todo or null if not found
 */
export async function getTodoById(id: number, ownerId: string): Promise<TodoDb | null> {
  const [todo] = await db
    .select()
    .from(todoSchema)
    .where(
      and(
        eq(todoSchema.id, id),
        eq(todoSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return todo ?? null;
}

/**
 * Update a todo with ownership check
 * @param id - Todo ID
 * @param ownerId - Owner ID for authorization
 * @param data - Update data
 * @returns Promise resolving to updated todo
 */
export async function updateTodo(
  id: number,
  ownerId: string,
  data: UpdateTodoInput,
): Promise<TodoDb> {
  // First check if todo exists and belongs to owner
  const existingTodo = await getTodoById(id, ownerId);
  if (!existingTodo) {
    throw new Error('Todo not found or access denied');
  }

  const [updatedTodo] = await db
    .update(todoSchema)
    .set({
      title: data.title ?? existingTodo.title,
      message: data.message ?? existingTodo.message,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(todoSchema.id, id),
        eq(todoSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedTodo) {
    throw new Error('Failed to update todo');
  }

  return updatedTodo;
}

/**
 * Delete a todo with ownership check
 * @param id - Todo ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteTodo(id: number, ownerId: string): Promise<boolean> {
  // First check if todo exists and belongs to owner
  const existingTodo = await getTodoById(id, ownerId);
  if (!existingTodo) {
    throw new Error('Todo not found or access denied');
  }

  await db
    .delete(todoSchema)
    .where(
      and(
        eq(todoSchema.id, id),
        eq(todoSchema.ownerId, ownerId),
      ),
    );

  // For delete operations, we assume success if no error was thrown
  return true;
}

/**
 * Get todo statistics for dashboard
 * @param ownerId - Owner ID (userId or organizationId)
 * @returns Promise resolving to todo statistics
 */
export async function getTodoStats(ownerId: string): Promise<TodoStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(todoSchema)
    .where(eq(todoSchema.ownerId, ownerId));

  // Get today's count
  const [todayResult] = await db
    .select({ count: count() })
    .from(todoSchema)
    .where(
      and(
        eq(todoSchema.ownerId, ownerId),
        gte(todoSchema.createdAt, today),
      ),
    );

  // Get this week's count
  const [weekResult] = await db
    .select({ count: count() })
    .from(todoSchema)
    .where(
      and(
        eq(todoSchema.ownerId, ownerId),
        gte(todoSchema.createdAt, weekStart),
      ),
    );

  // Get this month's count
  const [monthResult] = await db
    .select({ count: count() })
    .from(todoSchema)
    .where(
      and(
        eq(todoSchema.ownerId, ownerId),
        gte(todoSchema.createdAt, monthStart),
      ),
    );

  return {
    total: totalResult?.count ?? 0,
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    thisMonth: monthResult?.count ?? 0,
  };
}

/**
 * Check if a todo exists and belongs to the specified owner
 * @param id - Todo ID
 * @param ownerId - Owner ID
 * @returns Promise resolving to boolean
 */
export async function todoExists(id: number, ownerId: string): Promise<boolean> {
  const todo = await getTodoById(id, ownerId);
  return todo !== null;
}

/**
 * Get paginated todos with metadata
 * This is a convenience function that combines getTodosByOwner and getTodosCount
 * @param params - Query parameters
 * @returns Promise resolving to todos with pagination metadata
 */
export async function getPaginatedTodos(params: TodoListParams): Promise<{
  todos: TodoDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const [todos, total] = await Promise.all([
    getTodosByOwner(params),
    getTodosCount(params.ownerId, params.search),
  ]);

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
