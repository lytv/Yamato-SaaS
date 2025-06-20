/**
 * useProducts Hook
 * Manages product data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchProducts } from '@/libs/api/products';
import type {
  Product,
  ProductListParamsWithOwner,
  ProductsResponse,
} from '@/types/product';

type ProductsState = {
  products: Product[];
  pagination: ProductsResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type ProductsReturn = ProductsState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<
  Omit<ProductListParamsWithOwner, 'search' | 'ownerId' | 'showAll'>
> &
Pick<ProductListParamsWithOwner, 'search' | 'showAll'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  search: undefined,
  showAll: false,
};

export function useProducts({
  search = DEFAULT_PARAMS.search,
  sortBy = DEFAULT_PARAMS.sortBy,
  sortOrder = DEFAULT_PARAMS.sortOrder,
  page = DEFAULT_PARAMS.page,
  limit = DEFAULT_PARAMS.limit,
  ownerId,
  showAll = DEFAULT_PARAMS.showAll,
}: ProductListParamsWithOwner): ProductsReturn {
  const [state, setState] = useState<ProductsState>({
    products: [],
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
      const result = await fetchProducts({
        search,
        sortBy,
        sortOrder,
        page,
        limit,
        showAll,
      });

      if (result.success) {
        setState({
          products: [...result.data],
          pagination: result.pagination || null,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
          products: [],
          pagination: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        products: [],
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
