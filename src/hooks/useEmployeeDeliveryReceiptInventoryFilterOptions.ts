/**
 * useEmployeeDeliveryReceiptInventoryFilterOptions Hook
 * Manages filter options data fetching for dropdown components
 * Following Yamato-SaaS patterns with caching
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchEmployeeDeliveryReceiptInventoryFilterOptions } from '@/libs/api/employeeDeliveryReceiptInventory';
import type {
  EmployeeDeliveryReceiptInventoryFilterOptions,
} from '@/types/employeeDeliveryReceiptInventory';

type UseEmployeeDeliveryReceiptInventoryFilterOptionsState = {
  options: EmployeeDeliveryReceiptInventoryFilterOptions | null;
  isLoading: boolean;
  error: string | null;
};

type UseEmployeeDeliveryReceiptInventoryFilterOptionsReturn = UseEmployeeDeliveryReceiptInventoryFilterOptionsState & {
  refresh: () => void;
  refetch: () => void;
};

// Cache for filter options to avoid unnecessary API calls
let cachedOptions: EmployeeDeliveryReceiptInventoryFilterOptions | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useEmployeeDeliveryReceiptInventoryFilterOptions(): UseEmployeeDeliveryReceiptInventoryFilterOptionsReturn {
  const [state, setState] = useState<UseEmployeeDeliveryReceiptInventoryFilterOptionsState>({
    options: cachedOptions,
    isLoading: false,
    error: null,
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && cachedOptions && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      setState(prev => ({
        ...prev,
        options: cachedOptions,
        isLoading: false,
        error: null,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchEmployeeDeliveryReceiptInventoryFilterOptions();

      if (result.success) {
        // Update cache
        cachedOptions = result.data;
        cacheTimestamp = now;

        setState({
          options: result.data,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
          options: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch filter options',
        options: null,
      }));
    }
  }, []);

  const refresh = useCallback(() => {
    fetchData(true); // Force refresh
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData(true); // Force refresh
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refresh,
    refetch,
  };
}

/**
 * Helper function to clear the cache (useful for testing or when data changes)
 */
export function clearFilterOptionsCache(): void {
  cachedOptions = null;
  cacheTimestamp = null;
}