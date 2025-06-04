/**
 * useProducts Hook
 * Manages product data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchProducts } from '@/libs/api/products';
import type { Product, ProductListParams, ProductsResponse } from '@/types/product';

type ProductsState = {
  products: Product[];
  pagination: ProductsResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type ProductsReturn = ProductsState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<Omit<ProductListParams, 'search'>> & { search?: string } = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useProducts(params?: ProductListParams & { ownerId?: string }): ProductsReturn {
  const [state, setState] = useState<ProductsState>({
    products: [],
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
      const response = await fetchProducts(effectiveParams);

      setState({
        products: [...response.data],
        pagination: response.pagination || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        products: [],
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
