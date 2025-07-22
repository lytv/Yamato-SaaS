/**
 * Production Progress Report React Hook
 * Following Yamato-SaaS patterns and React Query standards
 */

import { useQuery } from '@tanstack/react-query';

import type {
  ProductionProgressReportFilters,
  ProductionProgressReportResponse,
  UseProductionProgressReportResult,
} from '@/types/productionProgressReport';

/**
 * Hook for fetching production progress report data
 * @param filters - Filter parameters for the report
 * @returns Query result with data, loading state, and error handling
 */
export function useProductionProgressReport(
  filters: ProductionProgressReportFilters,
): UseProductionProgressReportResult {
  const query = useQuery({
    queryKey: ['production-progress-report', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      // Add filter parameters to search params
      if (filters.search) searchParams.set('search', filters.search);
      if (filters.plan_code) searchParams.set('plan_code', filters.plan_code);
      if (filters.product_code) searchParams.set('product_code', filters.product_code);
      if (filters.production_step_code) searchParams.set('production_step_code', filters.production_step_code);
      if (filters.report_type && filters.report_type !== 'ALL') searchParams.set('report_type', filters.report_type);
      if (filters.page) searchParams.set('page', filters.page.toString());
      if (filters.limit) searchParams.set('limit', filters.limit.toString());
      if (filters.sortBy) searchParams.set('sortBy', filters.sortBy);
      if (filters.sortOrder) searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/production-progress-report?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch production progress report');
      }

      const data: ProductionProgressReportResponse = await response.json();
      return data;
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: query.data?.data || [],
    summary: query.data?.summary || {
      total_records: 0,
      total_entities: 0,
      total_planned: 0,
      total_actual: 0,
      total_assigned: 0,
      total_received: 0,
      total_defect: 0,
      total_made: 0,
      average_completion_rate: 0,
      employee_count: 0,
      outsource_count: 0,
    },
    pagination: query.data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}