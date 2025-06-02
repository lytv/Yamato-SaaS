/**
 * useTodoFilters Hook
 * Manages todo filtering and search state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { TodoFilters } from '@/types/todo';

type TodoFiltersReturn = TodoFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: TodoFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: TodoFilters['sortOrder']) => void;
  resetFilters: () => void;
};

const DEFAULT_FILTERS: TodoFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useTodoFilters(initialFilters?: Partial<TodoFilters>): TodoFiltersReturn {
  const [filters, setFilters] = useState<TodoFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: TodoFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: TodoFilters['sortOrder']) => {
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
