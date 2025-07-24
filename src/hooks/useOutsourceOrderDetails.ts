/**
 * OutsourceOrderDetail data fetching hook with enhanced features
 * Generated based on existing pattern from useOutsourceOrders
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

import type {
  OutsourceOrderDetailWithRelations,
  OutsourceOrderDetailListParams,
  OutsourceOrderDetailStats,
  OutsourceOrderDetailsResponse,
  OutsourceOrderDetailStatsResponse,
  OutsourceOrderDetailRelationOptions,
} from '@/types/outsourceOrderDetail';

const API_BASE = '/api/outsourceOrderDetails';

// Query key factory
export const outsourceOrderDetailKeys = {
  all: ['outsourceOrderDetails'] as const,
  lists: () => [...outsourceOrderDetailKeys.all, 'list'] as const,
  list: (params: OutsourceOrderDetailListParams) => 
    [...outsourceOrderDetailKeys.lists(), params] as const,
  details: () => [...outsourceOrderDetailKeys.all, 'detail'] as const,
  detail: (id: number) => [...outsourceOrderDetailKeys.details(), id] as const,
  stats: () => [...outsourceOrderDetailKeys.all, 'stats'] as const,
  statsByOrder: (outsourceOrderId: number) => [...outsourceOrderDetailKeys.stats(), 'byOrder', outsourceOrderId] as const,
  relations: () => [...outsourceOrderDetailKeys.all, 'relations'] as const,
  relationOptions: () => [...outsourceOrderDetailKeys.relations(), 'options'] as const,
} as const;

/**
 * Fetch outsourceOrderDetails with pagination and filtering
 */
export function useOutsourceOrderDetails(params: OutsourceOrderDetailListParams = {}) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: outsourceOrderDetailKeys.list(params),
    queryFn: async (): Promise<OutsourceOrderDetailWithRelations[]> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      Object.entries({ ...params, includeRelations: true }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE}?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch outsourceOrderDetails: ${response.statusText}`);
      }

      const result: OutsourceOrderDetailsResponse = await response.json();
      return result.data as OutsourceOrderDetailWithRelations[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Infinite scroll hook for outsourceOrderDetails
 */
export function useOutsourceOrderDetailsInfinite(params: Omit<OutsourceOrderDetailListParams, 'page'> = {}) {
  const { userId } = useAuth();

  return useInfiniteQuery({
    queryKey: [...outsourceOrderDetailKeys.list(params), 'infinite'],
    queryFn: async ({ pageParam = 1 }): Promise<OutsourceOrderDetailsResponse> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      Object.entries({ ...params, page: pageParam }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE}?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch outsourceOrderDetails: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!userId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch single outsourceOrderDetail by ID
 */
export function useOutsourceOrderDetail(id: number, includeRelations = false) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: outsourceOrderDetailKeys.detail(id),
    queryFn: async (): Promise<OutsourceOrderDetailWithRelations> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      if (includeRelations) {
        searchParams.append('includeRelations', 'true');
      }

      const response = await fetch(`${API_BASE}/${id}?${searchParams}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('OutsourceOrderDetail not found');
        }
        throw new Error(`Failed to fetch outsourceOrderDetail: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!userId && !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch outsourceOrderDetails by outsourceOrderId
 */
export function useOutsourceOrderDetailsByOrderId(outsourceOrderId: number, includeRelations = true) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: outsourceOrderDetailKeys.list({ outsourceOrderId, includeRelations }),
    queryFn: async (): Promise<OutsourceOrderDetailWithRelations[]> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      searchParams.append('outsourceOrderId', String(outsourceOrderId));
      if (includeRelations) {
        searchParams.append('includeRelations', 'true');
      }

      const response = await fetch(`${API_BASE}?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch outsourceOrderDetails: ${response.statusText}`);
      }

      const result: OutsourceOrderDetailsResponse = await response.json();
      return result.data as OutsourceOrderDetailWithRelations[];
    },
    enabled: !!userId && !!outsourceOrderId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch outsourceOrderDetail statistics
 */
export function useOutsourceOrderDetailStats(outsourceOrderId?: number) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: outsourceOrderId 
      ? outsourceOrderDetailKeys.statsByOrder(outsourceOrderId)
      : outsourceOrderDetailKeys.stats(),
    queryFn: async (): Promise<OutsourceOrderDetailStats> => {
      if (!userId) throw new Error('User not authenticated');

      const url = outsourceOrderId 
        ? `${API_BASE}/stats?outsourceOrderId=${outsourceOrderId}`
        : `${API_BASE}/stats`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch outsourceOrderDetail stats: ${response.statusText}`);
      }

      const result: OutsourceOrderDetailStatsResponse = await response.json();
      return result.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch relation options for dropdowns and selectors
 */
export function useOutsourceOrderDetailRelationOptions(outsourceOrderId?: number) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: outsourceOrderDetailKeys.relationOptions(),
    queryFn: async (): Promise<OutsourceOrderDetailRelationOptions> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      if (outsourceOrderId) {
        searchParams.append('outsourceOrderId', String(outsourceOrderId));
      }

      const response = await fetch(`${API_BASE}/relations/options?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch relation options: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
