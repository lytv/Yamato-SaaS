/**
 * usePlanDetailMutations Hook
 * Manages plandetail CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createPlanDetail, deletePlanDetail, updatePlanDetail } from '@/libs/api/plandetails';
import type { CreatePlanDetailInput, PlanDetail, UpdatePlanDetailInput } from '@/types/plandetail';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createPlanDetail: (input: CreatePlanDetailInput) => Promise<PlanDetail>;
  updatePlanDetail: (id: number, input: UpdatePlanDetailInput) => Promise<PlanDetail>;
  deletePlanDetail: (id: number) => Promise<void>;
  clearError: () => void;
};

export function usePlanDetailMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreatePlanDetail = useCallback(async (input: CreatePlanDetailInput): Promise<PlanDetail> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const response = await createPlanDetail(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create plandetail';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdatePlanDetail = useCallback(async (id: number, input: UpdatePlanDetailInput): Promise<PlanDetail> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const response = await updatePlanDetail(id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update plandetail';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeletePlanDetail = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deletePlanDetail(id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete plandetail';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createPlanDetail: handleCreatePlanDetail,
    updatePlanDetail: handleUpdatePlanDetail,
    deletePlanDetail: handleDeletePlanDetail,
    clearError,
  };
}
