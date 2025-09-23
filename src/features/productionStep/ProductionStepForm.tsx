/**
 * ProductionStepForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing production steps with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, GitBranch, Settings, StickyNote, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useProductionStepMutations } from '@/hooks/useProductionStepMutations';
import { productionStepFormSchema } from '@/libs/validations/productionStep';
import type { ProductionStep, ProductionStepFormData } from '@/types/productionStep';

type ProductionStepFormProps = {
  productionStep?: ProductionStep;
  onSuccess: (productionStep: ProductionStep) => void;
  onCancel: () => void;
};

export function ProductionStepForm({ productionStep, onSuccess, onCancel }: ProductionStepFormProps): JSX.Element {
  const t = useTranslations('productionStep.form');
  const isEditing = Boolean(productionStep);
  const { createProductionStep, updateProductionStep, isCreating, isUpdating, error, clearError } = useProductionStepMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ProductionStepFormData>({
    resolver: zodResolver(productionStepFormSchema),
    defaultValues: productionStep
      ? {
          stepCode: productionStep.stepCode,
          stepName: productionStep.stepName,
          filmSequence: productionStep.filmSequence || '',
          stepGroup: productionStep.stepGroup || '',
          notes: productionStep.notes || '',
        }
      : {
          stepCode: '',
          stepName: '',
          filmSequence: '',
          stepGroup: '',
          notes: '',
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

  const onSubmit = async (data: ProductionStepFormData): Promise<void> => {
    try {
      if (isEditing && productionStep) {
        const updatedStep = await updateProductionStep(productionStep.id, data);
        onSuccess(updatedStep);
      } else {
        const newStep = await createProductionStep(data);
        onSuccess(newStep);
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
    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Header */}
        <div className="border-b border-gray-200 pb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600">
            <Settings className="size-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {isEditing ? t('edit_title') : t('title')}
          </h2>
          <p className="text-gray-600">
            {isEditing ? 'Update production step configuration' : 'Create a new production step'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-sm text-red-700">{t('error')}</div>
          </div>
        )}

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Step Code Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <FileText className="mr-2 size-4 text-indigo-500" />
              {t('stepCode')}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="stepCode"
              type="text"
              {...register('stepCode')}
              aria-required="true"
              aria-describedby={errors.stepCode ? 'stepCode-error' : undefined}
              className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.stepCode
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
              placeholder={t('stepCode_placeholder')}
            />
            {errors.stepCode && (
              <p id="stepCode-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.stepCode.message}
              </p>
            )}
          </div>

          {/* Step Name Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <Settings className="mr-2 size-4 text-indigo-500" />
              {t('stepName')}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="stepName"
              type="text"
              {...register('stepName')}
              aria-required="true"
              aria-describedby={errors.stepName ? 'stepName-error' : undefined}
              className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.stepName
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
              placeholder={t('stepName_placeholder')}
            />
            {errors.stepName && (
              <p id="stepName-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.stepName.message}
              </p>
            )}
          </div>

          {/* Film Sequence Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <GitBranch className="mr-2 size-4 text-indigo-500" />
              {t('filmSequence')}
            </label>
            <input
              id="filmSequence"
              type="text"
              {...register('filmSequence')}
              aria-describedby={errors.filmSequence ? 'filmSequence-error' : undefined}
              className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.filmSequence
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
              placeholder={t('filmSequence_placeholder')}
            />
            {errors.filmSequence && (
              <p id="filmSequence-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.filmSequence.message}
              </p>
            )}
          </div>

          {/* Step Group Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <Tag className="mr-2 size-4 text-indigo-500" />
              {t('stepGroup')}
            </label>
            <input
              id="stepGroup"
              type="text"
              {...register('stepGroup')}
              aria-describedby={errors.stepGroup ? 'stepGroup-error' : undefined}
              className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.stepGroup
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
              placeholder={t('stepGroup_placeholder')}
            />
            {errors.stepGroup && (
              <p id="stepGroup-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.stepGroup.message}
              </p>
            )}
          </div>

          {/* Notes Field - Full Width */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:col-span-2">
            <label className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <StickyNote className="mr-2 size-4 text-indigo-500" />
              {t('notes')}
            </label>
            <textarea
              id="notes"
              rows={4}
              {...register('notes')}
              aria-describedby={errors.notes ? 'notes-error' : undefined}
              className={`block w-full resize-none rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.notes
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
              placeholder={t('notes_placeholder')}
            />
            {errors.notes && (
              <p id="notes-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.notes.message}
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
          >
            {t('cancel')}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
          >
            {t('reset')}
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:from-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && (
              <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            )}
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
    </div>
  );
}
