/**
 * useTodos Hook
 * Manages todo data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchTodos } from '@/libs/api/todos';
import type { Todo, TodoListParams, TodosResponse } from '@/types/todo';

type TodosState = {
  todos: Todo[];
  pagination: TodosResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type TodosReturn = TodosState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Omit<TodoListParams, 'ownerId'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useTodos(params?: Omit<TodoListParams, 'ownerId'>): TodosReturn {
  const [state, setState] = useState<TodosState>({
    todos: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  const page = params?.page ?? DEFAULT_PARAMS.page;
  const limit = params?.limit ?? DEFAULT_PARAMS.limit;
  const search = params?.search ?? DEFAULT_PARAMS.search;
  const sortBy = params?.sortBy ?? DEFAULT_PARAMS.sortBy;
  const sortOrder = params?.sortOrder ?? DEFAULT_PARAMS.sortOrder;

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const effectiveParams = { page, limit, search, sortBy, sortOrder };
      const response = await fetchTodos(effectiveParams);

      setState({
        todos: response.data,
        pagination: response.pagination || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        todos: [],
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

  return {
    ...state,
    refresh,
  };
}
