/**
 * Satellite Progress Filters Hook
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { useState, useCallback, useMemo } from 'react';

import type {
  SatelliteProgressFilterState,
  UseSatelliteProgressFiltersResult,
} from '@/types/satelliteProgress';

const DEFAULT_FILTERS: SatelliteProgressFilterState = {
  search: '',
  plan_code: '',
  product_code: '',
  assigned_user_id: '',
  sortBy: 'product_code',
  sortOrder: 'asc',
};

/**
 * Custom hook for managing satellite progress filters
 * @returns Filter state and management functions
 */
export function useSatelliteProgressFilters(): UseSatelliteProgressFiltersResult {
  const [filters, setFiltersState] = useState<SatelliteProgressFilterState>(DEFAULT_FILTERS);

  const setFilters = useCallback((newFilters: Partial<SatelliteProgressFilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const applyFilters = useCallback((newFilters: SatelliteProgressFilterState) => {
    setFiltersState(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = DEFAULT_FILTERS[key as keyof SatelliteProgressFilterState];
      return value !== defaultValue;
    });
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      const defaultValue = DEFAULT_FILTERS[key as keyof SatelliteProgressFilterState];
      return value !== defaultValue && value !== '';
    }).length;
  }, [filters]);

  return {
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}