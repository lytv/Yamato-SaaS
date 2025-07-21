/**
 * useEmployeeDeliveryReceiptInventoryFilters Hook
 * Manages filter state and URL synchronization for employee delivery receipt inventory
 * Following Yamato-SaaS patterns and URL sync implementation
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type {
  EmployeeDeliveryReceiptInventoryFilters,
  EmployeeDeliveryReceiptInventoryFilterState,
  EmployeeDeliveryReceiptInventoryItem,
} from '@/types/employeeDeliveryReceiptInventory';
import { EMPLOYEE_DELIVERY_RECEIPT_INVENTORY_DEFAULTS } from '@/types/employeeDeliveryReceiptInventory';

type UseEmployeeDeliveryReceiptInventoryFiltersReturn = {
  filters: EmployeeDeliveryReceiptInventoryFilterState;
  setFilters: (filters: Partial<EmployeeDeliveryReceiptInventoryFilterState>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  updateFilter: (key: keyof EmployeeDeliveryReceiptInventoryFilterState, value: string) => void;
  getApiFilters: () => EmployeeDeliveryReceiptInventoryFilters;
};

const DEFAULT_FILTERS: EmployeeDeliveryReceiptInventoryFilterState = {
  search: '',
  plan_code: '',
  product_code: '',
  production_step_code: '',
  employee_id: '',
  sortBy: EMPLOYEE_DELIVERY_RECEIPT_INVENTORY_DEFAULTS.SORT_BY,
  sortOrder: EMPLOYEE_DELIVERY_RECEIPT_INVENTORY_DEFAULTS.SORT_ORDER,
};

export function useEmployeeDeliveryReceiptInventoryFilters(): UseEmployeeDeliveryReceiptInventoryFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFiltersState] = useState<EmployeeDeliveryReceiptInventoryFilterState>(() => {
    return {
      search: searchParams.get('search') || DEFAULT_FILTERS.search,
      plan_code: searchParams.get('plan_code') || DEFAULT_FILTERS.plan_code,
      product_code: searchParams.get('product_code') || DEFAULT_FILTERS.product_code,
      production_step_code: searchParams.get('production_step_code') || DEFAULT_FILTERS.production_step_code,
      employee_id: searchParams.get('employee_id') || DEFAULT_FILTERS.employee_id,
      sortBy: (searchParams.get('sortBy') as keyof EmployeeDeliveryReceiptInventoryItem) || DEFAULT_FILTERS.sortBy,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || DEFAULT_FILTERS.sortOrder,
    };
  });

  // Update URL when filters change
  const updateURL = useCallback((newFilters: EmployeeDeliveryReceiptInventoryFilterState) => {
    const params = new URLSearchParams();

    // Only add non-empty values to URL
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== DEFAULT_FILTERS[key as keyof EmployeeDeliveryReceiptInventoryFilterState]) {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '';

    // Use replace to avoid adding to browser history for every filter change
    router.replace(newUrl, { scroll: false });
  }, [router]);

  // Set filters with URL sync
  const setFilters = useCallback((newFilters: Partial<EmployeeDeliveryReceiptInventoryFilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFiltersState(updatedFilters);
    updateURL(updatedFilters);
  }, [filters, updateURL]);

  // Update single filter
  const updateFilter = useCallback((key: keyof EmployeeDeliveryReceiptInventoryFilterState, value: string) => {
    setFilters({ [key]: value });
  }, [setFilters]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    updateURL(DEFAULT_FILTERS);
  }, [updateURL]);

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    return value !== DEFAULT_FILTERS[key as keyof EmployeeDeliveryReceiptInventoryFilterState];
  });

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    return value !== DEFAULT_FILTERS[key as keyof EmployeeDeliveryReceiptInventoryFilterState];
  }).length;

  // Convert filter state to API filters format
  const getApiFilters = useCallback((): EmployeeDeliveryReceiptInventoryFilters => {
    return {
      search: filters.search || undefined,
      plan_code: filters.plan_code || undefined,
      product_code: filters.product_code || undefined,
      production_step_code: filters.production_step_code || undefined,
      employee_id: filters.employee_id || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: 1, // Reset to first page when filters change
      limit: EMPLOYEE_DELIVERY_RECEIPT_INVENTORY_DEFAULTS.PAGE_SIZE,
    };
  }, [filters]);

  // Sync with URL changes (e.g., browser back/forward)
  useEffect(() => {
    const newFilters: EmployeeDeliveryReceiptInventoryFilterState = {
      search: searchParams.get('search') || DEFAULT_FILTERS.search,
      plan_code: searchParams.get('plan_code') || DEFAULT_FILTERS.plan_code,
      product_code: searchParams.get('product_code') || DEFAULT_FILTERS.product_code,
      production_step_code: searchParams.get('production_step_code') || DEFAULT_FILTERS.production_step_code,
      employee_id: searchParams.get('employee_id') || DEFAULT_FILTERS.employee_id,
      sortBy: (searchParams.get('sortBy') as keyof EmployeeDeliveryReceiptInventoryItem) || DEFAULT_FILTERS.sortBy,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || DEFAULT_FILTERS.sortOrder,
    };

    // Only update state if URL params actually changed
    const hasChanged = Object.entries(newFilters).some(([key, value]) => {
      return value !== filters[key as keyof EmployeeDeliveryReceiptInventoryFilterState];
    });

    if (hasChanged) {
      setFiltersState(newFilters);
    }
  }, [searchParams, filters]);

  return {
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
    updateFilter,
    getApiFilters,
  };
}
