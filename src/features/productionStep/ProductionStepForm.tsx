/**
 * ProductionStepForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing production steps with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, FileText, GitBranch, Tag, StickyNote } from 'lucide-react';
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
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50 p-6 rounded-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Header */}
        <div className="text-center pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditing ? t('edit_title') : t('title')}
          </h2>
          <p className="text-gray-600">
            {isEditing ? 'Update production step configuration' : 'Create a new production step'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="text-sm text-red-700">{t('error')}</div>
          </div>
        )}

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step Code Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <FileText className="w-4 h-4 mr-2 text-indigo-500" />
              {t('stepCode')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="stepCode"
              type="text"
              {...register('stepCode')}
              aria-required="true"
              aria-describedby={errors.stepCode ? 'stepCode-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.stepCode 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('stepCode_placeholder')}
            />
            {errors.stepCode && (
              <p id="stepCode-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.stepCode.message}
              </p>
            )}
          </div>

          {/* Step Name Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Settings className="w-4 h-4 mr-2 text-indigo-500" />
              {t('stepName')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="stepName"
              type="text"
              {...register('stepName')}
              aria-required="true"
              aria-describedby={errors.stepName ? 'stepName-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.stepName 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('stepName_placeholder')}
            />
            {errors.stepName && (
              <p id="stepName-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.stepName.message}
              </p>
            )}
          </div>

          {/* Film Sequence Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <GitBranch className="w-4 h-4 mr-2 text-indigo-500" />
              {t('filmSequence')}
            </label>
            <input
              id="filmSequence"
              type="text"
              {...register('filmSequence')}
              aria-describedby={errors.filmSequence ? 'filmSequence-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.filmSequence 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('filmSequence_placeholder')}
            />
            {errors.filmSequence && (
              <p id="filmSequence-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.filmSequence.message}
              </p>
            )}
          </div>

          {/* Step Group Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Tag className="w-4 h-4 mr-2 text-indigo-500" />
              {t('stepGroup')}
            </label>
            <input
              id="stepGroup"
              type="text"
              {...register('stepGroup')}
              aria-describedby={errors.stepGroup ? 'stepGroup-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.stepGroup 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('stepGroup_placeholder')}
            />
            {errors.stepGroup && (
              <p id="stepGroup-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.stepGroup.message}
              </p>
            )}
          </div>

          {/* Notes Field - Full Width */}
          <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <StickyNote className="w-4 h-4 mr-2 text-indigo-500" />
              {t('notes')}
            </label>
            <textarea
              id="notes"
              rows={4}
              {...register('notes')}
              aria-describedby={errors.notes ? 'notes-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none ${
                errors.notes 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('notes_placeholder')}
            />
            {errors.notes && (
              <p id="notes-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.notes.message}
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
          >
            {t('cancel')}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
          >
            {t('reset')}
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
