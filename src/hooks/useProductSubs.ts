/**
 * useProductSubs Hook
 * Manages productsub data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchProductSubs } from '@/libs/api/productsubs';
import type {
  ProductSub,
  ProductSubListParamsWithOwner,
  ProductSubsResponse,
} from '@/types/productsub';

type ProductSubsState = {
  productsubs: ProductSub[];
  pagination: ProductSubsResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type ProductSubsReturn = ProductSubsState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<
  Omit<ProductSubListParamsWithOwner, 'search' | 'ownerId' | 'showAll'>
> &
Pick<ProductSubListParamsWithOwner, 'search' | 'showAll'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  search: undefined,
  showAll: false,
};

export function useProductSubs({
  search = DEFAULT_PARAMS.search,
  sortBy = DEFAULT_PARAMS.sortBy,
  sortOrder = DEFAULT_PARAMS.sortOrder,
  page = DEFAULT_PARAMS.page,
  limit = DEFAULT_PARAMS.limit,
  ownerId,
  showAll = DEFAULT_PARAMS.showAll,
}: ProductSubListParamsWithOwner): ProductSubsReturn {
  const [state, setState] = useState<ProductSubsState>({
    productsubs: [],
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
      const result = await fetchProductSubs({
        search,
        sortBy,
        sortOrder,
        page,
        limit,
        showAll,
      });

      if (result.success) {
        setState({
          productsubs: [...result.data],
          pagination: result.pagination || null,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
          productsubs: [],
          pagination: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch productsubs',
        productsubs: [],
        pagination: null,
      }));
    }
  }, [search, sortBy, sortOrder, page, limit, showAll, ownerId]);

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
