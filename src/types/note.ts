/**
 * Note Type Definitions
 * TypeScript types for the Notes feature
 */

import type { noteSchema } from '@/models/Schema';

// Infer the Note type from Drizzle schema (server-side with Date objects)
export type NoteDb = typeof noteSchema.$inferSelect;

// Client-side Note type (dates are strings when received from API)
export type Note = Omit<NoteDb, 'createdAt' | 'updatedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Input types for creating notes
export type CreateNoteInput = typeof noteSchema.$inferInsert;

// Input types for updating notes (partial except for required fields)
export type UpdateNoteInput = Partial<Omit<CreateNoteInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Pagination options for note lists
export type PaginationOptions = {
  page: number;
  limit: number;
};

// Note list query parameters
export type NoteListParams = PaginationOptions & {
  search?: string;
  ownerId: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
};

// API Response Types
export type NotesResponse = {
  success: true;
  data: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type NoteResponse = {
  success: true;
  data: Note;
  message?: string;
};

export type NoteErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Statistics type for dashboard
export type NoteStats = {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
};

export type NoteStatsResponse = {
  success: true;
  data: NoteStats;
};

// Form data type (what user inputs)
export type NoteFormData = {
  title: string;
  content: string;
  category?: string;
};

// Filter state for note list
export type NoteFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
};

// Multi-tenancy owner types
export type OwnerType = 'user' | 'organization';
