/**
 * useProductionStepDetailMutations Hook
 * Manages production step detail CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createProductionStepDetail, deleteProductionStepDetail, updateProductionStepDetail } from '@/libs/api/productionStepDetails';
import type { ProductionStepDetail, ProductionStepDetailFormData, UpdateProductionStepDetailInput } from '@/types/productionStepDetail';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createProductionStepDetail: (input: ProductionStepDetailFormData) => Promise<ProductionStepDetail>;
  updateProductionStepDetail: (id: number, input: UpdateProductionStepDetailInput) => Promise<ProductionStepDetail>;
  deleteProductionStepDetail: (id: number) => Promise<void>;
  clearError: () => void;
};

export function useProductionStepDetailMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreateProductionStepDetail = useCallback(async (input: ProductionStepDetailFormData): Promise<ProductionStepDetail> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const productionStepDetail = await createProductionStepDetail(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return productionStepDetail;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create production step detail';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdateProductionStepDetail = useCallback(async (id: number, input: UpdateProductionStepDetailInput): Promise<ProductionStepDetail> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const productionStepDetail = await updateProductionStepDetail(id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return productionStepDetail;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update production step detail';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeleteProductionStepDetail = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deleteProductionStepDetail(id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete production step detail';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createProductionStepDetail: handleCreateProductionStepDetail,
    updateProductionStepDetail: handleUpdateProductionStepDetail,
    deleteProductionStepDetail: handleDeleteProductionStepDetail,
    clearError,
  };
}
