/**
 * NoteList Component
 * Displays a list of notes with search, filtering, and pagination
 * Following TDD implementation and Shadcn UI patterns
 */

'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNoteFilters } from '@/hooks/useNoteFilters';
import { useNoteMutations } from '@/hooks/useNoteMutations';
import { useNotes } from '@/hooks/useNotes';
import type { Note } from '@/types/note';

import { NoteListSkeleton } from './NoteSkeleton';

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

/**
 * NoteItem component for individual note display
 */
function NoteItem({
  note,
  onEdit,
  onDelete,
}: {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{note.title}</h3>
          {note.category && (
            <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
              {note.category}
            </span>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(note)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(note.id)}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
      
      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
        {note.content}
      </p>
      
      <div className="mt-3 text-xs text-muted-foreground">
        {formatDate(note.createdAt)}
      </div>
    </li>
  );
}

/**
 * Empty state component
 */
function EmptyState(): JSX.Element {
  const t = useTranslations();

  return (
    <div className="py-8 text-center">
      <p className="text-muted-foreground">{t('note.noNotes')}</p>
    </div>
  );
}

/**
 * Main NoteList component
 */
export function NoteList({
  onEdit,
  onDelete,
}: {
  onEdit?: (note: Note) => void;
  onDelete?: (id: number) => void;
} = {}): JSX.Element {
  const t = useTranslations();
  const { deleteNote } = useNoteMutations();
  const {
    search,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleSortChange,
    resetFilters,
  } = useNoteFilters();

  const { notes, pagination, isLoading, error, refresh } = useNotes({
    page: 1,
    limit: 10,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteNote(id);
      refresh();
      if (onDelete) {
        onDelete(id);
      }
    } catch {
      // Error is handled by the hook
    }
  };

  if (isLoading) {
    return <NoteListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">{t('error.fetchNotes')}</p>
        <p className="mt-1 text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          type="search"
          role="searchbox"
          placeholder={t('note.searchPlaceholder')}
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="flex-1"
        />

        <select
          value={sortBy}
          onChange={e => handleSortChange(e.target.value as any)}
          className="rounded-md border bg-background px-3 py-2"
        >
          <option value="createdAt">{t('note.sort.createdAt')}</option>
          <option value="updatedAt">{t('note.sort.updatedAt')}</option>
          <option value="title">{t('note.sort.title')}</option>
        </select>

        {(search || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
          <Button variant="outline" onClick={resetFilters}>
            {t('note.resetFilters')}
          </Button>
        )}
      </div>

      {/* Note List */}
      {notes.length === 0
        ? (
            <EmptyState />
          )
        : (
            <>
              <ul className="space-y-4">
                {notes.map(note => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>

              {/* Pagination Info */}
              {pagination && pagination.total > 0 && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Showing {notes.length} of {pagination.total} notes
                  {pagination.hasMore && ' (more available)'}
                </div>
              )}
            </>
          )}
    </div>
  );
}
