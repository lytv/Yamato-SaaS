/**
 * OutsourceOrderDetail Form Component
 * Generated based on existing pattern from OutsourceOrderForm.tsx
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
          {isEditing ? 'Edit Order Detail' : 'Add Order Detail'}
        </h2>
        <p className="text-sm text-gray-600">
          {isEditing ? 'Update order detail information' : 'Add a new detail item to the order'}
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
                <FormLabel className="min-w-[120px]">Plan *</FormLabel>
                <Select
                  onValueChange={handlePlanChange}
                  value={selectedPlan?.id.toString() || ''}
                  disabled={isLoadingOptions}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingOptions
                          ? 'Loading plans...'
                          : relationOptions?.plans.length === 0
                            ? 'No plans available'
                            : 'Select plan...'
                      }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingOptions
                      ? (
                          <SelectItem value="loading" disabled>Loading plans...</SelectItem>
                        )
                      : relationOptions?.plans.length === 0
                        ? (
                            <SelectItem value="empty" disabled>No plans found</SelectItem>
                          )
                        : (
                            relationOptions?.plans.map(plan => (
                              <SelectItem key={plan.id} value={plan.id.toString()}>
                                {plan.planCode}
                                {' '}
                                -
                                {plan.planName}
                              </SelectItem>
                            ))
                          )}
                  </SelectContent>
                </Select>
                {optionsError && (
                  <p className="text-sm text-red-500">
                    Error loading plans:
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
                <FormLabel className="min-w-[120px]">Product *</FormLabel>
                <Select
                  onValueChange={handleProductChange}
                  value={selectedProduct?.id.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationOptions?.products.map(product => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.productCode}
                        {' '}
                        -
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
                <FormLabel className="min-w-[120px]">Production Step *</FormLabel>
                <Select
                  onValueChange={handleStepChange}
                  value={selectedStep?.id.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select production step..." />
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

          {/* Quantity and Pricing Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="orderedQuantity"
              render={_ => (
                <FormItem className="flex flex-row items-center gap-x-2">
                  <FormLabel className="min-w-[120px]">Ordered Quantity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...form.register('orderedQuantity', { valueAsNumber: true })}
                      placeholder="Enter quantity..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Xóa toàn bộ FormField cho unitPrice, totalPrice, sequenceNumber */}

          </div>

          {/* Expected Completion Date */}
          <FormField
            control={form.control}
            name="expectedCompletionDate"
            render={_ => (
              <FormItem className="flex flex-row items-center gap-x-2">
                <FormLabel className="min-w-[120px]">Expected Completion Date *</FormLabel>
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
              {showAdvancedFields ? 'Ẩn các trường nâng cao' : 'Hiện các trường nâng cao'}
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
                    <FormLabel className="min-w-[120px]">Completed Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...form.register('completedQuantity', { valueAsNumber: true })}
                        placeholder="Enter completed quantity..."
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
                    <FormLabel className="min-w-[120px]">Status</FormLabel>
                    <Select onValueChange={value => form.setValue('status', value)} value={String(form.watch('status') ?? '')}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <FormLabel className="min-w-[120px]">Actual Completion Date</FormLabel>
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
                    <FormLabel className="min-w-[120px]">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...form.register('itemNotes')}
                        placeholder="Additional notes about this detail item..."
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
                Please fill in all required fields
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
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !form.formState.isValid}>
              {isLoading
                ? (isEditing ? 'Updating...' : 'Creating...')
                : (isEditing ? 'Update Detail' : 'Create Detail')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
