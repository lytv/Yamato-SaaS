/**
 * Satellite Progress Data Fetching Hook
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

import type {
  SatelliteProgressFilters,
  SatelliteProgressItem,
  SatelliteProgressSummary,
  SatelliteProgressPagination,
  UseSatelliteProgressResult,
} from '@/types/satelliteProgress';

/**
 * Custom hook for fetching satellite progress data
 * @param filters - Filter parameters for the query
 * @returns Query result with data, loading state, and error handling
 */
export function useSatelliteProgress(
  filters: SatelliteProgressFilters,
): UseSatelliteProgressResult {
  const { userId } = useAuth();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['satellite-progress', filters, userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const queryParams = new URLSearchParams();
      
      // Add non-empty filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/satellite-progress?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch satellite progress data');
      }

      return {
        data: result.data as SatelliteProgressItem[],
        summary: result.summary as SatelliteProgressSummary,
        pagination: result.pagination as SatelliteProgressPagination,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data: data?.data || [],
    summary: data?.summary || {
      total_records: 0,
      total_planned: 0,
      total_completed: 0,
      average_completion_rate: 0,
      users_count: 0,
      plans_count: 0,
    },
    pagination: data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false,
    },
    isLoading,
    isError: !!error,
    error: error as Error | null,
    refetch,
  };
}