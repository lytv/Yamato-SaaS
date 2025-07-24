/**
 * ProductionStepForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing production steps with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
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
    <>
      <h2 className="text-xl font-semibold mb-6">{t('title')}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{t('error')}</div>
          </div>
        )}

        {/* Step Code Field */}
        <div>
          <label
            htmlFor="stepCode"
            className="block text-sm font-medium text-gray-700"
          >
            {t('stepCode')}
            {' '}
            *
          </label>
          <input
            id="stepCode"
            type="text"
            {...register('stepCode')}
            aria-required="true"
            aria-describedby={errors.stepCode ? 'stepCode-error' : undefined}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.stepCode ? 'border-red-300' : ''
            }`}
            placeholder={t('stepCode_placeholder')}
          />
          {errors.stepCode && (
            <p id="stepCode-error" className="mt-2 text-sm text-red-600">
              {errors.stepCode.message}
            </p>
          )}
        </div>

        {/* Step Name Field */}
        <div>
          <label
            htmlFor="stepName"
            className="block text-sm font-medium text-gray-700"
          >
            {t('stepName')}
            {' '}
            *
          </label>
          <input
            id="stepName"
            type="text"
            {...register('stepName')}
            aria-required="true"
            aria-describedby={errors.stepName ? 'stepName-error' : undefined}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.stepName ? 'border-red-300' : ''
            }`}
            placeholder={t('stepName_placeholder')}
          />
          {errors.stepName && (
            <p id="stepName-error" className="mt-2 text-sm text-red-600">
              {errors.stepName.message}
            </p>
          )}
        </div>

        {/* Film Sequence Field */}
        <div>
          <label
            htmlFor="filmSequence"
            className="block text-sm font-medium text-gray-700"
          >
            {t('filmSequence')}
          </label>
          <input
            id="filmSequence"
            type="text"
            {...register('filmSequence')}
            aria-describedby={errors.filmSequence ? 'filmSequence-error' : undefined}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.filmSequence ? 'border-red-300' : ''
            }`}
            placeholder={t('filmSequence_placeholder')}
          />
          {errors.filmSequence && (
            <p id="filmSequence-error" className="mt-2 text-sm text-red-600">
              {errors.filmSequence.message}
            </p>
          )}
        </div>

        {/* Step Group Field */}
        <div>
          <label
            htmlFor="stepGroup"
            className="block text-sm font-medium text-gray-700"
          >
            {t('stepGroup')}
          </label>
          <input
            id="stepGroup"
            type="text"
            {...register('stepGroup')}
            aria-describedby={errors.stepGroup ? 'stepGroup-error' : undefined}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.stepGroup ? 'border-red-300' : ''
            }`}
            placeholder={t('stepGroup_placeholder')}
          />
          {errors.stepGroup && (
            <p id="stepGroup-error" className="mt-2 text-sm text-red-600">
              {errors.stepGroup.message}
            </p>
          )}
        </div>

        {/* Notes Field */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            {t('notes')}
          </label>
          <textarea
            id="notes"
            rows={4}
            {...register('notes')}
            aria-describedby={errors.notes ? 'notes-error' : undefined}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.notes ? 'border-red-300' : ''
            }`}
            placeholder={t('notes_placeholder')}
          />
          {errors.notes && (
            <p id="notes-error" className="mt-2 text-sm text-red-600">
              {errors.notes.message}
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
    </>
  );
}
