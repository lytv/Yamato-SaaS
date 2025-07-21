/**
 * useEmployeeDeliveryReceiptInventory Hook
 * Manages employee delivery receipt inventory data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchEmployeeDeliveryReceiptInventory } from '@/libs/api/employeeDeliveryReceiptInventory';
import type {
  EmployeeDeliveryReceiptInventoryItem,
  EmployeeDeliveryReceiptInventoryFilters,
  EmployeeDeliveryReceiptInventorySummary,
  EmployeeDeliveryReceiptInventoryResponse,
} from '@/types/employeeDeliveryReceiptInventory';

type EmployeeDeliveryReceiptInventoryState = {
  data: EmployeeDeliveryReceiptInventoryItem[];
  summary: EmployeeDeliveryReceiptInventorySummary | null;
  pagination: EmployeeDeliveryReceiptInventoryResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type EmployeeDeliveryReceiptInventoryReturn = EmployeeDeliveryReceiptInventoryState & {
  refresh: () => void;
  refetch: () => void;
};

const DEFAULT_PARAMS: Required<
  Omit<EmployeeDeliveryReceiptInventoryFilters, 'search' | 'plan_code' | 'product_code' | 'production_step_code' | 'employee_id'>
> &
Pick<EmployeeDeliveryReceiptInventoryFilters, 'search' | 'plan_code' | 'product_code' | 'production_step_code' | 'employee_id'> = {
  page: 1,
  limit: 20,
  sortBy: 'employee_name',
  sortOrder: 'asc',
  search: undefined,
  plan_code: undefined,
  product_code: undefined,
  production_step_code: undefined,
  employee_id: undefined,
};

export function useEmployeeDeliveryReceiptInventory(
  params: EmployeeDeliveryReceiptInventoryFilters = DEFAULT_PARAMS,
): EmployeeDeliveryReceiptInventoryReturn {
  const {
    search = DEFAULT_PARAMS.search,
    plan_code = DEFAULT_PARAMS.plan_code,
    product_code = DEFAULT_PARAMS.product_code,
    production_step_code = DEFAULT_PARAMS.production_step_code,
    employee_id = DEFAULT_PARAMS.employee_id,
    sortBy = DEFAULT_PARAMS.sortBy,
    sortOrder = DEFAULT_PARAMS.sortOrder,
    page = DEFAULT_PARAMS.page,
    limit = DEFAULT_PARAMS.limit,
  } = params;

  const [state, setState] = useState<EmployeeDeliveryReceiptInventoryState>({
    data: [],
    summary: null,
    pagination: null,
    isLoading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchEmployeeDeliveryReceiptInventory({
        search,
        plan_code,
        product_code,
        production_step_code,
        employee_id,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      if (result.success) {
        setState({
          data: [...result.data],
          summary: result.summary,
          pagination: result.pagination,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
          data: [],
          summary: null,
          pagination: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch employee delivery receipt inventory',
        data: [],
        summary: null,
        pagination: null,
      }));
    }
  }, [search, plan_code, product_code, production_step_code, employee_id, sortBy, sortOrder, page, limit]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
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