/**
 * useNoteMutations Hook
 * Manages note CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createNote, deleteNote, updateNote } from '@/libs/api/notes';
import type { Note, NoteFormData, UpdateNoteInput } from '@/types/note';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createNote: (input: NoteFormData) => Promise<Note>;
  updateNote: (id: number, input: UpdateNoteInput) => Promise<Note>;
  deleteNote: (id: number) => Promise<void>;
  clearError: () => void;
};

export function useNoteMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreateNote = useCallback(async (input: NoteFormData): Promise<Note> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const note = await createNote(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return note;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create note';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdateNote = useCallback(async (id: number, input: UpdateNoteInput): Promise<Note> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const note = await updateNote(id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return note;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update note';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeleteNote = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deleteNote(id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete note';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createNote: handleCreateNote,
    updateNote: handleUpdateNote,
    deleteNote: handleDeleteNote,
    clearError,
  };
}
