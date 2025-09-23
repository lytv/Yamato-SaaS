/**
 * Notes Page
 * Main note management page integrating NoteList and NoteForm components
 * Following TDD implementation and Yamato-SaaS patterns
 */

'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { NoteForm } from '@/features/note/NoteForm';
import { NoteList } from '@/features/note/NoteList';
import type { Note } from '@/types/note';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  note?: Note;
};

export default function NotesPage(): JSX.Element {
  const t = useTranslations();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNote = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditNote = (note: Note) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      note,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the note list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('note.pageTitle', { default: 'Notes' })}
          </h1>
          <p className="text-muted-foreground">
            {t('note.pageDescription', {
              default: 'Manage your notes and stay organized',
            })}
          </p>
        </div>

        <Button onClick={handleCreateNote}>
          {t('note.createNew', { default: 'Create Note' })}
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <NoteList
          key={refreshKey}
          onEdit={handleEditNote}
          onDelete={handleSuccess}
        />
      </div>

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
            onKeyDown={e => e.key === 'Escape' && handleCloseModal()}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {modal.mode === 'create' ? 'Create Note' : 'Edit Note'}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                ✕
              </Button>
            </div>

            <NoteForm
              mode={modal.mode}
              note={modal.note}
              onSuccess={() => {
                handleSuccess();
                handleCloseModal();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
