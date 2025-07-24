/**
 * Note API Client
 * Client-side functions for note CRUD operations
 * Following Yamato-SaaS patterns with proper error handling
 */

import type {
  CreateNoteInput,
  Note,
  NoteErrorResponse,
  NoteListParams,
  NoteResponse,
  NotesResponse,
  NoteStats,
  NoteStatsResponse,
  UpdateNoteInput,
} from '@/types/note';

/**
 * Fetch notes with pagination and filtering
 */
export async function fetchNotes(
  params: Omit<NoteListParams, 'ownerId'> = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
): Promise<NotesResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', params.page?.toString() || '1');
  searchParams.set('limit', params.limit?.toString() || '10');
  searchParams.set('sortBy', params.sortBy || 'createdAt');
  searchParams.set('sortOrder', params.sortOrder || 'desc');

  if (params.search) {
    searchParams.set('search', params.search);
  }

  const response = await fetch(`/api/notes?${searchParams.toString()}`);

  if (!response.ok) {
    const error: NoteErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch notes');
  }

  return response.json();
}

/**
 * Fetch single note by ID
 */
export async function fetchNote(id: number): Promise<Note> {
  const response = await fetch(`/api/notes/${id}`);

  if (!response.ok) {
    const error: NoteErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch note');
  }

  const result: NoteResponse = await response.json();
  return result.data;
}

/**
 * Create new note
 */
export async function createNote(data: Omit<CreateNoteInput, 'ownerId'>): Promise<Note> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: NoteErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create note');
  }

  const result: NoteResponse = await response.json();
  return result.data;
}

/**
 * Update existing note
 */
export async function updateNote(id: number, data: UpdateNoteInput): Promise<Note> {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: NoteErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update note');
  }

  const result: NoteResponse = await response.json();
  return result.data;
}

/**
 * Delete note
 */
export async function deleteNote(id: number): Promise<void> {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: NoteErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete note');
  }
}

/**
 * Fetch note statistics
 */
export async function fetchNoteStats(): Promise<NoteStats> {
  const response = await fetch('/api/notes/stats');

  if (!response.ok) {
    const error: NoteErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch note stats');
  }

  const result: NoteStatsResponse = await response.json();
  return result.data;
}
