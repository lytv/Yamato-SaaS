/**
 * useProductFilters Hook
 * Manages product filtering and search state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { ProductFilters } from '@/types/product';

type ProductFiltersReturn = ProductFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: ProductFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: ProductFilters['sortOrder']) => void;
  resetFilters: () => void;
};

const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useProductFilters(initialFilters?: Partial<ProductFilters>): ProductFiltersReturn {
  const [filters, setFilters] = useState<ProductFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: ProductFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: ProductFilters['sortOrder']) => {
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
