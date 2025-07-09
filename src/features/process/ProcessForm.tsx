/**
 * ProcessForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing processs with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useProcessMutations } from '@/hooks/useProcessMutations';
import { processFormSchema } from '@/libs/validations/process';
import type { Process, ProcessFormData } from '@/types/process';

type ProcessFormProps = {
  process?: Process;
  onSuccess: (process: Process) => void;
  onCancel: () => void;
};

export function ProcessForm({ process, onSuccess, onCancel }: ProcessFormProps): JSX.Element {
  const t = useTranslations('process.form');
  const isEditing = Boolean(process);
  const { createProcess, updateProcess, isCreating, isUpdating, error, clearError } = useProcessMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ProcessFormData>({
    resolver: zodResolver(processFormSchema),
    defaultValues: process
      ? {
          processCode: process.processCode,
          processName: process.processName,
          processCategory: process.processCategory || '',
          description: process.description || '',
        }
      : {
          processCode: '',
          processName: '',
          processCategory: '',
          description: '',
        },
    mode: 'onChange',
  });

  // Clear errors when form values change
  useEffect(() => {
    const subscription = watch(() => {
      if (error) {
        clearError();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, error, clearError]);

  const onSubmit = async (data: ProcessFormData): Promise<void> => {
    try {
      if (isEditing && process) {
        const updatedProcess = await updateProcess(process.id, data);
        onSuccess(updatedProcess);
      } else {
        const newProcess = await createProcess(data);
        onSuccess(newProcess);
      }
    } catch {
      // Error is handled by the mutation hook
    }
  };

  const handleReset = (): void => {
    reset();
    clearError();
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Process Code Field */}
      <div>
        <label
          htmlFor="processCode"
          className="block text-sm font-medium text-gray-700"
        >
          {t('processCode_label')}
        </label>
        <input
          id="processCode"
          type="text"
          {...register('processCode')}
          aria-required="true"
          aria-describedby={errors.processCode ? 'processCode-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.processCode ? 'border-red-300' : ''
          }`}
          placeholder={t('processCode_placeholder')}
        />
        {errors.processCode && (
          <p id="processCode-error" className="mt-2 text-sm text-red-600">
            {errors.processCode.message}
          </p>
        )}
      </div>

      {/* Process Name Field */}
      <div>
        <label
          htmlFor="processName"
          className="block text-sm font-medium text-gray-700"
        >
          {t('processName_label')}
        </label>
        <input
          id="processName"
          type="text"
          {...register('processName')}
          aria-required="true"
          aria-describedby={errors.processName ? 'processName-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.processName ? 'border-red-300' : ''
          }`}
          placeholder={t('processName_placeholder')}
        />
        {errors.processName && (
          <p id="processName-error" className="mt-2 text-sm text-red-600">
            {errors.processName.message}
          </p>
        )}
      </div>

      {/* Process Category Field */}
      <div>
        <label
          htmlFor="processCategory"
          className="block text-sm font-medium text-gray-700"
        >
          {t('processCategory_label')}
        </label>
        <input
          id="processCategory"
          type="text"
          {...register('processCategory')}
          aria-describedby={errors.processCategory ? 'processCategory-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.processCategory ? 'border-red-300' : ''
          }`}
          placeholder={t('processCategory_placeholder')}
        />
        {errors.processCategory && (
          <p id="processCategory-error" className="mt-2 text-sm text-red-600">
            {errors.processCategory.message}
          </p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          {t('description_label')}
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          aria-describedby={errors.description ? 'description-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.description ? 'border-red-300' : ''
          }`}
          placeholder={t('description_placeholder')}
        />
        {errors.description && (
          <p id="description-error" className="mt-2 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('cancel')}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('reset')}
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? isEditing
              ? t('updating')
              : t('creating')
            : isEditing
              ? t('update')
              : t('create')}
        </button>
      </div>
    </form>
  );
}
