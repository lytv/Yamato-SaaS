/**
 * useProductionStepDetails Hook
 * Manages production step detail data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchProductionStepDetails } from '@/libs/api/productionStepDetails';
import type { ProductionStepDetail, ProductionStepDetailListParams, ProductionStepDetailsResponse } from '@/types/productionStepDetail';

type ProductionStepDetailsState = {
  productionStepDetails: ProductionStepDetail[];
  pagination: ProductionStepDetailsResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type ProductionStepDetailsReturn = ProductionStepDetailsState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<Omit<ProductionStepDetailListParams, 'search' | 'productId' | 'productionStepId'>> & {
  search?: string;
  productId?: number;
  productionStepId?: number;
} = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useProductionStepDetails(params?: ProductionStepDetailListParams & { ownerId?: string }): ProductionStepDetailsReturn {
  const [state, setState] = useState<ProductionStepDetailsState>({
    productionStepDetails: [],
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
  const productId = params?.productId ?? DEFAULT_PARAMS.productId;
  const productionStepId = params?.productionStepId ?? DEFAULT_PARAMS.productionStepId;
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
      const effectiveParams = {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        productId,
        productionStepId,
        ownerId,
      };

      const response = await fetchProductionStepDetails(effectiveParams);

      setState({
        productionStepDetails: [...response.data],
        pagination: response.pagination || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch production step details',
        productionStepDetails: [],
        pagination: null,
      }));
    }
  }, [page, limit, search, sortBy, sortOrder, productId, productionStepId, ownerId]); // ✅ Primitive dependencies only

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
