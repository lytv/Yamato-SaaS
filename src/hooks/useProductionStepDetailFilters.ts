/**
 * useProductionStepDetailFilters Hook
 * Manages production step detail filtering and search state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { ProductionStepDetailFilters } from '@/types/productionStepDetail';

type ProductionStepDetailFiltersReturn = ProductionStepDetailFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: ProductionStepDetailFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: ProductionStepDetailFilters['sortOrder']) => void;
  handleProductIdChange: (productId?: number) => void;
  handleProductionStepIdChange: (productionStepId?: number) => void;
  resetFilters: () => void;
};

const DEFAULT_FILTERS: ProductionStepDetailFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  productId: undefined,
  productionStepId: undefined,
};

export function useProductionStepDetailFilters(initialFilters?: Partial<ProductionStepDetailFilters>): ProductionStepDetailFiltersReturn {
  const [filters, setFilters] = useState<ProductionStepDetailFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: ProductionStepDetailFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: ProductionStepDetailFilters['sortOrder']) => {
    setFilters(prev => ({ ...prev, sortOrder }));
  }, []);

  const handleProductIdChange = useCallback((productId?: number) => {
    setFilters(prev => ({ ...prev, productId }));
  }, []);

  const handleProductionStepIdChange = useCallback((productionStepId?: number) => {
    setFilters(prev => ({ ...prev, productionStepId }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    ...filters,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    handleProductIdChange,
    handleProductionStepIdChange,
    resetFilters,
  };
}
