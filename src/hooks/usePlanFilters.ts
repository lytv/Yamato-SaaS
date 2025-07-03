/**
 * usePlanFilters Hook
 * Manages plan filtering and search state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { PlanFilters } from '@/types/plan';

type PlanFiltersReturn = PlanFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: PlanFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: PlanFilters['sortOrder']) => void;
  resetFilters: () => void;
};

const DEFAULT_FILTERS: PlanFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function usePlanFilters(initialFilters?: Partial<PlanFilters>): PlanFiltersReturn {
  const [filters, setFilters] = useState<PlanFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: PlanFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: PlanFilters['sortOrder']) => {
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
