/**
 * OutsourceOrderReceipt data fetching hook with enhanced features
 * Generated based on existing pattern from useOutsourceOrderDetails
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

import type {
  OutsourceOrderReceiptWithRelations,
  OutsourceOrderReceiptListParams,
  OutsourceOrderReceiptStats,
  OutsourceOrderReceiptsResponse,
  OutsourceOrderReceiptStatsResponse,
  OutsourceOrderReceiptRelationOptions,
} from '@/types/outsourceOrderReceipt';

const API_BASE = '/api/outsourceOrderReceipts';

// Query key factory
export const outsourceOrderReceiptKeys = {
  all: ['outsourceOrderReceipts'] as const,
  lists: () => [...outsourceOrderReceiptKeys.all, 'list'] as const,
  list: (params: OutsourceOrderReceiptListParams) => 
    [...outsourceOrderReceiptKeys.lists(), params] as const,
  details: () => [...outsourceOrderReceiptKeys.all, 'detail'] as const,
  detail: (id: number) => [...outsourceOrderReceiptKeys.details(), id] as const,
  stats: () => [...outsourceOrderReceiptKeys.all, 'stats'] as const,
  statsByDetail: (outsourceOrderDetailId: number) => [...outsourceOrderReceiptKeys.stats(), 'byDetail', outsourceOrderDetailId] as const,
  relations: () => [...outsourceOrderReceiptKeys.all, 'relations'] as const,
  relationOptions: () => [...outsourceOrderReceiptKeys.relations(), 'options'] as const,
} as const;

/**
 * Fetch outsourceOrderReceipts with pagination and filtering
 */
export function useOutsourceOrderReceipts(params: OutsourceOrderReceiptListParams = {}) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: outsourceOrderReceiptKeys.list(params),
    queryFn: async (): Promise<OutsourceOrderReceiptWithRelations[]> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      Object.entries({ ...params, includeRelations: true }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE}?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch outsourceOrderReceipts: ${response.statusText}`);
      }

      const result: OutsourceOrderReceiptsResponse = await response.json();
      return result.data as OutsourceOrderReceiptWithRelations[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Infinite scroll hook for outsourceOrderReceipts
 */
export function useOutsourceOrderReceiptsInfinite(params: Omit<OutsourceOrderReceiptListParams, 'page'> = {}) {
  const { userId } = useAuth();

  return useInfiniteQuery({
    queryKey: [...outsourceOrderReceiptKeys.list(params), 'infinite'],
    queryFn: async ({ pageParam = 1 }): Promise<OutsourceOrderReceiptsResponse> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      Object.entries({ ...params, page: pageParam }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE}?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch outsourceOrderReceipts: ${response.statusText}`);
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
 * Fetch single outsourceOrderReceipt by ID
 */
export function useOutsourceOrderReceipt(id: number, includeRelations = false) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: outsourceOrderReceiptKeys.detail(id),
    queryFn: async (): Promise<OutsourceOrderReceiptWithRelations> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      if (includeRelations) {
        searchParams.append('includeRelations', 'true');
      }

      const response = await fetch(`${API_BASE}/${id}?${searchParams}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('OutsourceOrderReceipt not found');
        }
        throw new Error(`Failed to fetch outsourceOrderReceipt: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!userId && !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch outsourceOrderReceipts by outsourceOrderDetailId
 */
export function useOutsourceOrderReceiptsByDetailId(outsourceOrderDetailId: number, includeRelations = true) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: outsourceOrderReceiptKeys.list({ outsourceOrderDetailId, includeRelations }),
    queryFn: async (): Promise<OutsourceOrderReceiptWithRelations[]> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      searchParams.append('outsourceOrderDetailId', String(outsourceOrderDetailId));
      if (includeRelations) {
        searchParams.append('includeRelations', 'true');
      }

      const response = await fetch(`${API_BASE}?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch outsourceOrderReceipts: ${response.statusText}`);
      }

      const result: OutsourceOrderReceiptsResponse = await response.json();
      return result.data as OutsourceOrderReceiptWithRelations[];
    },
    enabled: !!userId && !!outsourceOrderDetailId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch outsourceOrderReceipt statistics
 */
export function useOutsourceOrderReceiptStats(outsourceOrderDetailId?: number) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: outsourceOrderDetailId 
      ? outsourceOrderReceiptKeys.statsByDetail(outsourceOrderDetailId)
      : outsourceOrderReceiptKeys.stats(),
    queryFn: async (): Promise<OutsourceOrderReceiptStats> => {
      if (!userId) throw new Error('User not authenticated');

      const url = outsourceOrderDetailId 
        ? `${API_BASE}/stats?outsourceOrderDetailId=${outsourceOrderDetailId}`
        : `${API_BASE}/stats`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch outsourceOrderReceipt stats: ${response.statusText}`);
      }

      const result: OutsourceOrderReceiptStatsResponse = await response.json();
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
export function useOutsourceOrderReceiptRelationOptions(outsourceOrderDetailId?: number) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: outsourceOrderReceiptKeys.relationOptions(),
    queryFn: async (): Promise<OutsourceOrderReceiptRelationOptions> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      if (outsourceOrderDetailId) {
        searchParams.append('outsourceOrderDetailId', String(outsourceOrderDetailId));
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
