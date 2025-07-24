/**
 * usePlans Hook
 * Manages plan data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchPlans } from '@/libs/api/plans';
import type {
  Plan,
  PlanListParamsWithOwner,
  PlansResponse,
} from '@/types/plan';

type PlansState = {
  plans: Plan[];
  pagination: PlansResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type PlansReturn = PlansState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<
  Omit<PlanListParamsWithOwner, 'search' | 'ownerId' | 'showAll'>
> &
Pick<PlanListParamsWithOwner, 'search' | 'showAll'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  search: undefined,
  showAll: false,
};

export function usePlans({
  search = DEFAULT_PARAMS.search,
  sortBy = DEFAULT_PARAMS.sortBy,
  sortOrder = DEFAULT_PARAMS.sortOrder,
  page = DEFAULT_PARAMS.page,
  limit = DEFAULT_PARAMS.limit,
  ownerId,
  showAll = DEFAULT_PARAMS.showAll,
}: PlanListParamsWithOwner): PlansReturn {
  const [state, setState] = useState<PlansState>({
    plans: [],
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
      const result = await fetchPlans({
        search,
        sortBy,
        sortOrder,
        page,
        limit,
        showAll,
      });

      if (result.success) {
        setState({
          plans: [...result.data],
          pagination: result.pagination || null,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
          plans: [],
          pagination: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch plans',
        plans: [],
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
