/**
 * ProductionStepDetailForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing production step details with validation
 */

import { useAuth } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useProductionStepDetailMutations } from '@/hooks/useProductionStepDetailMutations';
import { useProductionSteps } from '@/hooks/useProductionSteps';
import { useProducts } from '@/hooks/useProducts';
import { productionStepDetailFormSchema } from '@/libs/validations/productionStepDetail';
import type { ProductionStepDetail, ProductionStepDetailFormData } from '@/types/productionStepDetail';

type ProductionStepDetailFormProps = {
  productionStepDetail?: ProductionStepDetail;
  onSuccess: (productionStepDetail: ProductionStepDetail) => void;
  onCancel: () => void;
};

export function ProductionStepDetailForm({ productionStepDetail, onSuccess, onCancel }: ProductionStepDetailFormProps): JSX.Element {
  const { userId, orgId } = useAuth();
  const ownerId = orgId || userId || '';
  const isEditing = Boolean(productionStepDetail);

  const { createProductionStepDetail, updateProductionStepDetail, isCreating, isUpdating, error, clearError } = useProductionStepDetailMutations();

  // Load products and production steps for dropdowns
  const { products } = useProducts({ ownerId, limit: 100 }); // Get all products for dropdown
  const { productionSteps } = useProductionSteps({ ownerId, limit: 100 }); // Get all production steps for dropdown

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ProductionStepDetailFormData>({
    resolver: zodResolver(productionStepDetailFormSchema),
    defaultValues: productionStepDetail
      ? {
          productId: productionStepDetail.productId,
          productionStepId: productionStepDetail.productionStepId,
          sequenceNumber: productionStepDetail.sequenceNumber,
          factoryPrice: productionStepDetail.factoryPrice || '',
          calculatedPrice: productionStepDetail.calculatedPrice || '',
          quantityLimit1: productionStepDetail.quantityLimit1 || undefined,
          quantityLimit2: productionStepDetail.quantityLimit2 || undefined,
          isFinalStep: productionStepDetail.isFinalStep || false,
          isVtStep: productionStepDetail.isVtStep || false,
          isParkingStep: productionStepDetail.isParkingStep || false,
        }
      : {
          productId: 0,
          productionStepId: 0,
          sequenceNumber: 1,
          factoryPrice: '',
          calculatedPrice: '',
          quantityLimit1: undefined,
          quantityLimit2: undefined,
          isFinalStep: false,
          isVtStep: false,
          isParkingStep: false,
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

  const onSubmit = async (data: ProductionStepDetailFormData): Promise<void> => {
    try {
      if (isEditing && productionStepDetail) {
        const updatedDetail = await updateProductionStepDetail(productionStepDetail.id, data);
        onSuccess(updatedDetail);
      } else {
        const newDetail = await createProductionStepDetail(data);
        onSuccess(newDetail);
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

      {/* Product Selection */}
      <div>
        <label
          htmlFor="productId"
          className="block text-sm font-medium text-gray-700"
        >
          Product *
        </label>
        <select
          id="productId"
          {...register('productId', { valueAsNumber: true })}
          aria-required="true"
          aria-describedby={errors.productId ? 'productId-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.productId ? 'border-red-300' : ''
          }`}
        >
          <option value={0}>Select a product...</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.productCode}
              {' '}
              -
              {product.productName}
            </option>
          ))}
        </select>
        {errors.productId && (
          <p id="productId-error" className="mt-2 text-sm text-red-600">
            {errors.productId.message}
          </p>
        )}
      </div>

      {/* Production Step Selection */}
      <div>
        <label
          htmlFor="productionStepId"
          className="block text-sm font-medium text-gray-700"
        >
          Production Step *
        </label>
        <select
          id="productionStepId"
          {...register('productionStepId', { valueAsNumber: true })}
          aria-required="true"
          aria-describedby={errors.productionStepId ? 'productionStepId-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.productionStepId ? 'border-red-300' : ''
          }`}
        >
          <option value={0}>Select a production step...</option>
          {productionSteps.map(step => (
            <option key={step.id} value={step.id}>
              {step.stepCode}
              {' '}
              -
              {step.stepName}
            </option>
          ))}
        </select>
        {errors.productionStepId && (
          <p id="productionStepId-error" className="mt-2 text-sm text-red-600">
            {errors.productionStepId.message}
          </p>
        )}
      </div>

      {/* Sequence Number */}
      <div>
        <label
          htmlFor="sequenceNumber"
          className="block text-sm font-medium text-gray-700"
        >
          Sequence Number *
        </label>
        <input
          id="sequenceNumber"
          type="number"
          min="1"
          step="1"
          {...register('sequenceNumber', { valueAsNumber: true })}
          aria-required="true"
          aria-describedby={errors.sequenceNumber ? 'sequenceNumber-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.sequenceNumber ? 'border-red-300' : ''
          }`}
          placeholder="e.g., 1"
        />
        {errors.sequenceNumber && (
          <p id="sequenceNumber-error" className="mt-2 text-sm text-red-600">
            {errors.sequenceNumber.message}
          </p>
        )}
      </div>

      {/* Pricing Fields */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Factory Price */}
        <div>
          <label
            htmlFor="factoryPrice"
            className="block text-sm font-medium text-gray-700"
          >
            Factory Price
          </label>
          <input
            id="factoryPrice"
            type="text"
            {...register('factoryPrice')}
            aria-describedby={errors.factoryPrice ? 'factoryPrice-error' : undefined}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.factoryPrice ? 'border-red-300' : ''
            }`}
            placeholder="e.g., 100.50"
          />
          {errors.factoryPrice && (
            <p id="factoryPrice-error" className="mt-2 text-sm text-red-600">
              {errors.factoryPrice.message}
            </p>
          )}
        </div>

        {/* Calculated Price */}
        <div>
          <label
            htmlFor="calculatedPrice"
            className="block text-sm font-medium text-gray-700"
          >
            Calculated Price
          </label>
          <input
            id="calculatedPrice"
            type="text"
            {...register('calculatedPrice')}
            aria-describedby={errors.calculatedPrice ? 'calculatedPrice-error' : undefined}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.calculatedPrice ? 'border-red-300' : ''
            }`}
            placeholder="e.g., 110.75"
          />
          {errors.calculatedPrice && (
            <p id="calculatedPrice-error" className="mt-2 text-sm text-red-600">
              {errors.calculatedPrice.message}
            </p>
          )}
        </div>
      </div>

      {/* Quantity Limits */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Quantity Limit 1 */}
        <div>
          <label
            htmlFor="quantityLimit1"
            className="block text-sm font-medium text-gray-700"
          >
            Quantity Limit 1
          </label>
          <input
            id="quantityLimit1"
            type="number"
            min="0"
            step="1"
            {...register('quantityLimit1', { valueAsNumber: true })}
            aria-describedby={errors.quantityLimit1 ? 'quantityLimit1-error' : undefined}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.quantityLimit1 ? 'border-red-300' : ''
            }`}
            placeholder="e.g., 1000"
          />
          {errors.quantityLimit1 && (
            <p id="quantityLimit1-error" className="mt-2 text-sm text-red-600">
              {errors.quantityLimit1.message}
            </p>
          )}
        </div>

        {/* Quantity Limit 2 */}
        <div>
          <label
            htmlFor="quantityLimit2"
            className="block text-sm font-medium text-gray-700"
          >
            Quantity Limit 2
          </label>
          <input
            id="quantityLimit2"
            type="number"
            min="0"
            step="1"
            {...register('quantityLimit2', { valueAsNumber: true })}
            aria-describedby={errors.quantityLimit2 ? 'quantityLimit2-error' : undefined}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.quantityLimit2 ? 'border-red-300' : ''
            }`}
            placeholder="e.g., 2000"
          />
          {errors.quantityLimit2 && (
            <p id="quantityLimit2-error" className="mt-2 text-sm text-red-600">
              {errors.quantityLimit2.message}
            </p>
          )}
        </div>
      </div>

      {/* Special Step Flags */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700">Special Step Flags</div>

        <div className="space-y-3">
          {/* Final Step */}
          <div className="flex items-center">
            <input
              id="isFinalStep"
              type="checkbox"
              {...register('isFinalStep')}
              className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isFinalStep" className="ml-2 text-sm text-gray-700">
              Final Step
            </label>
          </div>

          {/* VT Step */}
          <div className="flex items-center">
            <input
              id="isVtStep"
              type="checkbox"
              {...register('isVtStep')}
              className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isVtStep" className="ml-2 text-sm text-gray-700">
              VT Step
            </label>
          </div>

          {/* Parking Step */}
          <div className="flex items-center">
            <input
              id="isParkingStep"
              type="checkbox"
              {...register('isParkingStep')}
              className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isParkingStep" className="ml-2 text-sm text-gray-700">
              Parking Step
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? isEditing
              ? 'Updating...'
              : 'Creating...'
            : isEditing
              ? 'Update Production Step Detail'
              : 'Create Production Step Detail'}
        </button>
      </div>
    </form>
  );
}
