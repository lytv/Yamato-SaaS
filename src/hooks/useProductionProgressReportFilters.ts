/**
 * useProductionProgressReportFilters Hook
 * Manages filter state and URL synchronization for production progress report
 * Following Yamato-SaaS patterns and URL sync implementation
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type {
  ProductionProgressReportFilterState,
  ProductionProgressReportItem,
  UseProductionProgressReportFiltersResult,
} from '@/types/productionProgressReport';

const DEFAULT_FILTERS: ProductionProgressReportFilterState = {
  search: '',
  plan_code: '',
  product_code: '',
  production_step_code: '',
  report_type: 'ALL',
  sortBy: 'plan_code',
  sortOrder: 'asc',
};

/**
 * Hook for managing production progress report filter state with URL sync
 * @returns Filter state and management functions
 */
export function useProductionProgressReportFilters(): UseProductionProgressReportFiltersResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFiltersState] = useState<ProductionProgressReportFilterState>(() => {
    return {
      search: searchParams.get('search') || DEFAULT_FILTERS.search,
      plan_code: searchParams.get('plan_code') || DEFAULT_FILTERS.plan_code,
      product_code: searchParams.get('product_code') || DEFAULT_FILTERS.product_code,
      production_step_code: searchParams.get('production_step_code') || DEFAULT_FILTERS.production_step_code,
      report_type: (searchParams.get('report_type') as 'ALL' | 'EMPLOYEE_SUMMARY' | 'OUTSOURCE_DETAIL') || DEFAULT_FILTERS.report_type,
      sortBy: (searchParams.get('sortBy') as keyof ProductionProgressReportItem) || DEFAULT_FILTERS.sortBy,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || DEFAULT_FILTERS.sortOrder,
    };
  });

  // Update URL when filters change
  const updateURL = useCallback((newFilters: ProductionProgressReportFilterState) => {
    const params = new URLSearchParams();

    // Only add non-empty values to URL
    Object.entries(newFilters).forEach(([key, value]) => {
      const defaultValue = DEFAULT_FILTERS[key as keyof ProductionProgressReportFilterState];
      if (value && value !== defaultValue) {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Use replace to avoid adding to browser history for every filter change
    router.replace(newUrl, { scroll: false });
  }, [router, pathname]);

  // Set filters with URL sync
  const setFilters = useCallback((newFilters: Partial<ProductionProgressReportFilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFiltersState(updatedFilters);
    updateURL(updatedFilters);
  }, [filters, updateURL]);

  // Apply filters - this is the manual trigger that updates both state and URL
  const applyFilters = useCallback((newFilters: ProductionProgressReportFilterState) => {
    setFiltersState(newFilters);
    updateURL(newFilters);
  }, [updateURL]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    updateURL(DEFAULT_FILTERS);
  }, [updateURL]);

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    return value !== DEFAULT_FILTERS[key as keyof ProductionProgressReportFilterState];
  });

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    return value !== DEFAULT_FILTERS[key as keyof ProductionProgressReportFilterState];
  }).length;

  // Sync with URL changes (e.g., browser back/forward)
  useEffect(() => {
    const newFilters: ProductionProgressReportFilterState = {
      search: searchParams.get('search') || DEFAULT_FILTERS.search,
      plan_code: searchParams.get('plan_code') || DEFAULT_FILTERS.plan_code,
      product_code: searchParams.get('product_code') || DEFAULT_FILTERS.product_code,
      production_step_code: searchParams.get('production_step_code') || DEFAULT_FILTERS.production_step_code,
      report_type: (searchParams.get('report_type') as 'ALL' | 'EMPLOYEE_SUMMARY' | 'OUTSOURCE_DETAIL') || DEFAULT_FILTERS.report_type,
      sortBy: (searchParams.get('sortBy') as keyof ProductionProgressReportItem) || DEFAULT_FILTERS.sortBy,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || DEFAULT_FILTERS.sortOrder,
    };

    // Only update state if URL params actually changed
    const hasChanged = Object.entries(newFilters).some(([key, value]) => {
      return value !== filters[key as keyof ProductionProgressReportFilterState];
    });

    if (hasChanged) {
      setFiltersState(newFilters);
    }
  }, [searchParams, filters]);

  return {
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}
