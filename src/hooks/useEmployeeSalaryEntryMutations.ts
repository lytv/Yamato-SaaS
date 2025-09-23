/**
 * useEmployeeSalaryEntryMutations Hook
 * Manages employeeSalaryEntry CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createEmployeeSalaryEntry, deleteEmployeeSalaryEntry, updateEmployeeSalaryEntry } from '@/libs/api/employeeSalaryEntries';
import type { CreateEmployeeSalaryEntryInput, EmployeeSalaryEntry, EmployeeSalaryEntryFormData, UpdateEmployeeSalaryEntryInput } from '@/types/employeeSalaryEntry';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isCreatingBulk: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createEmployeeSalaryEntry: (input: EmployeeSalaryEntryFormData) => Promise<EmployeeSalaryEntry>;
  updateEmployeeSalaryEntry: (id: number, input: UpdateEmployeeSalaryEntryInput) => Promise<EmployeeSalaryEntry>;
  deleteEmployeeSalaryEntry: (id: number) => Promise<void>;
  createEmployeeSalaryEntryBulk: (input: Omit<CreateEmployeeSalaryEntryInput, 'ownerId'>[]) => Promise<EmployeeSalaryEntry[]>;
  clearError: () => void;
};

export function useEmployeeSalaryEntryMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isCreatingBulk: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreateEmployeeSalaryEntry = useCallback(async (input: EmployeeSalaryEntryFormData): Promise<EmployeeSalaryEntry> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const employeeSalaryEntry = await createEmployeeSalaryEntry(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return employeeSalaryEntry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create employeeSalaryEntry';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdateEmployeeSalaryEntry = useCallback(async (id: number, input: UpdateEmployeeSalaryEntryInput): Promise<EmployeeSalaryEntry> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const employeeSalaryEntry = await updateEmployeeSalaryEntry(id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return employeeSalaryEntry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employeeSalaryEntry';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeleteEmployeeSalaryEntry = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deleteEmployeeSalaryEntry(id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete employeeSalaryEntry';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleCreateEmployeeSalaryEntryBulk = useCallback(async (input: Omit<CreateEmployeeSalaryEntryInput, 'ownerId'>[]): Promise<EmployeeSalaryEntry[]> => {
    setState(prev => ({ ...prev, isCreatingBulk: true, error: null }));

    try {
      const response = await fetch('/api/employeeSalaryEntries/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create salary entries in bulk');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Bulk creation failed');
      }

      setState(prev => ({ ...prev, isCreatingBulk: false }));
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create salary entries in bulk';
      setState(prev => ({ ...prev, isCreatingBulk: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createEmployeeSalaryEntry: handleCreateEmployeeSalaryEntry,
    updateEmployeeSalaryEntry: handleUpdateEmployeeSalaryEntry,
    deleteEmployeeSalaryEntry: handleDeleteEmployeeSalaryEntry,
    createEmployeeSalaryEntryBulk: handleCreateEmployeeSalaryEntryBulk,
    clearError,
  };
}
