/**
 * OutsourceOrderDetail filtering hook with enhanced features
 * Generated based on existing pattern from useOutsourceOrderFilters.ts
 */

import { useCallback, useState } from 'react';
import type { OutsourceOrderDetailFilters } from '@/types/outsourceOrderDetail';

const defaultFilters: OutsourceOrderDetailFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  outsourceOrderId: undefined,
  status: undefined,
  planId: undefined,
  productId: undefined,
  productionStepId: undefined,
  dateRange: undefined,
  relations: {},
};

export function useOutsourceOrderDetailFilters(initialFilters?: Partial<OutsourceOrderDetailFilters>) {
  const [filters, setFilters] = useState<OutsourceOrderDetailFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const setSortBy = useCallback((sortBy: OutsourceOrderDetailFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder: OutsourceOrderDetailFilters['sortOrder']) => {
    setFilters(prev => ({ ...prev, sortOrder }));
  }, []);

  const setOutsourceOrderId = useCallback((outsourceOrderId: number | undefined) => {
    setFilters(prev => ({ ...prev, outsourceOrderId }));
  }, []);

  const setStatus = useCallback((status: string | undefined) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const setPlanId = useCallback((planId: number | undefined) => {
    setFilters(prev => ({ ...prev, planId }));
  }, []);

  const setProductId = useCallback((productId: number | undefined) => {
    setFilters(prev => ({ ...prev, productId }));
  }, []);

  const setProductionStepId = useCallback((productionStepId: number | undefined) => {
    setFilters(prev => ({ ...prev, productionStepId }));
  }, []);

  const setDateRange = useCallback((dateRange: { start: Date; end: Date } | undefined) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  const setRelations = useCallback((relations: Record<string, any>) => {
    setFilters(prev => ({ ...prev, relations }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      ...defaultFilters,
      // Keep outsourceOrderId if it was set initially
      outsourceOrderId: initialFilters?.outsourceOrderId,
    });
  }, [initialFilters?.outsourceOrderId]);

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.status !== undefined ||
    filters.planId !== undefined ||
    filters.productId !== undefined ||
    filters.productionStepId !== undefined ||
    filters.dateRange !== undefined ||
    Object.keys(filters.relations || {}).length > 0;

  const updateFilter = useCallback(<K extends keyof OutsourceOrderDetailFilters>(
    key: K,
    value: OutsourceOrderDetailFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    filters,
    setSearch,
    setSortBy,
    setSortOrder,
    setOutsourceOrderId,
    setStatus,
    setPlanId,
    setProductId,
    setProductionStepId,
    setDateRange,
    setRelations,
    resetFilters,
    hasActiveFilters,
    updateFilter,
    setFilters,
  };
}
