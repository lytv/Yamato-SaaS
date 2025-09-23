/**
 * ProductForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing products with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Package, StickyNote, Tag } from 'lucide-react';
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
    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Header */}
        <div className="border-b border-gray-200 pb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Package className="size-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {isEditing ? t('edit_title') : t('title')}
          </h2>
          <p className="text-gray-600">
            {isEditing ? 'Update product information' : 'Create a new product'}
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
          {/* Product Code Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <FileText className="mr-2 size-4 text-blue-500" />
              {t('productCode')}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="productCode"
              type="text"
              {...register('productCode')}
              aria-required="true"
              aria-describedby={errors.productCode ? 'productCode-error' : undefined}
              className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.productCode
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
              placeholder={t('productCode_placeholder')}
            />
            {errors.productCode && (
              <p id="productCode-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.productCode.message}
              </p>
            )}
          </div>

          {/* Product Name Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <Package className="mr-2 size-4 text-blue-500" />
              {t('productName')}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="productName"
              type="text"
              {...register('productName')}
              aria-required="true"
              aria-describedby={errors.productName ? 'productName-error' : undefined}
              className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.productName
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
              placeholder={t('productName_placeholder')}
            />
            {errors.productName && (
              <p id="productName-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.productName.message}
              </p>
            )}
          </div>

          {/* Category Field */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <label className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <Tag className="mr-2 size-4 text-blue-500" />
              {t('category')}
            </label>
            <input
              id="category"
              type="text"
              {...register('category')}
              aria-describedby={errors.category ? 'category-error' : undefined}
              className={`block w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
              placeholder={t('category_placeholder')}
            />
            {errors.category && (
              <p id="category-error" className="mt-2 flex items-center text-sm text-red-600">
                <span className="mr-2 flex size-4 items-center justify-center rounded-full bg-red-100">
                  <span className="text-xs text-red-600">!</span>
                </span>
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Notes Field - Full Width */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:col-span-2">
            <label className="mb-3 flex items-center text-sm font-semibold text-gray-800">
              <StickyNote className="mr-2 size-4 text-blue-500" />
              {t('notes')}
            </label>
            <textarea
              id="notes"
              rows={4}
              {...register('notes')}
              aria-describedby={errors.notes ? 'notes-error' : undefined}
              className={`block w-full resize-none rounded-lg border px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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
