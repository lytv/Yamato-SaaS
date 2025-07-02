/**
 * useProcessMutations Hook
 * Manages process CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createProcess, deleteProcess, updateProcess } from '@/libs/api/processes';
import type { Process, ProcessFormData, UpdateProcessInput } from '@/types/process';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createProcess: (input: ProcessFormData) => Promise<Process>;
  updateProcess: (id: number, input: UpdateProcessInput) => Promise<Process>;
  deleteProcess: (id: number) => Promise<void>;
  clearError: () => void;
};

export function useProcessMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreateProcess = useCallback(async (input: ProcessFormData): Promise<Process> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const process = await createProcess(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return process;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create process';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdateProcess = useCallback(async (id: number, input: UpdateProcessInput): Promise<Process> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const process = await updateProcess(id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return process;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update process';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeleteProcess = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deleteProcess(id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete process';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createProcess: handleCreateProcess,
    updateProcess: handleUpdateProcess,
    deleteProcess: handleDeleteProcess,
    clearError,
  };
}
