/**
 * ProductionStepDetailForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing production step details with validation
 */

import { useAuth } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

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
  const t = useTranslations('productionStepDetail.form');
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
    control,
  } = useForm<ProductionStepDetailFormData>({
    resolver: zodResolver(productionStepDetailFormSchema),
    defaultValues: productionStepDetail
      ? {
          productId: productionStepDetail.productId,
          productionStepId: productionStepDetail.productionStepId,
          sequenceNumber: productionStepDetail.sequenceNumber,
          factoryPrice: productionStepDetail.factoryPrice || '',
          calculatedPrice: productionStepDetail.calculatedPrice || '',
          retailPrice: productionStepDetail.retailPrice || '',
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
          retailPrice: '',
          quantityLimit1: undefined,
          quantityLimit2: undefined,
          isFinalStep: false,
          isVtStep: false,
          isParkingStep: false,
        },
    mode: 'onChange',
  });

  // Reset form when productionStepDetail changes AND dropdowns are loaded
  useEffect(() => {
    if (productionStepDetail && products.length > 0 && productionSteps.length > 0) {
      const formData = {
        productId: Number(productionStepDetail.productId),
        productionStepId: Number(productionStepDetail.productionStepId),
        sequenceNumber: productionStepDetail.sequenceNumber,
        factoryPrice: productionStepDetail.factoryPrice || '',
        calculatedPrice: productionStepDetail.calculatedPrice || '',
        retailPrice: productionStepDetail.retailPrice || '',
        quantityLimit1: productionStepDetail.quantityLimit1 || undefined,
        quantityLimit2: productionStepDetail.quantityLimit2 || undefined,
        isFinalStep: productionStepDetail.isFinalStep || false,
        isVtStep: productionStepDetail.isVtStep || false,
        isParkingStep: productionStepDetail.isParkingStep || false,
      };
      
      // Wait for dropdowns to be rendered then reset form
      setTimeout(() => {
        reset(formData);
      }, 100);
    }
  }, [productionStepDetail, products, productionSteps, reset]);

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
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-red-700 font-medium">{t('error')}</div>
          </div>
        </div>
      )}

      {/* HIGHLIGHT: Pricing Section - MOST IMPORTANT */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border-3 border-green-300 shadow-lg relative overflow-hidden">
        {/* Background decoration - smaller */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full opacity-20 transform translate-x-4 -translate-y-4"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-200 rounded-full opacity-20 transform -translate-x-3 translate-y-3"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-green-800 flex items-center">
              <div className="p-2 bg-green-600 rounded-lg mr-3 shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              💰 THÔNG TIN GIÁ - QUAN TRỌNG
            </h3>
            <div className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold shadow-md animate-pulse">
              TRỌNG TÂM
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Factory Price - Compact */}
            <div className="bg-white rounded-lg p-4 border-2 border-green-400 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-2">
                <div className="p-1.5 bg-green-100 rounded-md mr-2">
                  🏭
                </div>
                <label htmlFor="factoryPrice" className="text-base font-bold text-green-700">
                  {t('factoryPrice')}
                </label>
              </div>
              <input
                id="factoryPrice"
                type="text"
                {...register('factoryPrice')}
                aria-describedby={errors.factoryPrice ? 'factoryPrice-error' : undefined}
                className={`w-full text-lg font-semibold rounded-lg border-2 transition-all duration-200 px-4 py-3 ${
                  errors.factoryPrice 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : 'border-green-300 focus:border-green-500 focus:ring-green-200'
                } focus:ring-2 focus:outline-none bg-green-50`}
                placeholder={t('factoryPrice_placeholder')}
              />
              {errors.factoryPrice && (
                <p id="factoryPrice-error" className="mt-2 text-xs text-red-600 flex items-center font-medium">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.factoryPrice.message}
                </p>
              )}
            </div>

            {/* Calculated Price - Compact */}
            <div className="bg-white rounded-lg p-4 border-2 border-orange-400 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-2">
                <div className="p-1.5 bg-orange-100 rounded-md mr-2">
                  🛰️
                </div>
                <label htmlFor="calculatedPrice" className="text-base font-bold text-orange-700">
                  {t('calculatedPrice')}
                </label>
              </div>
              <input
                id="calculatedPrice"
                type="text"
                {...register('calculatedPrice')}
                aria-describedby={errors.calculatedPrice ? 'calculatedPrice-error' : undefined}
                className={`w-full text-lg font-semibold rounded-lg border-2 transition-all duration-200 px-4 py-3 ${
                  errors.calculatedPrice 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : 'border-orange-300 focus:border-orange-500 focus:ring-orange-200'
                } focus:ring-2 focus:outline-none bg-orange-50`}
                placeholder={t('calculatedPrice_placeholder')}
              />
              {errors.calculatedPrice && (
                <p id="calculatedPrice-error" className="mt-2 text-xs text-red-600 flex items-center font-medium">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.calculatedPrice.message}
                </p>
              )}
            </div>

            {/* Retail Price - Compact */}
            <div className="bg-white rounded-lg p-4 border-2 border-purple-400 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-2">
                <div className="p-1.5 bg-purple-100 rounded-md mr-2">
                  🏪
                </div>
                <label htmlFor="retailPrice" className="text-base font-bold text-purple-700">
                  {t('retailPrice')}
                </label>
              </div>
              <input
                id="retailPrice"
                type="text"
                {...register('retailPrice')}
                aria-describedby={errors.retailPrice ? 'retailPrice-error' : undefined}
                className={`w-full text-lg font-semibold rounded-lg border-2 transition-all duration-200 px-4 py-3 ${
                  errors.retailPrice 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : 'border-purple-300 focus:border-purple-500 focus:ring-purple-200'
                } focus:ring-2 focus:outline-none bg-purple-50`}
                placeholder={t('retailPrice_placeholder')}
              />
              {errors.retailPrice && (
                <p id="retailPrice-error" className="mt-2 text-xs text-red-600 flex items-center font-medium">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.retailPrice.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Information - Horizontal layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* Product Selection - Inline */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {t('product')} <span className="text-red-500 ml-1">*</span>
          </label>
          <Controller
            name="productId"
            control={control}
            render={({ field: { onChange, value, name } }) => (
              <select
                id="productId"
                name={name}
                value={value || 0}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                <option value={0}>{t('product_placeholder')}</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.productCode} - {product.productName}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.productId && (
            <p className="mt-1 text-xs text-red-600">{errors.productId.message}</p>
          )}
        </div>

        {/* Production Step Selection - Inline */}
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <label htmlFor="productionStepId" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {t('productionStep')} <span className="text-red-500 ml-1">*</span>
          </label>
          <Controller
            name="productionStepId"
            control={control}
            render={({ field: { onChange, value, name } }) => (
              <select
                id="productionStepId"
                name={name}
                value={value || 0}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
              >
                <option value={0}>{t('productionStep_placeholder')}</option>
                {productionSteps.map(step => (
                  <option key={step.id} value={step.id}>
                    {step.stepCode} - {step.stepName}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.productionStepId && (
            <p className="mt-1 text-xs text-red-600">{errors.productionStepId.message}</p>
          )}
        </div>

        {/* Sequence Number - Inline */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <label htmlFor="sequenceNumber" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            Thứ tự
          </label>
          <input
            id="sequenceNumber"
            type="number"
            min="1"
            step="1"
            {...register('sequenceNumber', { 
              setValueAs: (value) => value === '' ? 1 : Number(value)
            })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            placeholder={t('sequenceNumber_placeholder')}
          />
          {errors.sequenceNumber && (
            <p className="mt-1 text-xs text-red-600">{errors.sequenceNumber.message}</p>
          )}
        </div>

        {/* Quantity Limit 1 - Inline */}
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <label htmlFor="quantityLimit1" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Giới hạn số lượng 1
          </label>
          <input
            id="quantityLimit1"
            type="number"
            min="0"
            step="1"
            {...register('quantityLimit1', { 
              setValueAs: (value) => value === '' ? undefined : Number(value)
            })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none"
            placeholder="Số lượng giới hạn 1"
          />
          {errors.quantityLimit1 && (
            <p className="mt-1 text-xs text-red-600">{errors.quantityLimit1.message}</p>
          )}
        </div>

        {/* Quantity Limit 2 - Inline */}
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <label htmlFor="quantityLimit2" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Giới hạn số lượng 2
          </label>
          <input
            id="quantityLimit2"
            type="number"
            min="0"
            step="1"
            {...register('quantityLimit2', { 
              setValueAs: (value) => value === '' ? undefined : Number(value)
            })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
            placeholder="Số lượng giới hạn 2"
          />
          {errors.quantityLimit2 && (
            <p className="mt-1 text-xs text-red-600">{errors.quantityLimit2.message}</p>
          )}
        </div>
      </div>

      {/* Special Step Flags - Horizontal */}
      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center">
            <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h4a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            {t('specialStepFlags')}
          </h4>
          
          <div className="flex items-center space-x-6">
            {/* Final Step */}
            <div className="flex items-center">
              <input
                id="isFinalStep"
                type="checkbox"
                {...register('isFinalStep')}
                className="size-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="isFinalStep" className="ml-2 text-sm text-gray-700 cursor-pointer">
                {t('isFinalStep')}
              </label>
            </div>

            {/* VT Step */}
            <div className="flex items-center">
              <input
                id="isVtStep"
                type="checkbox"
                {...register('isVtStep')}
                className="size-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="isVtStep" className="ml-2 text-sm text-gray-700 cursor-pointer">
                {t('isVtStep')}
              </label>
            </div>

            {/* Parking Step */}
            <div className="flex items-center">
              <input
                id="isParkingStep"
                type="checkbox"
                {...register('isParkingStep')}
                className="size-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="isParkingStep" className="ml-2 text-sm text-gray-700 cursor-pointer">
                {t('isParkingStep')}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t('cancel')}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center rounded-lg border-2 border-yellow-300 bg-yellow-50 px-6 py-3 text-sm font-semibold text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400 focus:outline-none focus:ring-4 focus:ring-yellow-200 transition-all duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('reset')}
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isEditing ? t('updating') : t('creating')}
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isEditing ? t('updateProductionStepDetail') : t('createProductionStepDetail')}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
