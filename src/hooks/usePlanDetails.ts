/**
 * usePlanDetails Hook
 * Manages plandetail data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchPlanDetails } from '@/libs/api/plandetails';
import type {
  PlanDetail,
  PlanDetailListParamsWithOwner,
  PlanDetailsResponse,
} from '@/types/plandetail';

type PlanDetailsState = {
  plandetails: PlanDetail[];
  pagination: PlanDetailsResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type PlanDetailsReturn = PlanDetailsState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<
  Omit<PlanDetailListParamsWithOwner, 'search' | 'planCode' | 'productCode' | 'productName' | 'ownerId' | 'showAll'>
> & Pick<PlanDetailListParamsWithOwner, 'search' | 'planCode' | 'productCode' | 'productName' | 'showAll'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  search: undefined,
  planCode: undefined,
  productCode: undefined,
  productName: undefined,
  showAll: false,
  includeRelations: false,
};

export function usePlanDetails({
  search = DEFAULT_PARAMS.search,
  planCode = DEFAULT_PARAMS.planCode,
  productCode = DEFAULT_PARAMS.productCode,  
  productName = DEFAULT_PARAMS.productName,
  sortBy = DEFAULT_PARAMS.sortBy,
  sortOrder = DEFAULT_PARAMS.sortOrder,
  page = DEFAULT_PARAMS.page,
  limit = DEFAULT_PARAMS.limit,
  ownerId,
  showAll = DEFAULT_PARAMS.showAll,
}: PlanDetailListParamsWithOwner): PlanDetailsReturn {
  const [state, setState] = useState<PlanDetailsState>({
    plandetails: [],
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
      const result = await fetchPlanDetails({
        search,
        planCode,
        productCode,
        productName,
        sortBy,
        sortOrder,
        page,
        limit,
        showAll,
        ownerId,
        includeRelations: true,
      });

      setState({
        plandetails: [...result.data],
        pagination: result.pagination || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch plandetails',
        plandetails: [],
        pagination: null,
      }));
    }
  }, [search, planCode, productCode, productName, sortBy, sortOrder, page, limit, showAll, ownerId]);

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
