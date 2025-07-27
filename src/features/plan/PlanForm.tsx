/**
 * PlanForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing plans with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, FileText, Target, Clock, Calendar, Users, StickyNote, CheckCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { usePlanMutations } from '@/hooks/usePlanMutations';
import { planFormSchema } from '@/libs/validations/plan';
import type { Plan, PlanFormData } from '@/types/plan';

type PlanFormProps = {
  plan?: Plan;
  onSuccess: (plan: Plan) => void;
  onCancel: () => void;
};

export function PlanForm({ plan, onSuccess, onCancel }: PlanFormProps): JSX.Element {
  const t = useTranslations('PlanForm');
  const isEditing = Boolean(plan);
  const { createPlan, updatePlan, isCreating, isUpdating, error, clearError } = usePlanMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: plan
      ? {
          planCode: plan.planCode,
          planName: plan.planName,
          planYear: plan.planYear,
          planMonth: plan.planMonth,
          totalTargetQuantity: plan.totalTargetQuantity || 0,
          totalActualQuantity: plan.totalActualQuantity || 0,
          status: plan.status || '',
          planStartDate: plan.planStartDate || undefined,
          planEndDate: plan.planEndDate || undefined,
          approvedBy: plan.approvedBy || '',
          approvedAt: plan.approvedAt || undefined,
          note: plan.note || '',
        }
      : {
          planCode: '',
          planName: '',
          planYear: 0,
          planMonth: 0,
          totalTargetQuantity: 0,
          totalActualQuantity: 0,
          status: '',
          planStartDate: new Date().toISOString().slice(0, 10),
          planEndDate: new Date().toISOString().slice(0, 10),
          approvedBy: '',
          approvedAt: new Date().toISOString().slice(0, 10),
          note: '',
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

  const onSubmit = async (data: PlanFormData): Promise<void> => {
    try {
      if (isEditing && plan) {
        const updatedPlan = await updatePlan(plan.id, data);
        onSuccess(updatedPlan);
      } else {
        const newPlan = await createPlan(data);
        onSuccess(newPlan);
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

  // Logic: Khi nhập xong Plan Code, nếu đúng định dạng MMYYYY thì tự động set Plan Month, Plan Year, Plan Name
  const handlePlanCodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    // Định dạng MMYYYY (2 số đầu là tháng, 4 số cuối là năm)
    const match = value.match(/^(0[1-9]|1[0-2])(20\d{2})$/);
    if (match && match[1] && match[2]) {
      const mm = Number.parseInt(String(match[1]), 10);
      const yyyy = Number.parseInt(String(match[2]), 10);
      setValue('planMonth', mm, { shouldValidate: true, shouldDirty: true });
      setValue('planYear', yyyy, { shouldValidate: true, shouldDirty: true });
      // Chỉ set Plan Name nếu người dùng chưa sửa (giá trị hiện tại trùng với planCode hoặc rỗng)
      const currentPlanName = getValues('planName');
      const currentPlanCode = getValues('planCode') || '';
      if (!currentPlanName || currentPlanName === currentPlanCode) {
        setValue('planName', value, { shouldValidate: true, shouldDirty: true });
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-green-50 p-6 rounded-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Header */}
        <div className="text-center pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditing ? (t('edit_plan') || 'Edit Plan') : (t('create_plan') || 'Create Plan')}
          </h2>
          <p className="text-gray-600">
            {isEditing 
              ? (t('update_plan_description') || 'Update production plan configuration') 
              : (t('create_plan_description') || 'Create a new production plan and schedule')}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="text-sm text-red-700">Error: {error}</div>
          </div>
        )}

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Code Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <FileText className="w-4 h-4 mr-2 text-green-500" />
              {t('plan_code') || 'Plan Code'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="planCode"
              type="text"
              {...register('planCode')}
              aria-required="true"
              aria-describedby={errors.planCode ? 'planCode-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.planCode 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('plan_code_placeholder') || 'e.g., 012025'}
              onBlur={handlePlanCodeBlur}
            />
            {errors.planCode && (
              <p id="planCode-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.planCode.message}
              </p>
            )}
          </div>

          {/* Plan Name Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <CalendarDays className="w-4 h-4 mr-2 text-green-500" />
              {t('plan_name') || 'Plan Name'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="planName"
              type="text"
              {...register('planName')}
              aria-required="true"
              aria-describedby={errors.planName ? 'planName-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.planName 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('plan_name_placeholder') || 'Enter plan name'}
            />
            {errors.planName && (
              <p id="planName-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.planName.message}
              </p>
            )}
          </div>

          {/* Plan Year Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Calendar className="w-4 h-4 mr-2 text-green-500" />
              {t('plan_year') || 'Plan Year'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="planYear"
              type="number"
              {...register('planYear', { valueAsNumber: true })}
              aria-required="true"
              aria-describedby={errors.planYear ? 'planYear-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.planYear 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('plan_year_placeholder') || '2025'}
            />
            {errors.planYear && (
              <p id="planYear-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.planYear.message}
              </p>
            )}
          </div>

          {/* Plan Month Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Clock className="w-4 h-4 mr-2 text-green-500" />
              {t('plan_month') || 'Plan Month'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="planMonth"
              type="number"
              {...register('planMonth', { valueAsNumber: true })}
              aria-required="true"
              aria-describedby={errors.planMonth ? 'planMonth-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.planMonth 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('plan_month_placeholder') || '1-12'}
            />
            {errors.planMonth && (
              <p id="planMonth-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.planMonth.message}
              </p>
            )}
          </div>

          {/* Total Target Quantity Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Target className="w-4 h-4 mr-2 text-green-500" />
              {t('total_target_quantity') || 'Target Quantity'}
            </label>
            <input
              id="totalTargetQuantity"
              type="number"
              {...register('totalTargetQuantity', { valueAsNumber: true })}
              aria-describedby={errors.totalTargetQuantity ? 'totalTargetQuantity-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.totalTargetQuantity 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('total_target_quantity_placeholder') || 'e.g., 1000'}
            />
            {errors.totalTargetQuantity && (
              <p id="totalTargetQuantity-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.totalTargetQuantity.message}
              </p>
            )}
          </div>

          {/* Total Actual Quantity Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              {t('total_actual_quantity') || 'Actual Quantity'}
            </label>
            <input
              id="totalActualQuantity"
              type="number"
              {...register('totalActualQuantity', { valueAsNumber: true })}
              aria-describedby={errors.totalActualQuantity ? 'totalActualQuantity-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.totalActualQuantity 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('total_actual_quantity_placeholder') || 'e.g., 850'}
            />
            {errors.totalActualQuantity && (
              <p id="totalActualQuantity-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.totalActualQuantity.message}
              </p>
            )}
          </div>

          {/* Status Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              {t('status') || 'Status'}
            </label>
            <input
              id="status"
              type="text"
              {...register('status')}
              aria-describedby={errors.status ? 'status-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.status 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('status_placeholder') || 'e.g., In Progress, Completed'}
            />
            {errors.status && (
              <p id="status-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.status.message}
              </p>
            )}
          </div>

          {/* Plan Start Date Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Calendar className="w-4 h-4 mr-2 text-green-500" />
              {t('plan_start_date') || 'Start Date'}
            </label>
            <input
              id="planStartDate"
              type="date"
              {...register('planStartDate')}
              aria-describedby={errors.planStartDate ? 'planStartDate-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.planStartDate 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
            />
            {errors.planStartDate && (
              <p id="planStartDate-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.planStartDate.message}
              </p>
            )}
          </div>

          {/* Plan End Date Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Calendar className="w-4 h-4 mr-2 text-green-500" />
              {t('plan_end_date') || 'End Date'}
            </label>
            <input
              id="planEndDate"
              type="date"
              {...register('planEndDate')}
              aria-describedby={errors.planEndDate ? 'planEndDate-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.planEndDate 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
            />
            {errors.planEndDate && (
              <p id="planEndDate-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.planEndDate.message}
              </p>
            )}
          </div>

          {/* Approved By Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Users className="w-4 h-4 mr-2 text-green-500" />
              {t('approved_by') || 'Approved By'}
            </label>
            <input
              id="approvedBy"
              type="text"
              {...register('approvedBy')}
              aria-describedby={errors.approvedBy ? 'approvedBy-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.approvedBy 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('approved_by_placeholder') || 'Enter approver name'}
            />
            {errors.approvedBy && (
              <p id="approvedBy-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.approvedBy.message}
              </p>
            )}
          </div>

          {/* Approved At Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Calendar className="w-4 h-4 mr-2 text-green-500" />
              {t('approved_at') || 'Approved Date'}
            </label>
            <input
              id="approvedAt"
              type="date"
              {...register('approvedAt')}
              aria-describedby={errors.approvedAt ? 'approvedAt-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.approvedAt 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
            />
            {errors.approvedAt && (
              <p id="approvedAt-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.approvedAt.message}
              </p>
            )}
          </div>

          {/* Notes Field - Full Width */}
          <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <StickyNote className="w-4 h-4 mr-2 text-green-500" />
              {t('note') || 'Notes'}
            </label>
            <textarea
              id="note"
              rows={4}
              {...register('note')}
              aria-describedby={errors.note ? 'note-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${
                errors.note 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('note_placeholder') || 'Additional notes about the plan...'}
            />
            {errors.note && (
              <p id="note-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.note.message}
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
            {t('cancel') || 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
          >
            {t('reset') || 'Reset'}
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            )}
            {isSubmitting
              ? isEditing
                ? (t('updating') || 'Updating...')
                : (t('creating') || 'Creating...')
              : isEditing
                ? (t('update_plan') || 'Update Plan')
                : (t('create_plan') || 'Create Plan')}
          </button>
        </div>
      </form>
    </div>
  );
}
