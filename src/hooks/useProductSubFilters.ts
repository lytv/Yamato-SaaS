/**
 * useProductSubFilters Hook
 * Manages productsub filtering and search state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { ProductSubFilters } from '@/types/productsub';

type ProductSubFiltersReturn = ProductSubFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: ProductSubFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: ProductSubFilters['sortOrder']) => void;
  resetFilters: () => void;
};

const DEFAULT_FILTERS: ProductSubFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useProductSubFilters(initialFilters?: Partial<ProductSubFilters>): ProductSubFiltersReturn {
  const [filters, setFilters] = useState<ProductSubFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: ProductSubFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: ProductSubFilters['sortOrder']) => {
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
