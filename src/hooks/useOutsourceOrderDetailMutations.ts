/**
 * OutsourceOrderDetail mutation hooks with optimistic updates
 * Generated based on existing pattern from useOutsourceOrderMutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import type {
  OutsourceOrderDetailWithRelations,
  CreateOutsourceOrderDetailInput,
  UpdateOutsourceOrderDetailInput,
  OutsourceOrderDetailResponse,
} from '@/types/outsourceOrderDetail';
import { outsourceOrderDetailKeys } from './useOutsourceOrderDetails';
import { outsourceOrderKeys } from './useOutsourceOrders';

const API_BASE = '/api/outsourceOrderDetails';

/**
 * Create outsourceOrderDetail mutation
 */
export function useCreateOutsourceOrderDetail() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<CreateOutsourceOrderDetailInput, 'ownerId'>): Promise<OutsourceOrderDetailWithRelations> => {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to create outsourceOrderDetail`);
      }

      const result: OutsourceOrderDetailResponse = await response.json();
      return result.data;
    },
    onSuccess: (newOutsourceOrderDetail) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: outsourceOrderDetailKeys.all });
      
      // Optimistically update lists
      queryClient.setQueriesData(
        { queryKey: outsourceOrderDetailKeys.lists() },
        (oldData: OutsourceOrderDetailWithRelations[] | undefined) => {
          if (!oldData) return [newOutsourceOrderDetail];
          return [newOutsourceOrderDetail, ...oldData];
        }
      );

      // Update specific order details list
      if (newOutsourceOrderDetail.outsourceOrderId) {
        queryClient.setQueriesData(
          { queryKey: outsourceOrderDetailKeys.list({ outsourceOrderId: newOutsourceOrderDetail.outsourceOrderId }) },
          (oldData: OutsourceOrderDetailWithRelations[] | undefined) => {
            if (!oldData) return [newOutsourceOrderDetail];
            return [newOutsourceOrderDetail, ...oldData];
          }
        );
      }

      // Invalidate parent order stats
      queryClient.invalidateQueries({ queryKey: outsourceOrderKeys.stats() });
      if (newOutsourceOrderDetail.outsourceOrderId) {
        queryClient.invalidateQueries({ 
          queryKey: outsourceOrderDetailKeys.statsByOrder(newOutsourceOrderDetail.outsourceOrderId) 
        });
      }

      toast.success('OutsourceOrderDetail created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create outsourceOrderDetail: ${error.message}`);
    },
  });
}

/**
 * Update outsourceOrderDetail mutation
 */
export function useUpdateOutsourceOrderDetail() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number; 
      data: UpdateOutsourceOrderDetailInput 
    }): Promise<OutsourceOrderDetailWithRelations> => {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to update outsourceOrderDetail`);
      }

      const result: OutsourceOrderDetailResponse = await response.json();
      return result.data;
    },
    onSuccess: (updatedOutsourceOrderDetail, { id }) => {
      // Update specific item in cache
      queryClient.setQueryData(
        outsourceOrderDetailKeys.detail(id),
        updatedOutsourceOrderDetail
      );

      // Update item in lists
      queryClient.setQueriesData(
        { queryKey: outsourceOrderDetailKeys.lists() },
        (oldData: OutsourceOrderDetailWithRelations[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(item => 
            item.id === id ? { ...item, ...updatedOutsourceOrderDetail } : item
          );
        }
      );

      // Update specific order details list
      if (updatedOutsourceOrderDetail.outsourceOrderId) {
        queryClient.setQueriesData(
          { queryKey: outsourceOrderDetailKeys.list({ outsourceOrderId: updatedOutsourceOrderDetail.outsourceOrderId }) },
          (oldData: OutsourceOrderDetailWithRelations[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map(item => 
              item.id === id ? { ...item, ...updatedOutsourceOrderDetail } : item
            );
          }
        );
      }

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: outsourceOrderDetailKeys.stats() });
      queryClient.invalidateQueries({ queryKey: outsourceOrderKeys.stats() });
      if (updatedOutsourceOrderDetail.outsourceOrderId) {
        queryClient.invalidateQueries({ 
          queryKey: outsourceOrderDetailKeys.statsByOrder(updatedOutsourceOrderDetail.outsourceOrderId) 
        });
      }

      toast.success('OutsourceOrderDetail updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update outsourceOrderDetail: ${error.message}`);
    },
  });
}

/**
 * Delete outsourceOrderDetail mutation
 */
export function useDeleteOutsourceOrderDetail() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (id: number): Promise<{ id: number; outsourceOrderId?: number }> => {
      if (!userId) throw new Error('User not authenticated');

      // Get current data to remember outsourceOrderId for cache invalidation
      const currentData = queryClient.getQueryData<OutsourceOrderDetailWithRelations>(
        outsourceOrderDetailKeys.detail(id)
      );

      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete outsourceOrderDetail`);
      }

      return { id, outsourceOrderId: currentData?.outsourceOrderId };
    },
    onSuccess: (result) => {
      const { id: deletedId, outsourceOrderId } = result;

      // Remove from cache
      queryClient.removeQueries({ queryKey: outsourceOrderDetailKeys.detail(deletedId) });

      // Remove from lists
      queryClient.setQueriesData(
        { queryKey: outsourceOrderDetailKeys.lists() },
        (oldData: OutsourceOrderDetailWithRelations[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(item => item.id !== deletedId);
        }
      );

      // Remove from specific order details list
      if (outsourceOrderId) {
        queryClient.setQueriesData(
          { queryKey: outsourceOrderDetailKeys.list({ outsourceOrderId }) },
          (oldData: OutsourceOrderDetailWithRelations[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.filter(item => item.id !== deletedId);
          }
        );
      }

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: outsourceOrderDetailKeys.stats() });
      queryClient.invalidateQueries({ queryKey: outsourceOrderKeys.stats() });
      if (outsourceOrderId) {
        queryClient.invalidateQueries({ 
          queryKey: outsourceOrderDetailKeys.statsByOrder(outsourceOrderId) 
        });
      }

      toast.success('OutsourceOrderDetail deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete outsourceOrderDetail: ${error.message}`);
    },
  });
}
