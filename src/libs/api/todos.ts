/**
 * Todo API Client
 * Client-side functions for todo CRUD operations
 * Following Yamato-SaaS patterns with proper error handling
 */

import type {
  CreateTodoInput,
  Todo,
  TodoErrorResponse,
  TodoListParams,
  TodoResponse,
  TodosResponse,
  TodoStats,
  TodoStatsResponse,
  UpdateTodoInput,
} from '@/types/todo';

/**
 * Fetch todos with pagination and filtering
 */
export async function fetchTodos(
  params: Omit<TodoListParams, 'ownerId'> = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
): Promise<TodosResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', params.page?.toString() || '1');
  searchParams.set('limit', params.limit?.toString() || '10');
  searchParams.set('sortBy', params.sortBy || 'createdAt');
  searchParams.set('sortOrder', params.sortOrder || 'desc');

  if (params.search) {
    searchParams.set('search', params.search);
  }

  const response = await fetch(`/api/todos?${searchParams.toString()}`);

  if (!response.ok) {
    const error: TodoErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch todos');
  }

  return response.json();
}

/**
 * Fetch single todo by ID
 */
export async function fetchTodo(id: number): Promise<Todo> {
  const response = await fetch(`/api/todos/${id}`);

  if (!response.ok) {
    const error: TodoErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch todo');
  }

  const result: TodoResponse = await response.json();
  return result.data;
}

/**
 * Create new todo
 */
export async function createTodo(data: Omit<CreateTodoInput, 'ownerId'>): Promise<Todo> {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: TodoErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create todo');
  }

  const result: TodoResponse = await response.json();
  return result.data;
}

/**
 * Update existing todo
 */
export async function updateTodo(id: number, data: UpdateTodoInput): Promise<Todo> {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: TodoErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update todo');
  }

  const result: TodoResponse = await response.json();
  return result.data;
}

/**
 * Delete todo
 */
export async function deleteTodo(id: number): Promise<void> {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: TodoErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete todo');
  }
}

/**
 * Fetch todo statistics
 */
export async function fetchTodoStats(): Promise<TodoStats> {
  const response = await fetch('/api/todos/stats');

  if (!response.ok) {
    const error: TodoErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch todo stats');
  }

  const result: TodoStatsResponse = await response.json();
  return result.data;
}
