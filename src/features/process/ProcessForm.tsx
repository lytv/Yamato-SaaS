/**
 * ProcessForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing processs with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, FileText, RefreshCw, Settings, Tag } from 'lucide-react';
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
    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Form Header */}
        <div className="border-b border-gray-200 pb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-gray-600">
            <Settings className="size-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {isEditing ? (t('updateProcess') || 'Edit Process') : (t('createProcess') || 'Create Process')}
          </h2>
          <p className="text-gray-600">
            {isEditing
              ? (t('updateProcessDescription') || 'Update process configuration and specifications')
              : (t('processDescription') || 'Define a new production process with detailed specifications')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-red-600" />
                <p className="text-sm font-medium text-red-800">Error</p>
              </div>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Main Fields Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Process Code Field */}
            <div className="space-y-2">
              <label
                htmlFor="processCode"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <Settings className="mr-2 size-4 text-slate-500" />
                {t('processCode_label') || 'Process Code'}
                <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="processCode"
                type="text"
                {...register('processCode')}
                aria-required="true"
                aria-describedby={errors.processCode ? 'processCode-error' : undefined}
                className={`w-full rounded-lg border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  errors.processCode
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:border-slate-500'
                }`}
                placeholder={t('processCode_placeholder') || 'Enter process code (e.g., PROC001)'}
              />
              {errors.processCode && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="size-3" />
                  {errors.processCode.message}
                </div>
              )}
            </div>

            {/* Process Name Field */}
            <div className="space-y-2">
              <label
                htmlFor="processName"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <FileText className="mr-2 size-4 text-slate-500" />
                {t('processName_label') || 'Process Name'}
                <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="processName"
                type="text"
                {...register('processName')}
                aria-required="true"
                aria-describedby={errors.processName ? 'processName-error' : undefined}
                className={`w-full rounded-lg border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  errors.processName
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:border-slate-500'
                }`}
                placeholder={t('processName_placeholder') || 'Enter process name'}
              />
              {errors.processName && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="size-3" />
                  {errors.processName.message}
                </div>
              )}
            </div>

            {/* Process Category Field */}
            <div className="space-y-2">
              <label
                htmlFor="processCategory"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <Tag className="mr-2 size-4 text-slate-500" />
                {t('processCategory_label') || 'Process Category'}
              </label>
              <input
                id="processCategory"
                type="text"
                {...register('processCategory')}
                aria-describedby={errors.processCategory ? 'processCategory-error' : undefined}
                className={`w-full rounded-lg border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  errors.processCategory
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:border-slate-500'
                }`}
                placeholder={t('processCategory_placeholder') || 'Enter process category (optional)'}
              />
              {errors.processCategory && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="size-3" />
                  {errors.processCategory.message}
                </div>
              )}
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="flex items-center text-sm font-medium text-gray-700"
            >
              <FileText className="mr-2 size-4 text-slate-500" />
              {t('description_label') || 'Description'}
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              aria-describedby={errors.description ? 'description-error' : undefined}
              className={`w-full resize-none rounded-lg border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                errors.description
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 focus:border-slate-500'
              }`}
              placeholder={t('description_placeholder') || 'Enter detailed process description, steps, requirements, etc.'}
            />
            {errors.description && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="size-3" />
                {errors.description.message}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
            >
              {t('cancel') || 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
            >
              {t('reset') || 'Reset'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-slate-600 to-gray-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:from-slate-700 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && (
                <RefreshCw className="mr-2 size-4 animate-spin" />
              )}
              {isSubmitting
                ? isEditing
                  ? (t('updating') || 'Updating...')
                  : (t('creating') || 'Creating...')
                : isEditing
                  ? (t('update') || 'Update Process')
                  : (t('create') || 'Create Process')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
