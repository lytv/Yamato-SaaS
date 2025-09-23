/**
 * Production Progress Report Filter Options Hook
 * Following Yamato-SaaS patterns for filter options fetching
 */

import { useQuery } from '@tanstack/react-query';

import type {
  ProductionProgressReportFilterOptions,
  ProductionProgressReportFilterOptionsResponse,
} from '@/types/productionProgressReport';

/**
 * Hook for fetching production progress report filter options
 * @returns Query result with filter options for dropdowns
 */
export function useProductionProgressReportFilterOptions() {
  return useQuery({
    queryKey: ['production-progress-report-filter-options'],
    queryFn: async (): Promise<ProductionProgressReportFilterOptions> => {
      const response = await fetch('/api/production-progress-report/filter-options');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch filter options');
      }

      const data: ProductionProgressReportFilterOptionsResponse = await response.json();
      return data.data;
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes - filter options don't change frequently
  });
}
