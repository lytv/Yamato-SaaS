/**
 * useProductionStepMutations Hook
 * Manages production step CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createProductionStep, deleteProductionStep, updateProductionStep } from '@/libs/api/productionSteps';
import type { ProductionStep, ProductionStepFormData, UpdateProductionStepInput } from '@/types/productionStep';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createProductionStep: (input: ProductionStepFormData) => Promise<ProductionStep>;
  updateProductionStep: (id: number, input: UpdateProductionStepInput) => Promise<ProductionStep>;
  deleteProductionStep: (id: number) => Promise<void>;
  clearError: () => void;
};

export function useProductionStepMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreateProductionStep = useCallback(async (input: ProductionStepFormData): Promise<ProductionStep> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const productionStep = await createProductionStep(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return productionStep;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create production step';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdateProductionStep = useCallback(async (id: number, input: UpdateProductionStepInput): Promise<ProductionStep> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const productionStep = await updateProductionStep(id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return productionStep;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update production step';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeleteProductionStep = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deleteProductionStep(id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete production step';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createProductionStep: handleCreateProductionStep,
    updateProductionStep: handleUpdateProductionStep,
    deleteProductionStep: handleDeleteProductionStep,
    clearError,
  };
}
