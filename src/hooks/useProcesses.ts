/**
 * useProcesss Hook
 * Manages process data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchProcesss } from '@/libs/api/processes';
import type {
  Process,
  ProcessListParamsWithOwner,
  ProcesssResponse,
} from '@/types/process';

type ProcesssState = {
  processs: Process[];
  pagination: ProcesssResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type ProcesssReturn = ProcesssState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<
  Omit<ProcessListParamsWithOwner, 'search' | 'ownerId' | 'showAll'>
> &
Pick<ProcessListParamsWithOwner, 'search' | 'showAll'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  search: undefined,
  showAll: false,
};

export function useProcesses({
  search = DEFAULT_PARAMS.search,
  sortBy = DEFAULT_PARAMS.sortBy,
  sortOrder = DEFAULT_PARAMS.sortOrder,
  page = DEFAULT_PARAMS.page,
  limit = DEFAULT_PARAMS.limit,
  ownerId,
  showAll = DEFAULT_PARAMS.showAll,
}: ProcessListParamsWithOwner): ProcesssReturn {
  const [state, setState] = useState<ProcesssState>({
    processs: [],
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
      const result = await fetchProcesss({
        search,
        sortBy,
        sortOrder,
        page,
        limit,
        showAll,
      });

      if (result.success) {
        setState({
          processs: [...result.data],
          pagination: result.pagination || null,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
          processs: [],
          pagination: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch processs',
        processs: [],
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
