/**
 * useEmployeeSalaryEntrys Hook
 * Manages employeeSalaryEntry data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchEmployeeSalaryEntrys } from '@/libs/api/employeeSalaryEntries';
import type { EmployeeSalaryEntryListParamsWithOwner, EmployeeSalaryEntrysResponse, EmployeeSalaryEntryWithRelations, EmployeeSalaryEntryRelationOptions } from '@/types/employeeSalaryEntry';

type EmployeeSalaryEntrysState = {
  employeeSalaryEntrys: EmployeeSalaryEntryWithRelations[];
  pagination: EmployeeSalaryEntrysResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type EmployeeSalaryEntrysReturn = EmployeeSalaryEntrysState & {
  refresh: () => void;
};

const DEFAULT_PARAMS = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const,
  search: undefined,
  showAll: false,
  ownerId: '', // TODO: lấy ownerId thực tế từ context/auth
};

export function useEmployeeSalaryEntrys(params: EmployeeSalaryEntryListParamsWithOwner & { includeRelations?: boolean }): EmployeeSalaryEntrysReturn {
  const {
    search = DEFAULT_PARAMS.search,
    sortBy = DEFAULT_PARAMS.sortBy,
    sortOrder = DEFAULT_PARAMS.sortOrder,
    page = DEFAULT_PARAMS.page,
    limit = DEFAULT_PARAMS.limit,
    ownerId,
    showAll = DEFAULT_PARAMS.showAll,
    includeRelations = true,
    // Enhanced filter parameters
    status,
    dateFrom,
    dateTo,
    workDateFrom,
    workDateTo,
    userId,
    employeeCode,
    employeeName,
    productId,
    productCode,
    productName,
    productionStepDetailId,
    stepName,
    planId,
  } = params;
  const [state, setState] = useState<EmployeeSalaryEntrysState>({
    employeeSalaryEntrys: [],
    pagination: null,
    isLoading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!ownerId) {
      // Don't fetch without ownerId - prevents unauthorized access
      setState(prev => ({ ...prev, isLoading: false, error: null }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchEmployeeSalaryEntrys({
        search,
        sortBy,
        sortOrder,
        page,
        limit,
        showAll,
        includeRelations,
        ownerId: ownerId || '',
        // Enhanced filter parameters
        status,
        dateFrom,
        dateTo,
        workDateFrom,
        workDateTo,
        userId,
        employeeCode,
        employeeName,
        productId,
        productCode,
        productName,
        productionStepDetailId,
        stepName,
        planId,
      });

      if (result.success) {
        setState({
          employeeSalaryEntrys: [...result.data],
          pagination: result.pagination || null,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'API error',
          employeeSalaryEntrys: [],
          pagination: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch employeeSalaryEntrys',
        employeeSalaryEntrys: [],
        pagination: null,
      }));
    }
  }, [
    search, 
    sortBy, 
    sortOrder, 
    page, 
    limit, 
    showAll, 
    includeRelations, 
    ownerId,
    // Enhanced filter dependencies
    status,
    dateFrom,
    dateTo,
    workDateFrom,
    workDateTo,
    userId,
    employeeCode,
    employeeName,
    productId,
    productCode,
    productName,
    productionStepDetailId,
    stepName,
    planId,
  ]); // Enhanced dependency array for all filter parameters

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refresh,
  };
}

/**
 * Hook to fetch relation options for employeeSalaryEntry forms
 */
export function useEmployeeSalaryEntryRelationOptions() {
  const [data, setData] = useState<EmployeeSalaryEntryRelationOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRelationOptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/employeeSalaryEntries/relations/options');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        setError('Failed to load relation options');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelationOptions();
  }, [fetchRelationOptions]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchRelationOptions,
  };
}
