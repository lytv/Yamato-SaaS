/**
 * useProductionSteps Hook
 * Manages production step data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchProductionSteps } from '@/libs/api/productionSteps';
import type { ProductionStep, ProductionStepListParams, ProductionStepsResponse } from '@/types/productionStep';

type ProductionStepsState = {
  productionSteps: ProductionStep[];
  pagination: ProductionStepsResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type ProductionStepsReturn = ProductionStepsState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<Omit<ProductionStepListParams, 'search'>> & { search?: string } = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useProductionSteps(params?: ProductionStepListParams & { ownerId?: string }): ProductionStepsReturn {
  const [state, setState] = useState<ProductionStepsState>({
    productionSteps: [],
    pagination: null,
    isLoading: false,
    error: null,
  });

  // ✅ Extract primitive values to prevent infinite loops (critical fix from todos)
  const page = params?.page ?? DEFAULT_PARAMS.page;
  const limit = params?.limit ?? DEFAULT_PARAMS.limit;
  const search = params?.search ?? DEFAULT_PARAMS.search;
  const sortBy = params?.sortBy ?? DEFAULT_PARAMS.sortBy;
  const sortOrder = params?.sortOrder ?? DEFAULT_PARAMS.sortOrder;
  const ownerId = params?.ownerId ?? '';

  const fetchData = useCallback(async () => {
    if (!ownerId) {
      // Don't fetch without ownerId - prevents unauthorized access
      setState(prev => ({ ...prev, isLoading: false, error: null }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // ✅ Build params from primitives (not object reference)
      const effectiveParams = { page, limit, search, sortBy, sortOrder, ownerId };
      const response = await fetchProductionSteps(effectiveParams);

      setState({
        productionSteps: [...response.data],
        pagination: response.pagination || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch production steps',
        productionSteps: [],
        pagination: null,
      }));
    }
  }, [page, limit, search, sortBy, sortOrder, ownerId]); // ✅ Primitive dependencies only

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
