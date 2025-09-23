/**
 * Hook for managing production progress pivot data
 * Following Yamato-SaaS patterns and TDD practices
 */

import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import type {
  ProductionProgressPivotFilters,
  ProductionProgressPivotResponse,
  UseProductionProgressPivotResult,
} from '@/types/productionProgressPivot';

const BASE_URL = '/api/production-progress-pivot';

async function fetchProductionProgressPivot(
  params: ProductionProgressPivotFilters,
): Promise<ProductionProgressPivotResponse> {
  const searchParams = new URLSearchParams();

  // Add non-empty parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const url = `${BASE_URL}?${searchParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useProductionProgressPivot(
  params: ProductionProgressPivotFilters,
): UseProductionProgressPivotResult {
  const queryKey = ['production-progress-pivot', params];

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchProductionProgressPivot(params),
    staleTime: 30 * 1000, // Reduce to 30 seconds for more frequent updates
    refetchInterval: 60 * 1000, // Auto refetch every 60 seconds
    refetchOnWindowFocus: true, // Refetch when user comes back to window
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data: data?.data || [],
    summary: data?.summary || {
      total_records: 0,
      total_planned: 0,
      total_completed: 0,
      average_completion_rate: 0,
      products_count: 0,
      plans_count: 0,
    },
    pagination: data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false,
    },
    isLoading,
    isError,
    error: error as Error | null,
    refetch: handleRefetch,
  };
}
