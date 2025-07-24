/**
 * usePlanMutations Hook
 * Manages plan CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createPlan, deletePlan, updatePlan } from '@/libs/api/plans';
import type { Plan, PlanFormData, UpdatePlanInput } from '@/types/plan';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createPlan: (input: PlanFormData) => Promise<Plan>;
  updatePlan: (id: number, input: UpdatePlanInput) => Promise<Plan>;
  deletePlan: (id: number) => Promise<void>;
  clearError: () => void;
};

export function usePlanMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreatePlan = useCallback(async (input: PlanFormData): Promise<Plan> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const plan = await createPlan(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return plan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create plan';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdatePlan = useCallback(async (id: number, input: UpdatePlanInput): Promise<Plan> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const plan = await updatePlan(id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return plan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update plan';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeletePlan = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deletePlan(id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete plan';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createPlan: handleCreatePlan,
    updatePlan: handleUpdatePlan,
    deletePlan: handleDeletePlan,
    clearError,
  };
}
