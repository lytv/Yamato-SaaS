/**
 * useTodoMutations Hook
 * Manages todo CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createTodo, deleteTodo, updateTodo } from '@/libs/api/todos';
import type { Todo, TodoFormData, UpdateTodoInput } from '@/types/todo';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createTodo: (input: TodoFormData) => Promise<Todo>;
  updateTodo: (id: number, input: UpdateTodoInput) => Promise<Todo>;
  deleteTodo: (id: number) => Promise<void>;
  clearError: () => void;
};

export function useTodoMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreateTodo = useCallback(async (input: TodoFormData): Promise<Todo> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const todo = await createTodo(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return todo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create todo';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdateTodo = useCallback(async (id: number, input: UpdateTodoInput): Promise<Todo> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const todo = await updateTodo(id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return todo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update todo';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeleteTodo = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deleteTodo(id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete todo';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createTodo: handleCreateTodo,
    updateTodo: handleUpdateTodo,
    deleteTodo: handleDeleteTodo,
    clearError,
  };
}
