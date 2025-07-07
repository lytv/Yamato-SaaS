/**
 * useEmployeeSalaryEntrys Hook
 * Manages employeeSalaryEntry data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchEmployeeSalaryEntrys } from '@/libs/api/employeeSalaryEntries';
import type { EmployeeSalaryEntryListParamsWithOwner, EmployeeSalaryEntrysResponse, EmployeeSalaryEntryWithRelations } from '@/types/employeeSalaryEntry';

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

export function useEmployeeSalaryEntrys({
  search = DEFAULT_PARAMS.search,
  sortBy = DEFAULT_PARAMS.sortBy,
  sortOrder = DEFAULT_PARAMS.sortOrder,
  page = DEFAULT_PARAMS.page,
  limit = DEFAULT_PARAMS.limit,
  ownerId,
  showAll = DEFAULT_PARAMS.showAll,
  includeRelations = true, // 🆕 Add includeRelations parameter with default true
}: EmployeeSalaryEntryListParamsWithOwner & { includeRelations?: boolean }): EmployeeSalaryEntrysReturn {
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
        includeRelations, // 🆕 Add includeRelations parameter
        ownerId: ownerId || '', // luôn truyền ownerId
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
  }, [search, sortBy, sortOrder, page, limit, showAll, includeRelations, ownerId]); // 🆕 Add includeRelations to dependency array

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
