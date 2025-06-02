/**
 * Todo-related TypeScript types and interfaces
 * Following Yamato-SaaS conventions and Drizzle ORM patterns
 */

import type { todoSchema } from '@/models/Schema';

// Infer the Todo type from Drizzle schema (server-side with Date objects)
export type TodoDb = typeof todoSchema.$inferSelect;

// Client-side Todo type (dates are strings when received from API)
export type Todo = Omit<TodoDb, 'createdAt' | 'updatedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Input types for creating todos
export type CreateTodoInput = typeof todoSchema.$inferInsert;

// Input types for updating todos (partial except for required fields)
export type UpdateTodoInput = Partial<Omit<CreateTodoInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Pagination options for todo lists
export type PaginationOptions = {
  page: number;
  limit: number;
  offset?: number;
};

// Todo list parameters including filters and pagination
export type TodoListParams = {
  search?: string;
  ownerId: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
} & PaginationOptions;

// Todo statistics for dashboard
export type TodoStats = {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  completed?: number; // For future enhancement when we add status field
};

// API Response types following Yamato-SaaS convention
export type TodosResponse = {
  success: true;
  data: Todo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type TodoResponse = {
  success: true;
  data: Todo;
  message?: string;
};

export type TodoStatsResponse = {
  success: true;
  data: TodoStats;
};

// Error response type
export type TodoErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Multi-tenancy owner types
export type OwnerType = 'user' | 'organization';

export type TodoOwner = {
  id: string;
  type: OwnerType;
};

// Form data types for React Hook Form
export type TodoFormData = {
  title: string;
  message: string;
};

// Filter state for todo list
export type TodoFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
};
