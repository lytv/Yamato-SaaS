/**
 * OutsourceOrderDetail filters hook with state management
 * Based on useOutsourceOrderFilters pattern but enhanced for detail filtering
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import type { OutsourceOrderDetailFilters } from '@/types/outsourceOrderDetail';

const DEFAULT_FILTERS: OutsourceOrderDetailFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useOutsourceOrderDetailFilters(outsourceOrderId?: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<OutsourceOrderDetailFilters>(() => ({
    search: searchParams.get('detailSearch') || DEFAULT_FILTERS.search,
    sortBy: (searchParams.get('detailSortBy') as any) || DEFAULT_FILTERS.sortBy,
    sortOrder: (searchParams.get('detailSortOrder') as any) || DEFAULT_FILTERS.sortOrder,
    outsourceOrderId,
    assignedToUserId: searchParams.get('assignedToUserId') || undefined,
    planId: searchParams.get('planId') ? Number(searchParams.get('planId')) : undefined,
    productId: searchParams.get('productId') ? Number(searchParams.get('productId')) : undefined,
    productionStepId: searchParams.get('productionStepId') ? Number(searchParams.get('productionStepId')) : undefined,
    // Quick search fields
    assignedUserSearch: searchParams.get('assignedUserSearch') || undefined,
    productSearch: searchParams.get('productSearch') || undefined,
    productionStepSearch: searchParams.get('productionStepSearch') || undefined,
    // Separate date fields for UI
    startDate: searchParams.get('orderStartDate') ? new Date(searchParams.get('orderStartDate')!) : undefined,
    endDate: searchParams.get('orderEndDate') ? new Date(searchParams.get('orderEndDate')!) : undefined,
    // Keep for backward compatibility and API calls
    orderDateRange: (() => {
      const start = searchParams.get('orderStartDate');
      const end = searchParams.get('orderEndDate');
      if (start && end) {
        return {
          start: new Date(start),
          end: new Date(end),
        };
      }
      return undefined;
    })(),
  }));

  // Temporary filters state for manual search (UI only, not auto-applied)
  const [tempFilters, setTempFilters] = useState<Partial<OutsourceOrderDetailFilters>>({});

  // Update URL when filters change
  const updateURL = useCallback((newFilters: OutsourceOrderDetailFilters) => {
    const params = new URLSearchParams(searchParams);

    // Use prefixed keys to avoid conflicts with order filters
    const keyMapping = {
      search: 'detailSearch',
      sortBy: 'detailSortBy',
      sortOrder: 'detailSortOrder',
      assignedToUserId: 'assignedToUserId',
      planId: 'planId',
      productId: 'productId',
      productionStepId: 'productionStepId',
      assignedUserSearch: 'assignedUserSearch',
      productSearch: 'productSearch',
      productionStepSearch: 'productionStepSearch',
    };

    Object.entries(newFilters).forEach(([key, value]) => {
      const urlKey = (keyMapping as any)[key] || key;

      if (key === 'orderDateRange' && value) {
        params.set('orderStartDate', (value as any).start.toISOString());
        params.set('orderEndDate', (value as any).end.toISOString());
      } else if (value !== undefined && value !== null && value !== '') {
        params.set(urlKey, String(value));
      } else {
        params.delete(urlKey);
        if (key === 'orderDateRange') {
          params.delete('orderStartDate');
          params.delete('orderEndDate');
        }
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Update filters function
  const updateFilters = useCallback((updates: Partial<OutsourceOrderDetailFilters>) => {
    const newFilters = { ...filters, ...updates, outsourceOrderId };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [filters, updateURL, outsourceOrderId]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const newFilters = { ...DEFAULT_FILTERS, outsourceOrderId };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [updateURL, outsourceOrderId]);

  // Individual filter setters
  const setSearch = useCallback((search: string) => {
    updateFilters({ search });
  }, [updateFilters]);

  const setSorting = useCallback((sortBy: OutsourceOrderDetailFilters['sortBy'], sortOrder: OutsourceOrderDetailFilters['sortOrder']) => {
    updateFilters({ sortBy, sortOrder });
  }, [updateFilters]);

  const setAssignedToUserId = useCallback((assignedToUserId: string | undefined) => {
    updateFilters({ assignedToUserId });
  }, [updateFilters]);

  const setPlanId = useCallback((planId: number | undefined) => {
    updateFilters({ planId });
  }, [updateFilters]);

  const setProductId = useCallback((productId: number | undefined) => {
    updateFilters({ productId });
  }, [updateFilters]);

  const setProductionStepId = useCallback((productionStepId: number | undefined) => {
    updateFilters({ productionStepId });
  }, [updateFilters]);

  const setOrderDateRange = useCallback((dateRange: { start: Date; end: Date } | undefined) => {
    updateFilters({ orderDateRange: dateRange });
  }, [updateFilters]);

  // Temporary filter setters (for manual search - UI only, no auto-apply)
  const setTempStartDate = useCallback((startDate: Date | undefined) => {
    setTempFilters((prev) => {
      const newFilters = { ...prev, startDate };

      // Validate: if endDate exists and startDate > endDate, clear endDate
      if (startDate && prev.endDate && startDate > prev.endDate) {
        newFilters.endDate = undefined;
      }

      return newFilters;
    });
  }, []);

  const setTempEndDate = useCallback((endDate: Date | undefined) => {
    setTempFilters((prev) => {
      const newFilters = { ...prev, endDate };

      // Validate: if startDate exists and endDate < startDate, clear startDate
      if (endDate && prev.startDate && endDate < prev.startDate) {
        newFilters.startDate = undefined;
      }

      return newFilters;
    });
  }, []);

  const setTempAssignedToUserId = useCallback((assignedToUserId: string | undefined) => {
    setTempFilters(prev => ({ ...prev, assignedToUserId }));
  }, []);

  const setTempPlanId = useCallback((planId: number | undefined) => {
    setTempFilters(prev => ({ ...prev, planId }));
  }, []);

  const setTempProductId = useCallback((productId: number | undefined) => {
    setTempFilters(prev => ({ ...prev, productId }));
  }, []);

  const setTempProductionStepId = useCallback((productionStepId: number | undefined) => {
    setTempFilters(prev => ({ ...prev, productionStepId }));
  }, []);

  // Temporary search setters for quick search fields
  const setTempAssignedUserSearch = useCallback((assignedUserSearch: string | undefined) => {
    setTempFilters(prev => ({ ...prev, assignedUserSearch }));
  }, []);

  const setTempProductSearch = useCallback((productSearch: string | undefined) => {
    setTempFilters(prev => ({ ...prev, productSearch }));
  }, []);

  const setTempProductionStepSearch = useCallback((productionStepSearch: string | undefined) => {
    setTempFilters(prev => ({ ...prev, productionStepSearch }));
  }, []);

  // Manual search function - applies temp filters and converts to API format
  const handleManualSearch = useCallback(() => {
    const { startDate, endDate, ...otherTempFilters } = tempFilters;

    // Validate date range before submitting
    if (startDate && endDate && startDate > endDate) {
      console.warn('Invalid date range: Start date cannot be after end date');
      return; // Don't submit if invalid range
    }

    // Convert separate dates to orderDateRange for API
    let orderDateRange: { start: Date; end: Date } | undefined;
    if (startDate && endDate) {
      // If same day, set endDate to end of day
      const endOfDay = new Date(endDate);
      if (startDate.toDateString() === endDate.toDateString()) {
        endOfDay.setHours(23, 59, 59, 999);
      }
      orderDateRange = { start: startDate, end: endOfDay };
    } else if (startDate) {
      // If only start date, set end to end of the same day
      const endOfDay = new Date(startDate);
      endOfDay.setHours(23, 59, 59, 999);
      orderDateRange = { start: startDate, end: endOfDay };
    } else if (endDate) {
      // If only end date, set start to beginning of the same day
      const startOfDay = new Date(endDate);
      startOfDay.setHours(0, 0, 0, 0);
      orderDateRange = { start: startOfDay, end: endDate };
    }

    const newFilters = {
      ...filters,
      ...otherTempFilters,
      orderDateRange,
      outsourceOrderId,
    };

    setFilters(newFilters);
    updateURL(newFilters);
    setTempFilters({}); // Clear temp filters after applying
  }, [tempFilters, filters, outsourceOrderId, updateURL]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'outsourceOrderId') {
        return false;
      } // Don't count outsourceOrderId as active filter
      const defaultValue = DEFAULT_FILTERS[key as keyof OutsourceOrderDetailFilters];
      return value !== defaultValue && value !== undefined && value !== null && value !== '';
    });
  }, [filters]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'outsourceOrderId') {
        return false;
      }
      const defaultValue = DEFAULT_FILTERS[key as keyof OutsourceOrderDetailFilters];
      return value !== defaultValue && value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);

  return {
    filters,
    tempFilters,
    updateFilters,
    resetFilters,
    setSearch,
    setSorting,
    setAssignedToUserId,
    setPlanId,
    setProductId,
    setProductionStepId,
    setOrderDateRange,
    // Manual search functions
    setTempStartDate,
    setTempEndDate,
    setTempAssignedToUserId,
    setTempPlanId,
    setTempProductId,
    setTempProductionStepId,
    // Quick search functions
    setTempAssignedUserSearch,
    setTempProductSearch,
    setTempProductionStepSearch,
    handleManualSearch,
    hasActiveFilters,
    activeFilterCount,
  };
}
