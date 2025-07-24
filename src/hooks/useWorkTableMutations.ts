import { useCallback, useState } from 'react';

import { createWorkTable, deleteWorkTable, updateWorkTable } from '@/libs/api/workTables';
import type { CreateWorkTableInput, UpdateWorkTableInput } from '@/types/workTable';

type MutationState = {
  isLoading: boolean;
  error: string | null;
};

type CreateWorkTableReturn = MutationState & {
  createWorkTable: (data: CreateWorkTableInput) => Promise<void>;
};

type UpdateWorkTableReturn = MutationState & {
  updateWorkTable: (id: number, data: UpdateWorkTableInput) => Promise<void>;
};

type DeleteWorkTableReturn = MutationState & {
  deleteWorkTable: (id: number) => Promise<void>;
};

export function useCreateWorkTable(): CreateWorkTableReturn {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const createWorkTableMutation = useCallback(async (data: CreateWorkTableInput) => {
    setState({ isLoading: true, error: null });

    try {
      await createWorkTable(data);
      setState({ isLoading: false, error: null });
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create work table',
      });
      throw error;
    }
  }, []);

  return {
    ...state,
    createWorkTable: createWorkTableMutation,
  };
}

export function useUpdateWorkTable(): UpdateWorkTableReturn {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const updateWorkTableMutation = useCallback(async (id: number, data: UpdateWorkTableInput) => {
    setState({ isLoading: true, error: null });

    try {
      await updateWorkTable(id, data);
      setState({ isLoading: false, error: null });
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update work table',
      });
      throw error;
    }
  }, []);

  return {
    ...state,
    updateWorkTable: updateWorkTableMutation,
  };
}

export function useDeleteWorkTable(): DeleteWorkTableReturn {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const deleteWorkTableMutation = useCallback(async (id: number) => {
    setState({ isLoading: true, error: null });

    try {
      await deleteWorkTable(id);
      setState({ isLoading: false, error: null });
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete work table',
      });
      throw error;
    }
  }, []);

  return {
    ...state,
    deleteWorkTable: deleteWorkTableMutation,
  };
}
