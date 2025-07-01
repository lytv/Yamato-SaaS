/**
 * useProductSubMutations Hook
 * Manages productsub CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createProductSub, deleteProductSub, updateProductSub } from '@/libs/api/productsubs';
import type { ProductSub, ProductSubFormData, UpdateProductSubInput } from '@/types/productsub';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createProductSub: (input: ProductSubFormData) => Promise<ProductSub>;
  updateProductSub: (id: number, input: UpdateProductSubInput) => Promise<ProductSub>;
  deleteProductSub: (id: number) => Promise<void>;
  clearError: () => void;
};

export function useProductSubMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreateProductSub = useCallback(async (input: ProductSubFormData): Promise<ProductSub> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const productsub = await createProductSub(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return productsub;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create productsub';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdateProductSub = useCallback(async (id: number, input: UpdateProductSubInput): Promise<ProductSub> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const productsub = await updateProductSub(id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return productsub;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update productsub';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeleteProductSub = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deleteProductSub(id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete productsub';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createProductSub: handleCreateProductSub,
    updateProductSub: handleUpdateProductSub,
    deleteProductSub: handleDeleteProductSub,
    clearError,
  };
}
