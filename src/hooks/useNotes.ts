/**
 * useNotes Hook
 * Manages note data fetching, pagination, and state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchNotes } from '@/libs/api/notes';
import type { Note, NoteListParams, NotesResponse } from '@/types/note';

type NotesState = {
  notes: Note[];
  pagination: NotesResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type NotesReturn = NotesState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Omit<NoteListParams, 'ownerId'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useNotes(params?: Omit<NoteListParams, 'ownerId'>): NotesReturn {
  const [state, setState] = useState<NotesState>({
    notes: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  // ✅ Extract primitive values to prevent infinite loops (critical fix from todos)
  const page = params?.page ?? DEFAULT_PARAMS.page;
  const limit = params?.limit ?? DEFAULT_PARAMS.limit;
  const search = params?.search ?? DEFAULT_PARAMS.search;
  const sortBy = params?.sortBy ?? DEFAULT_PARAMS.sortBy;
  const sortOrder = params?.sortOrder ?? DEFAULT_PARAMS.sortOrder;

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const effectiveParams = { page, limit, search, sortBy, sortOrder };
      const response = await fetchNotes(effectiveParams);

      setState({
        notes: response.data,
        pagination: response.pagination || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        notes: [],
        pagination: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [page, limit, search, sortBy, sortOrder]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refresh };
}
