'use client';

/**
 * Production Progress Pivot Context
 * Provides shared state for filters between components
 * Following Yamato-SaaS patterns
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';

import type {
  ProductionProgressPivotFilterState,
  UseProductionProgressPivotFiltersResult,
} from '@/types/productionProgressPivot';

const DEFAULT_FILTERS: ProductionProgressPivotFilterState = {
  search: '',
  product_code: '',
  plan_code: '',
  sortBy: 'product_code',
  sortOrder: 'asc',
};

interface ProductionProgressPivotContextValue extends UseProductionProgressPivotFiltersResult {
  // Additional context methods can be added here
}

const ProductionProgressPivotContext = createContext<ProductionProgressPivotContextValue | undefined>(undefined);

interface ProductionProgressPivotProviderProps {
  children: ReactNode;
}

export function ProductionProgressPivotProvider({ children }: ProductionProgressPivotProviderProps) {
  const [filters, setFilters] = useState<ProductionProgressPivotFilterState>(DEFAULT_FILTERS);

  const updateFilters = React.useCallback((newFilters: Partial<ProductionProgressPivotFilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const applyFilters = React.useCallback((newFilters: ProductionProgressPivotFilterState) => {
    setFilters(newFilters);
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.product_code ||
    filters.plan_code ||
    filters.sortBy !== DEFAULT_FILTERS.sortBy ||
    filters.sortOrder !== DEFAULT_FILTERS.sortOrder,
  );

  const activeFilterCount = [
    filters.search,
    filters.product_code,
    filters.plan_code,
  ].filter(Boolean).length;

  const contextValue: ProductionProgressPivotContextValue = {
    filters,
    setFilters: updateFilters,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  };

  return (
    <ProductionProgressPivotContext.Provider value={contextValue}>
      {children}
    </ProductionProgressPivotContext.Provider>
  );
}

export function useProductionProgressPivotContext(): ProductionProgressPivotContextValue {
  const context = useContext(ProductionProgressPivotContext);
  if (context === undefined) {
    throw new Error('useProductionProgressPivotContext must be used within a ProductionProgressPivotProvider');
  }
  return context;
}