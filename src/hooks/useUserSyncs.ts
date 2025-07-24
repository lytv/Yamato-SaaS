/**
 * useUserSyncs Hook
 * Manages user_sync data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 * Uses primitive dependencies to prevent infinite loops
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchUserSyncs } from '@/libs/api/user_syncs';
import type {
  UserSync,
  UserSyncListParamsWithOwner,
  UserSyncsResponse,
} from '@/types/user_sync';

type UserSyncsState = {
  user_syncs: UserSync[];
  pagination: UserSyncsResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type UserSyncsReturn = UserSyncsState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<
  Omit<UserSyncListParamsWithOwner, 'search' | 'ownerId' | 'showAll'>
> &
Pick<UserSyncListParamsWithOwner, 'search' | 'showAll'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  search: undefined,
  showAll: false,
};

export function useUserSyncs({
  search = DEFAULT_PARAMS.search,
  sortBy = DEFAULT_PARAMS.sortBy,
  sortOrder = DEFAULT_PARAMS.sortOrder,
  page = DEFAULT_PARAMS.page,
  limit = DEFAULT_PARAMS.limit,
  ownerId,
  showAll = DEFAULT_PARAMS.showAll,
}: UserSyncListParamsWithOwner): UserSyncsReturn {
  const [state, setState] = useState<UserSyncsState>({
    user_syncs: [],
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
      const result = await fetchUserSyncs({
        search,
        sortBy,
        sortOrder,
        page,
        limit,
        showAll,
      });

      if (result.success) {
        setState({
          user_syncs: [...result.data],
          pagination: result.pagination || null,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
          user_syncs: [],
          pagination: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user_syncs',
        user_syncs: [],
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
