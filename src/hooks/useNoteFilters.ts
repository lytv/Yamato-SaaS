/**
 * useNoteFilters Hook
 * Manages note filtering and search state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { NoteFilters } from '@/types/note';

type NoteFiltersReturn = NoteFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: NoteFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: NoteFilters['sortOrder']) => void;
  resetFilters: () => void;
};

const DEFAULT_FILTERS: NoteFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useNoteFilters(initialFilters?: Partial<NoteFilters>): NoteFiltersReturn {
  const [filters, setFilters] = useState<NoteFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: NoteFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: NoteFilters['sortOrder']) => {
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
