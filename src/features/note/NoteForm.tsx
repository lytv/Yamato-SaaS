/**
 * NoteForm Component
 * Form for creating and editing notes
 * Following TDD implementation and Shadcn UI patterns
 */

'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNoteMutations } from '@/hooks/useNoteMutations';
import type { Note, NoteFormData } from '@/types/note';

type NoteFormProps = {
  mode: 'create' | 'edit';
  note?: Note;
  onSuccess: () => void;
};

export function NoteForm({ mode, note, onSuccess }: NoteFormProps): JSX.Element {
  const t = useTranslations();
  const { createNote, updateNote, isCreating, isUpdating, error } = useNoteMutations();

  if (mode === 'edit' && !note) {
    throw new Error('Note is required for edit mode');
  }

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    setValue,
  } = useForm<NoteFormData>({
    defaultValues: {
      title: '',
      content: '',
      category: '',
    },
  });

  // Set form values for edit mode
  useEffect(() => {
    if (mode === 'edit' && note) {
      setValue('title', note.title);
      setValue('content', note.content);
      setValue('category', note.category || '');
    }
  }, [mode, note, setValue]);

  const onSubmit = async (data: NoteFormData) => {
    try {
      if (mode === 'create') {
        await createNote(data);
        reset();
      } else if (mode === 'edit' && note) {
        await updateNote(note.id, data);
      }
      onSuccess();
    } catch {
      // Error is handled by the hook
    }
  };

  const isLoading = isCreating || isUpdating || isSubmitting;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {mode === 'create' ? t('note.create') : t('note.edit')}
      </h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{t('error.createNote')}</p>
          <p className="mt-1 text-sm text-red-500">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" role="form">
        <div className="space-y-2">
          <Label htmlFor="title">{t('note.form.title')}</Label>
          <Controller
            name="title"
            control={control}
            rules={{ required: 'Title is required' }}
            render={({ field, fieldState }) => (
              <div>
                <Input
                  {...field}
                  id="title"
                  type="text"
                  required
                  aria-label={t('note.form.title')}
                  className={fieldState.error ? 'border-red-500' : ''}
                />
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">{t('note.form.content')}</Label>
          <Controller
            name="content"
            control={control}
            rules={{ required: 'Content is required' }}
            render={({ field, fieldState }) => (
              <div>
                <textarea
                  {...field}
                  id="content"
                  required
                  aria-label={t('note.form.content')}
                  className={`w-full rounded-md border px-3 py-2 ${
                    fieldState.error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={6}
                  placeholder="Enter your note content..."
                />
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">{t('note.form.category')}</Label>
          <Controller
            name="category"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <Input
                  {...field}
                  id="category"
                  type="text"
                  placeholder="Optional category"
                  aria-label={t('note.form.category')}
                  className={fieldState.error ? 'border-red-500' : ''}
                />
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? (mode === 'create' ? t('note.form.creating') : t('note.form.updating'))
            : (mode === 'create' ? t('note.form.create') : t('note.form.update'))}
        </Button>
      </form>
    </div>
  );
}
