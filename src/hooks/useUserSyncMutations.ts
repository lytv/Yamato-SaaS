/**
 * useUserSyncMutations Hook
 * Manages user_sync CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createUserSync, deleteUserSync, updateUserSync } from '@/libs/api/user_syncs';
import type { UpdateUserSyncInput, UserSync, UserSyncFormData } from '@/types/user_sync';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createUserSync: (input: UserSyncFormData) => Promise<UserSync>;
  updateUserSync: (userId: string, input: UpdateUserSyncInput) => Promise<UserSync>;
  deleteUserSync: (userId: string, ownerId: string) => Promise<void>;
  clearError: () => void;
};

export function useUserSyncMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreateUserSync = useCallback(async (input: UserSyncFormData): Promise<UserSync> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const user_sync = await createUserSync(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return user_sync;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user_sync';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdateUserSync = useCallback(async (userId: string, input: UpdateUserSyncInput): Promise<UserSync> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const user_sync = await updateUserSync(userId, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return user_sync;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user_sync';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeleteUserSync = useCallback(async (userId: string, ownerId: string): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deleteUserSync(userId, ownerId);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user_sync';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createUserSync: handleCreateUserSync,
    updateUserSync: handleUpdateUserSync,
    deleteUserSync: handleDeleteUserSync,
    clearError,
  };
}
