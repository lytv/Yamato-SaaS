/**
 * useProductionStepFilters Hook
 * Manages production step filtering and search state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { ProductionStepFilters } from '@/types/productionStep';

type ProductionStepFiltersReturn = ProductionStepFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: ProductionStepFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: ProductionStepFilters['sortOrder']) => void;
  resetFilters: () => void;
};

const DEFAULT_FILTERS: ProductionStepFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useProductionStepFilters(initialFilters?: Partial<ProductionStepFilters>): ProductionStepFiltersReturn {
  const [filters, setFilters] = useState<ProductionStepFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: ProductionStepFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: ProductionStepFilters['sortOrder']) => {
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
