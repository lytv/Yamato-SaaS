/**
 * OutsourceOrderReceipt mutation hooks with optimistic updates
 * Generated based on existing pattern from useOutsourceOrderDetailMutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import type {
  OutsourceOrderReceiptWithRelations,
  CreateOutsourceOrderReceiptInput,
  UpdateOutsourceOrderReceiptInput,
  OutsourceOrderReceiptResponse,
} from '@/types/outsourceOrderReceipt';
import { outsourceOrderReceiptKeys } from './useOutsourceOrderReceipts';
import { outsourceOrderDetailKeys } from './useOutsourceOrderDetails';

const API_BASE = '/api/outsourceOrderReceipts';

/**
 * Create outsourceOrderReceipt mutation
 */
export function useCreateOutsourceOrderReceipt() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<CreateOutsourceOrderReceiptInput, 'ownerId'>): Promise<OutsourceOrderReceiptWithRelations> => {
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
        throw new Error(error.error || `Failed to create outsourceOrderReceipt`);
      }

      const result: OutsourceOrderReceiptResponse = await response.json();
      return result.data;
    },
    onSuccess: (newOutsourceOrderReceipt) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: outsourceOrderReceiptKeys.all });
      
      // Optimistically update lists
      queryClient.setQueriesData(
        { queryKey: outsourceOrderReceiptKeys.lists() },
        (oldData: OutsourceOrderReceiptWithRelations[] | undefined) => {
          if (!oldData) return [newOutsourceOrderReceipt];
          return [newOutsourceOrderReceipt, ...oldData];
        }
      );

      // Update specific detail receipts list
      if (newOutsourceOrderReceipt.outsourceOrderDetailId) {
        queryClient.setQueriesData(
          { queryKey: outsourceOrderReceiptKeys.list({ outsourceOrderDetailId: newOutsourceOrderReceipt.outsourceOrderDetailId }) },
          (oldData: OutsourceOrderReceiptWithRelations[] | undefined) => {
            if (!oldData) return [newOutsourceOrderReceipt];
            return [newOutsourceOrderReceipt, ...oldData];
          }
        );
      }

      // Invalidate related data (parent detail stats)
      queryClient.invalidateQueries({ queryKey: outsourceOrderDetailKeys.all });
      if (newOutsourceOrderReceipt.outsourceOrderDetailId) {
        queryClient.invalidateQueries({ 
          queryKey: outsourceOrderReceiptKeys.statsByDetail(newOutsourceOrderReceipt.outsourceOrderDetailId) 
        });
      }

      toast.success('Receipt created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create receipt: ${error.message}`);
    },
  });
}

/**
 * Update outsourceOrderReceipt mutation
 */
export function useUpdateOutsourceOrderReceipt() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number; 
      data: UpdateOutsourceOrderReceiptInput 
    }): Promise<OutsourceOrderReceiptWithRelations> => {
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
        throw new Error(error.error || `Failed to update outsourceOrderReceipt`);
      }

      const result: OutsourceOrderReceiptResponse = await response.json();
      return result.data;
    },
    onSuccess: (updatedOutsourceOrderReceipt, { id }) => {
      // Update specific item in cache
      queryClient.setQueryData(
        outsourceOrderReceiptKeys.detail(id),
        updatedOutsourceOrderReceipt
      );

      // Update item in lists
      queryClient.setQueriesData(
        { queryKey: outsourceOrderReceiptKeys.lists() },
        (oldData: OutsourceOrderReceiptWithRelations[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(item => 
            item.id === id ? { ...item, ...updatedOutsourceOrderReceipt } : item
          );
        }
      );

      // Update specific detail receipts list
      if (updatedOutsourceOrderReceipt.outsourceOrderDetailId) {
        queryClient.setQueriesData(
          { queryKey: outsourceOrderReceiptKeys.list({ outsourceOrderDetailId: updatedOutsourceOrderReceipt.outsourceOrderDetailId }) },
          (oldData: OutsourceOrderReceiptWithRelations[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map(item => 
              item.id === id ? { ...item, ...updatedOutsourceOrderReceipt } : item
            );
          }
        );
      }

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: outsourceOrderReceiptKeys.stats() });
      queryClient.invalidateQueries({ queryKey: outsourceOrderDetailKeys.all });
      if (updatedOutsourceOrderReceipt.outsourceOrderDetailId) {
        queryClient.invalidateQueries({ 
          queryKey: outsourceOrderReceiptKeys.statsByDetail(updatedOutsourceOrderReceipt.outsourceOrderDetailId) 
        });
      }

      toast.success('Receipt updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update receipt: ${error.message}`);
    },
  });
}

/**
 * Delete outsourceOrderReceipt mutation
 */
export function useDeleteOutsourceOrderReceipt() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (id: number): Promise<{ id: number; outsourceOrderDetailId?: number }> => {
      if (!userId) throw new Error('User not authenticated');

      // Get current data to remember outsourceOrderDetailId for cache invalidation
      const currentData = queryClient.getQueryData<OutsourceOrderReceiptWithRelations>(
        outsourceOrderReceiptKeys.detail(id)
      );

      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete outsourceOrderReceipt`);
      }

      return { id, outsourceOrderDetailId: currentData?.outsourceOrderDetailId };
    },
    onSuccess: (result) => {
      const { id: deletedId, outsourceOrderDetailId } = result;

      // Remove from cache
      queryClient.removeQueries({ queryKey: outsourceOrderReceiptKeys.detail(deletedId) });

      // Remove from lists
      queryClient.setQueriesData(
        { queryKey: outsourceOrderReceiptKeys.lists() },
        (oldData: OutsourceOrderReceiptWithRelations[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(item => item.id !== deletedId);
        }
      );

      // Remove from specific detail receipts list
      if (outsourceOrderDetailId) {
        queryClient.setQueriesData(
          { queryKey: outsourceOrderReceiptKeys.list({ outsourceOrderDetailId }) },
          (oldData: OutsourceOrderReceiptWithRelations[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.filter(item => item.id !== deletedId);
          }
        );
      }

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: outsourceOrderReceiptKeys.stats() });
      queryClient.invalidateQueries({ queryKey: outsourceOrderDetailKeys.all });
      if (outsourceOrderDetailId) {
        queryClient.invalidateQueries({ 
          queryKey: outsourceOrderReceiptKeys.statsByDetail(outsourceOrderDetailId) 
        });
      }

      toast.success('Receipt deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete receipt: ${error.message}`);
    },
  });
}
