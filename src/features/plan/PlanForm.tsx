/**
 * PlanForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing plans with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <Tabs defaultValue="required" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="required">{t('tab_required')}</TabsTrigger>
          <TabsTrigger value="dates">{t('tab_dates')}</TabsTrigger>
          <TabsTrigger value="notes">{t('tab_notes')}</TabsTrigger>
        </TabsList>

        {/* Tab 1: Required Fields */}
        <TabsContent value="required" className="space-y-4">
          {/* Plan Code Field */}
          <div>
            <label
              htmlFor="planCode"
              className="block text-sm font-medium text-gray-700"
            >
              {t('plan_code')}
              {' '}
              *
            </label>
            <input
              id="planCode"
              type="text"
              {...register('planCode')}
              aria-required="true"
              aria-describedby={errors.planCode ? 'planCode-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.planCode ? 'border-red-300' : ''
              }`}
              placeholder={t('plan_code_placeholder')}
              onBlur={handlePlanCodeBlur}
            />
            {errors.planCode && (
              <p id="planCode-error" className="mt-2 text-sm text-red-600">
                {errors.planCode.message}
              </p>
            )}
          </div>

          {/* Plan Name Field */}
          <div>
            <label
              htmlFor="planName"
              className="block text-sm font-medium text-gray-700"
            >
              {t('plan_name')}
              {' '}
              *
            </label>
            <input
              id="planName"
              type="text"
              {...register('planName')}
              aria-required="true"
              aria-describedby={errors.planName ? 'planName-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.planName ? 'border-red-300' : ''
              }`}
              placeholder={t('plan_name_placeholder')}
            />
            {errors.planName && (
              <p id="planName-error" className="mt-2 text-sm text-red-600">
                {errors.planName.message}
              </p>
            )}
          </div>

          {/* Plan Year Field */}
          <div>
            <label
              htmlFor="planYear"
              className="block text-sm font-medium text-gray-700"
            >
              {t('plan_year')}
              {' '}
              *
            </label>
            <input
              id="planYear"
              type="number"
              {...register('planYear', { valueAsNumber: true })}
              aria-required="true"
              aria-describedby={errors.planYear ? 'planYear-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.planYear ? 'border-red-300' : ''
              }`}
              placeholder={t('plan_year_placeholder')}
            />
            {errors.planYear && (
              <p id="planYear-error" className="mt-2 text-sm text-red-600">
                {errors.planYear.message}
              </p>
            )}
          </div>

          {/* Plan Month Field */}
          <div>
            <label
              htmlFor="planMonth"
              className="block text-sm font-medium text-gray-700"
            >
              {t('plan_month')}
              {' '}
              *
            </label>
            <input
              id="planMonth"
              type="number"
              {...register('planMonth', { valueAsNumber: true })}
              aria-required="true"
              aria-describedby={errors.planMonth ? 'planMonth-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.planMonth ? 'border-red-300' : ''
              }`}
              placeholder={t('plan_month_placeholder')}
            />
            {errors.planMonth && (
              <p id="planMonth-error" className="mt-2 text-sm text-red-600">
                {errors.planMonth.message}
              </p>
            )}
          </div>

          {/* Total Target Quantity Field */}
          <div>
            <label
              htmlFor="totalTargetQuantity"
              className="block text-sm font-medium text-gray-700"
            >
              {t('total_target_quantity')}
            </label>
            <input
              id="totalTargetQuantity"
              type="number"
              {...register('totalTargetQuantity', { valueAsNumber: true })}
              aria-describedby={errors.totalTargetQuantity ? 'totalTargetQuantity-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.totalTargetQuantity ? 'border-red-300' : ''
              }`}
              placeholder={t('total_target_quantity_placeholder')}
            />
            {errors.totalTargetQuantity && (
              <p id="totalTargetQuantity-error" className="mt-2 text-sm text-red-600">
                {errors.totalTargetQuantity.message}
              </p>
            )}
          </div>

          {/* Total Actual Quantity Field */}
          <div>
            <label
              htmlFor="totalActualQuantity"
              className="block text-sm font-medium text-gray-700"
            >
              {t('total_actual_quantity')}
            </label>
            <input
              id="totalActualQuantity"
              type="number"
              {...register('totalActualQuantity', { valueAsNumber: true })}
              aria-describedby={errors.totalActualQuantity ? 'totalActualQuantity-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.totalActualQuantity ? 'border-red-300' : ''
              }`}
              placeholder={t('total_actual_quantity_placeholder')}
            />
            {errors.totalActualQuantity && (
              <p id="totalActualQuantity-error" className="mt-2 text-sm text-red-600">
                {errors.totalActualQuantity.message}
              </p>
            )}
          </div>

          {/* Status Field */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              {t('status')}
            </label>
            <input
              id="status"
              type="text"
              {...register('status')}
              aria-describedby={errors.status ? 'status-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.status ? 'border-red-300' : ''
              }`}
              placeholder={t('status_placeholder')}
            />
            {errors.status && (
              <p id="status-error" className="mt-2 text-sm text-red-600">
                {errors.status.message}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Dates */}
        <TabsContent value="dates" className="space-y-4">
          {/* Plan Start Date Field */}
          <div>
            <label
              htmlFor="planStartDate"
              className="block text-sm font-medium text-gray-700"
            >
              {t('plan_start_date')}
            </label>
            <input
              id="planStartDate"
              type="date"
              {...register('planStartDate')}
              aria-describedby={errors.planStartDate ? 'planStartDate-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.planStartDate ? 'border-red-300' : ''
              }`}
            />
            {errors.planStartDate && (
              <p id="planStartDate-error" className="mt-2 text-sm text-red-600">
                {errors.planStartDate.message}
              </p>
            )}
          </div>

          {/* Plan End Date Field */}
          <div>
            <label
              htmlFor="planEndDate"
              className="block text-sm font-medium text-gray-700"
            >
              {t('plan_end_date')}
            </label>
            <input
              id="planEndDate"
              type="date"
              {...register('planEndDate')}
              aria-describedby={errors.planEndDate ? 'planEndDate-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.planEndDate ? 'border-red-300' : ''
              }`}
            />
            {errors.planEndDate && (
              <p id="planEndDate-error" className="mt-2 text-sm text-red-600">
                {errors.planEndDate.message}
              </p>
            )}
          </div>

          {/* Approved By Field */}
          <div>
            <label
              htmlFor="approvedBy"
              className="block text-sm font-medium text-gray-700"
            >
              {t('approved_by')}
            </label>
            <input
              id="approvedBy"
              type="text"
              {...register('approvedBy')}
              aria-describedby={errors.approvedBy ? 'approvedBy-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.approvedBy ? 'border-red-300' : ''
              }`}
              placeholder={t('approved_by_placeholder')}
            />
            {errors.approvedBy && (
              <p id="approvedBy-error" className="mt-2 text-sm text-red-600">
                {errors.approvedBy.message}
              </p>
            )}
          </div>

          {/* Approved At Field */}
          <div>
            <label
              htmlFor="approvedAt"
              className="block text-sm font-medium text-gray-700"
            >
              {t('approved_at')}
            </label>
            <input
              id="approvedAt"
              type="date"
              {...register('approvedAt')}
              aria-describedby={errors.approvedAt ? 'approvedAt-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.approvedAt ? 'border-red-300' : ''
              }`}
            />
            {errors.approvedAt && (
              <p id="approvedAt-error" className="mt-2 text-sm text-red-600">
                {errors.approvedAt.message}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Notes */}
        <TabsContent value="notes" className="space-y-4">
          {/* Note Field */}
          <div>
            <label
              htmlFor="note"
              className="block text-sm font-medium text-gray-700"
            >
              {t('note')}
            </label>
            <textarea
              id="note"
              rows={6}
              {...register('note')}
              aria-describedby={errors.note ? 'note-error' : undefined}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.note ? 'border-red-300' : ''
              }`}
              placeholder={t('note_placeholder')}
            />
            {errors.note && (
              <p id="note-error" className="mt-2 text-sm text-red-600">
                {errors.note.message}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
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
          disabled={!isValid || isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? t('saving') : isEditing ? t('update') : t('create')}
          {' '}
          {t('plan')}
        </button>
      </div>
    </form>
  );
}
