/**
 * TodoForm Component
 * Form for creating and editing todos
 * Following TDD implementation and Shadcn UI patterns
 */

'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTodoMutations } from '@/hooks/useTodoMutations';
import type { Todo, TodoFormData } from '@/types/todo';

type TodoFormProps = {
  mode: 'create' | 'edit';
  todo?: Todo;
  onSuccess: () => void;
};

export function TodoForm({ mode, todo, onSuccess }: TodoFormProps): JSX.Element {
  const t = useTranslations();
  const { createTodo, updateTodo, isCreating, isUpdating, error } = useTodoMutations();

  if (mode === 'edit' && !todo) {
    throw new Error('Todo is required for edit mode');
  }

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    setValue,
  } = useForm<TodoFormData>({
    defaultValues: {
      title: '',
      message: '',
    },
  });

  // Set form values for edit mode
  useEffect(() => {
    if (mode === 'edit' && todo) {
      setValue('title', todo.title);
      setValue('message', todo.message);
    }
  }, [mode, todo, setValue]);

  const onSubmit = async (data: TodoFormData) => {
    try {
      if (mode === 'create') {
        await createTodo(data);
        reset();
      } else if (mode === 'edit' && todo) {
        await updateTodo(todo.id, data);
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
        {mode === 'create' ? t('todo.create') : t('todo.edit')}
      </h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{t('error.createTodo')}</p>
          <p className="mt-1 text-sm text-red-500">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">{t('todo.form.title')}</Label>
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
                  aria-label={t('todo.form.title')}
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
          <Label htmlFor="message">{t('todo.form.message')}</Label>
          <Controller
            name="message"
            control={control}
            rules={{ required: 'Message is required' }}
            render={({ field, fieldState }) => (
              <div>
                <textarea
                  {...field}
                  id="message"
                  required
                  aria-label={t('todo.form.message')}
                  className={`w-full rounded-md border px-3 py-2 ${
                    fieldState.error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={4}
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
            ? (
                mode === 'create' ? t('todo.form.creating') : t('todo.form.updating')
              )
            : (
                mode === 'create' ? t('todo.form.create') : t('todo.form.update')
              )}
        </Button>
      </form>
    </div>
  );
}
