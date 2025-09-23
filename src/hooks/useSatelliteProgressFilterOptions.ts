/**
 * Satellite Progress Filter Options Hook
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';

import type { SatelliteProgressFilterOptions } from '@/types/satelliteProgress';

/**
 * Custom hook for fetching satellite progress filter options
 * @returns Query result with filter options for dropdowns
 */
export function useSatelliteProgressFilterOptions() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['satellite-progress-filter-options', userId],
    queryFn: async (): Promise<SatelliteProgressFilterOptions> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/satellite-progress/filter-options', {
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
        throw new Error(result.error || 'Failed to fetch satellite progress filter options');
      }

      return result.data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes (filter options don't change often)
    retry: (failureCount, error: any) => {
      // Retry up to 5 times for connection pool errors
      if (error?.message?.includes('too many clients') && failureCount < 5) {
        return true;
      }
      // Regular retry for other errors (max 3 times)
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Longer delay for connection pool errors
      const baseDelay = 1000 * (2 ** attemptIndex);
      return Math.min(baseDelay, 10000);
    },
  });
}
