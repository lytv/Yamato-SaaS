/**
 * OutsourceOrderDetail Form Component
 * Generated based on existing pattern from OutsourceOrderForm.tsx
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateOutsourceOrderDetail, useUpdateOutsourceOrderDetail } from '@/hooks/useOutsourceOrderDetailMutations';
import { useOutsourceOrderDetailRelationOptions } from '@/hooks/useOutsourceOrderDetails';
import { outsourceOrderDetailFormSchema } from '@/libs/validations/outsourceOrderDetail';
import type { OutsourceOrderDetailFormData } from '@/types/outsourceOrderDetail';

type OutsourceOrderDetailFormProps = {
  outsourceOrderDetail?: OutsourceOrderDetailFormData;
  outsourceOrderId: number;
  isEditing: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};

export function OutsourceOrderDetailForm({
  outsourceOrderDetail,
  outsourceOrderId,
  isEditing,
  onSuccess,
  onCancel,
}: OutsourceOrderDetailFormProps) {
  const [selectedPlan, setSelectedPlan] = useState<{ id: number; planCode: string; planName: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; productCode: string; productName: string } | null>(null);
  const [selectedStep, setSelectedStep] = useState<{ id: number; stepCode: string; stepName: string } | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const createMutation = useCreateOutsourceOrderDetail();
  const updateMutation = useUpdateOutsourceOrderDetail();
  const { data: relationOptions, isLoading: isLoadingOptions, error: optionsError } = useOutsourceOrderDetailRelationOptions(outsourceOrderId);

  const t = useTranslations('OrderDetailForm');

  // Tính ngày hiện tại + 30 ngày
  const today = new Date();
  const defaultExpectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)
    .toISOString().split('T')[0];

  const form = useForm<OutsourceOrderDetailFormData>({
    resolver: zodResolver(outsourceOrderDetailFormSchema),
    defaultValues: {
      outsourceOrderId,
      planId: 0,
      productId: 0,
      productionStepId: 0,
      planCode: '',
      planName: '',
      productCode: '',
      productName: '',
      stepCode: '',
      stepName: '',
      orderedQuantity: 1,
      completedQuantity: 0,
      expectedCompletionDate: outsourceOrderDetail?.expectedCompletionDate || defaultExpectedDate,
      actualCompletionDate: undefined,
      status: 'pending',
      itemNotes: undefined,
      ...outsourceOrderDetail,
    },
  });

  const { watch, setValue } = form;
  const orderedQuantity = watch('orderedQuantity');
  const unitPrice = watch('unitPrice');

  // Auto-calculate total price
  useEffect(() => {
    if (orderedQuantity && unitPrice) {
      const total = orderedQuantity * unitPrice;
      setValue('totalPrice', total);
    }
  }, [orderedQuantity, unitPrice, setValue]);

  // Set selected options on edit
  useEffect(() => {
    if (isEditing && outsourceOrderDetail && relationOptions) {
      const plan = relationOptions.plans.find(p => p.id === outsourceOrderDetail.planId);
      const product = relationOptions.products.find(p => p.id === outsourceOrderDetail.productId);
      const step = relationOptions.productionSteps.find(s => s.id === outsourceOrderDetail.productionStepId);

      if (plan) {
        setSelectedPlan(plan);
      }
      if (product) {
        setSelectedProduct(product);
      }
      if (step) {
        setSelectedStep(step);
      }
    }
  }, [isEditing, outsourceOrderDetail, relationOptions]);

  const handlePlanChange = (planId: string) => {
    const plan = relationOptions?.plans.find(p => p.id === Number(planId));
    if (plan) {
      setSelectedPlan(plan);
      setValue('planId', plan.id);
      setValue('planCode', plan.planCode);
      setValue('planName', plan.planName);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = relationOptions?.products.find(p => p.id === Number(productId));
    if (product) {
      setSelectedProduct(product);
      setValue('productId', product.id);
      setValue('productCode', product.productCode);
      setValue('productName', product.productName);
    }
  };

  const handleStepChange = (stepId: string) => {
    const step = relationOptions?.productionSteps.find(s => s.id === Number(stepId));
    if (step) {
      setSelectedStep(step);
      setValue('productionStepId', step.id);
      setValue('stepCode', step.stepCode);
      setValue('stepName', step.stepName);
    }
  };

  const onSubmit = async (data: OutsourceOrderDetailFormData) => {
    try {
      // Validate required fields
      if (!data.planId || !data.productId || !data.productionStepId) {
        return;
      }

      if (isEditing && outsourceOrderDetail) {
        await updateMutation.mutateAsync({
          id: (outsourceOrderDetail as any).id,
          data: {
            ...data,
            expectedCompletionDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : undefined,
            actualCompletionDate: data.actualCompletionDate ? new Date(data.actualCompletionDate) : undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          expectedCompletionDate: new Date(data.expectedCompletionDate),
          actualCompletionDate: data.actualCompletionDate ? new Date(data.actualCompletionDate) : undefined,
        });
      }

      onSuccess();
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Form submission error:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Helper lấy yyyy-mm-dd từ string | Date | undefined
  function getDateInputValue(val: string | Date | undefined): string {
    if (!val) {
      return '';
    }
    if (typeof val === 'string') {
      return val.includes('T') ? (val.split('T')[0] || '') : val;
    }
    if (val instanceof Date && !Number.isNaN(val.getTime())) {
      return (val.toISOString().split('T')[0] || '');
    }
    return '';
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">
          {isEditing ? t('edit_title') : t('add_title')}
        </h2>
        <p className="text-sm text-gray-600">
          {isEditing ? t('edit_description') : t('add_description')}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Plan Selection */}
          <FormField
            control={form.control}
            name="planId"
            render={_ => (
              <FormItem className="flex flex-row items-center gap-x-2">
                <FormLabel className="min-w-[120px]">
                  {t('plan')}
                  <span> *</span>
                </FormLabel>
                <Select
                  onValueChange={handlePlanChange}
                  value={selectedPlan?.id.toString() || ''}
                  disabled={isLoadingOptions}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingOptions
                          ? t('loading_plans')
                          : relationOptions?.plans.length === 0
                            ? t('no_plans_available')
                            : t('select_plan')
                      }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingOptions
                      ? (
                          <SelectItem value="loading" disabled>{t('loading_plans')}</SelectItem>
                        )
                      : relationOptions?.plans.length === 0
                        ? (
                            <SelectItem value="empty" disabled>{t('no_plans_available')}</SelectItem>
                          )
                        : (
                            relationOptions?.plans.map(plan => (
                              <SelectItem key={plan.id} value={plan.id.toString()}>
                                {plan.planCode}
                                {' '}
                                -
                                {' '}
                                {plan.planName}
                              </SelectItem>
                            ))
                          )}
                  </SelectContent>
                </Select>
                {optionsError && (
                  <p className="text-sm text-red-500">
                    {t('error_loading_plans')}
                    {': '}
                    {optionsError.message}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product Selection */}
          <FormField
            control={form.control}
            name="productId"
            render={_ => (
              <FormItem className="flex flex-row items-center gap-x-2">
                <FormLabel className="min-w-[120px]">
                  {t('product')}
                  <span> *</span>
                </FormLabel>
                <Select
                  onValueChange={handleProductChange}
                  value={selectedProduct?.id.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_product')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationOptions?.products.map(product => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.productCode}
                        {' '}
                        -
                        {' '}
                        {product.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Production Step Selection */}
          <FormField
            control={form.control}
            name="productionStepId"
            render={_ => (
              <FormItem className="flex flex-row items-center gap-x-2">
                <FormLabel className="min-w-[120px]">
                  {t('production_step')}
                  {' '}
                  *
                </FormLabel>
                <Select
                  onValueChange={handleStepChange}
                  value={selectedStep?.id.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_production_step')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationOptions?.productionSteps.map(step => (
                      <SelectItem key={step.id} value={step.id.toString()}>
                        {step.stepCode}
                        {' '}
                        -
                        {step.stepName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ordered Quantity */}
          <FormField
            control={form.control}
            name="orderedQuantity"
            render={_ => (
              <FormItem className="flex flex-row items-center gap-x-2">
                <FormLabel className="min-w-[120px]">
                  {t('ordered_quantity')}
                  {' '}
                  *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...form.register('orderedQuantity', { valueAsNumber: true })}
                    placeholder={t('ordered_quantity_placeholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expected Completion Date */}
          <FormField
            control={form.control}
            name="expectedCompletionDate"
            render={_ => (
              <FormItem className="flex flex-row items-center gap-x-2">
                <FormLabel className="min-w-[120px]">
                  {t('expected_completion_date')}
                  {' '}
                  *
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...form.register('expectedCompletionDate')}
                    value={getDateInputValue(form.watch('expectedCompletionDate')) || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nút toggle advanced fields */}
          <div className="mb-2">
            <button
              type="button"
              className="text-sm text-blue-600 underline"
              onClick={() => setShowAdvancedFields(v => !v)}
            >
              {showAdvancedFields ? t('hide_advanced') : t('show_advanced')}
            </button>
          </div>

          {/* Các trường nâng cao */}
          {showAdvancedFields && (
            <>
              {/* Completed Quantity */}
              <FormField
                control={form.control}
                name="completedQuantity"
                render={_ => (
                  <FormItem className="flex flex-row items-center gap-x-2">
                    <FormLabel className="min-w-[120px]">{t('completed_quantity')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...form.register('completedQuantity', { valueAsNumber: true })}
                        placeholder={t('completed_quantity_placeholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={_ => (
                  <FormItem className="flex flex-row items-center gap-x-2">
                    <FormLabel className="min-w-[120px]">{t('status')}</FormLabel>
                    <Select onValueChange={value => form.setValue('status', value)} value={String(form.watch('status') ?? '')}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('status_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">{t('pending')}</SelectItem>
                        <SelectItem value="in_progress">{t('in_progress')}</SelectItem>
                        <SelectItem value="completed">{t('completed')}</SelectItem>
                        <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actual Completion Date */}
              <FormField
                control={form.control}
                name="actualCompletionDate"
                render={_ => (
                  <FormItem className="flex flex-row items-center gap-x-2">
                    <FormLabel className="min-w-[120px]">{t('actual_completion_date')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...form.register('actualCompletionDate')}
                        value={getDateInputValue(form.watch('actualCompletionDate')) || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="itemNotes"
                render={_ => (
                  <FormItem className="flex flex-row items-center gap-x-2">
                    <FormLabel className="min-w-[120px]">{t('notes')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...form.register('itemNotes')}
                        placeholder={t('notes_placeholder')}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4 border-t pt-4">
            {/* Form Validation Status */}
            {!form.formState.isValid && (
              <div className="mr-auto text-sm text-red-500">
                {t('required')}
              </div>
            )}

            {/* Show mutation errors */}
            {(createMutation.error || updateMutation.error) && (
              <div className="mr-auto text-sm text-red-500">
                Error:
                {' '}
                {createMutation.error?.message || updateMutation.error?.message}
              </div>
            )}

            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !form.formState.isValid}>
              {isLoading
                ? (isEditing ? t('updating') : t('creating'))
                : (isEditing ? t('update') : t('create'))}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
