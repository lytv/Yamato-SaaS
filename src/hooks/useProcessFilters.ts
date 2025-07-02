/**
 * useProcessFilters Hook
 * Manages process filtering and search state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { ProcessFilters } from '@/types/process';

type ProcessFiltersReturn = ProcessFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: ProcessFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: ProcessFilters['sortOrder']) => void;
  resetFilters: () => void;
};

const DEFAULT_FILTERS: ProcessFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useProcessFilters(initialFilters?: Partial<ProcessFilters>): ProcessFiltersReturn {
  const [filters, setFilters] = useState<ProcessFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: ProcessFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: ProcessFilters['sortOrder']) => {
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
