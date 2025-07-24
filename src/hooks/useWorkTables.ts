import { useCallback, useEffect, useState } from 'react';

import { fetchWorkTables } from '@/libs/api/workTables';
import type { WorkTable, WorkTableListParams, WorkTablesResponse } from '@/types/workTable';

type WorkTablesState = {
  workTables: WorkTable[];
  pagination: WorkTablesResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type WorkTablesReturn = WorkTablesState & {
  refresh: () => void;
};

const DEFAULT_PARAMS: Omit<WorkTableListParams, 'ownerId'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useWorkTables(params?: Omit<WorkTableListParams, 'ownerId'>): WorkTablesReturn {
  const [state, setState] = useState<WorkTablesState>({
    workTables: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  const page = params?.page ?? DEFAULT_PARAMS.page;
  const limit = params?.limit ?? DEFAULT_PARAMS.limit;
  const search = params?.search ?? DEFAULT_PARAMS.search;
  const sortBy = params?.sortBy ?? DEFAULT_PARAMS.sortBy;
  const sortOrder = params?.sortOrder ?? DEFAULT_PARAMS.sortOrder;

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const effectiveParams = { page, limit, search, sortBy, sortOrder };
      const response = await fetchWorkTables(effectiveParams);

      setState({
        workTables: response.data,
        pagination: response.pagination || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        workTables: [],
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

  return {
    ...state,
    refresh,
  };
}
