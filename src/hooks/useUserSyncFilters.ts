/**
 * useUserSyncFilters Hook
 * Manages user_sync filtering and search state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { UserSyncFilters } from '@/types/user_sync';

type UserSyncFiltersReturn = UserSyncFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: UserSyncFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: UserSyncFilters['sortOrder']) => void;
  resetFilters: () => void;
};

const DEFAULT_FILTERS: UserSyncFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useUserSyncFilters(initialFilters?: Partial<UserSyncFilters>): UserSyncFiltersReturn {
  const [filters, setFilters] = useState<UserSyncFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: UserSyncFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: UserSyncFilters['sortOrder']) => {
    setFilters(prev => ({ ...prev, sortOrder }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    ...filters,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    resetFilters,
  };
}
