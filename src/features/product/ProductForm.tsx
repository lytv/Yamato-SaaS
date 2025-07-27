/**
 * ProductForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing products with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Package, FileText, Tag, StickyNote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useProductMutations } from '@/hooks/useProductMutations';
import { productFormSchema } from '@/libs/validations/product';
import type { Product, ProductFormData } from '@/types/product';

type ProductFormProps = {
  product?: Product;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
};

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps): JSX.Element {
  const t = useTranslations('product.form');
  const isEditing = Boolean(product);
  const { createProduct, updateProduct, isCreating, isUpdating, error, clearError } = useProductMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          productCode: product.productCode,
          productName: product.productName,
          category: product.category || '',
          notes: product.notes || '',
        }
      : {
          productCode: '',
          productName: '',
          category: '',
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

  const onSubmit = async (data: ProductFormData): Promise<void> => {
    try {
      if (isEditing && product) {
        const updatedProduct = await updateProduct(product.id, data);
        onSuccess(updatedProduct);
      } else {
        const newProduct = await createProduct(data);
        onSuccess(newProduct);
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
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Header */}
        <div className="text-center pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditing ? t('edit_title') : t('title')}
          </h2>
          <p className="text-gray-600">
            {isEditing ? 'Update product information' : 'Create a new product'}
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
          {/* Product Code Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              {t('productCode')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="productCode"
              type="text"
              {...register('productCode')}
              aria-required="true"
              aria-describedby={errors.productCode ? 'productCode-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.productCode 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('productCode_placeholder')}
            />
            {errors.productCode && (
              <p id="productCode-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.productCode.message}
              </p>
            )}
          </div>

          {/* Product Name Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Package className="w-4 h-4 mr-2 text-blue-500" />
              {t('productName')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="productName"
              type="text"
              {...register('productName')}
              aria-required="true"
              aria-describedby={errors.productName ? 'productName-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.productName 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('productName_placeholder')}
            />
            {errors.productName && (
              <p id="productName-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.productName.message}
              </p>
            )}
          </div>

          {/* Category Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Tag className="w-4 h-4 mr-2 text-blue-500" />
              {t('category')}
            </label>
            <input
              id="category"
              type="text"
              {...register('category')}
              aria-describedby={errors.category ? 'category-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.category 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder={t('category_placeholder')}
            />
            {errors.category && (
              <p id="category-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Notes Field - Full Width */}
          <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <StickyNote className="w-4 h-4 mr-2 text-blue-500" />
              {t('notes')}
            </label>
            <textarea
              id="notes"
              rows={4}
              {...register('notes')}
              aria-describedby={errors.notes ? 'notes-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
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
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
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
