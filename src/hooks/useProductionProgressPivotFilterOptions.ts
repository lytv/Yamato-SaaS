/**
 * Hook for fetching production progress pivot filter options
 * Following Yamato-SaaS patterns and TDD practices
 */

import { useQuery } from '@tanstack/react-query';

import type { ProductionProgressPivotFilterOptionsResponse } from '@/types/productionProgressPivot';

const FILTER_OPTIONS_URL = '/api/production-progress-pivot/filter-options';

async function fetchFilterOptions(): Promise<ProductionProgressPivotFilterOptionsResponse> {
  const response = await fetch(FILTER_OPTIONS_URL);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useProductionProgressPivotFilterOptions() {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['production-progress-pivot-filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data: data?.data || {
      plans: [],
      products: [],
      steps: [],
    },
    isLoading,
    isError,
    error: error as Error | null,
  };
}