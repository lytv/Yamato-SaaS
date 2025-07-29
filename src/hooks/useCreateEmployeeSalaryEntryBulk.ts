/**
 * Hook for bulk creation of employee salary entries
 * Separate hook for better organization and reusability
 */

import { useCallback, useState } from 'react';
import type { CreateEmployeeSalaryEntryInput, EmployeeSalaryEntryWithRelations } from '@/types/employeeSalaryEntry';

type BulkCreationState = {
  isPending: boolean;
  error: Error | null;
};

type BulkCreationReturn = BulkCreationState & {
  mutateAsync: (input: Omit<CreateEmployeeSalaryEntryInput, 'ownerId'>[]) => Promise<EmployeeSalaryEntryWithRelations[]>;
  reset: () => void;
};

export function useCreateEmployeeSalaryEntryBulk(): BulkCreationReturn {
  const [state, setState] = useState<BulkCreationState>({
    isPending: false,
    error: null,
  });

  const mutateAsync = useCallback(async (input: Omit<CreateEmployeeSalaryEntryInput, 'ownerId'>[]): Promise<EmployeeSalaryEntryWithRelations[]> => {
    setState(prev => ({ ...prev, isPending: true, error: null }));

    try {
      const response = await fetch('/api/employeeSalaryEntries/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create salary entries in bulk');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Bulk creation failed');
      }

      setState(prev => ({ ...prev, isPending: false }));
      return result.data;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to create salary entries in bulk');
      setState(prev => ({ ...prev, isPending: false, error: errorObj }));
      throw errorObj;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isPending: false, error: null });
  }, []);

  return {
    ...state,
    mutateAsync,
    reset,
  };
}