/**
 * ProductSubForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing productsubs with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, FileText, Tag, StickyNote, Package, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useProductSubMutations } from '@/hooks/useProductSubMutations';
import { fetchProducts } from '@/libs/api/products';
import { productsubFormSchema } from '@/libs/validations/productsub';
import type { Product } from '@/types/product';
import type { ProductSub, ProductSubFormData } from '@/types/productsub';

type ProductSubFormProps = {
  productsub?: ProductSub;
  onSuccess: (productsub: ProductSub) => void;
  onCancel: () => void;
};

export function ProductSubForm({ productsub, onSuccess, onCancel }: ProductSubFormProps): JSX.Element {
  const isEditing = Boolean(productsub);
  const { createProductSub, updateProductSub, isCreating, isUpdating, error, clearError } = useProductSubMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ProductSubFormData>({
    resolver: zodResolver(productsubFormSchema),
    defaultValues: productsub
      ? {
          productsubCode: productsub.productSubCode,
          productsubName: productsub.productSubDetail,
          category: productsub.subCategory || '',
          notes: productsub.note || '',
          productId: productsub.productId,
        }
      : {
          productsubCode: '',
          productsubName: '',
          category: '',
          notes: '',
          productId: undefined,
        },
    mode: 'onChange',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingProducts(true);
    fetchProducts({ page: 1, limit: 100 })
      .then((res) => {
        if (res.success) {
          setProducts([...res.data]);
        } else {
          setProductError(res.error || 'Failed to load products');
        }
      })
      .catch(err => setProductError(err.message || 'Failed to load products'))
      .finally(() => setLoadingProducts(false));
  }, []);

  // Clear errors when form values change
  useEffect(() => {
    const subscription = watch(() => {
      if (error) {
        clearError();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, error, clearError]);

  useEffect(() => {
    if (isEditing && productsub && products.length > 0) {
      reset({
        productsubCode: productsub.productSubCode,
        productsubName: productsub.productSubDetail,
        category: productsub.subCategory || '',
        notes: productsub.note || '',
        productId: productsub.productId,
      });
    }
  }, [isEditing, productsub, products, reset]);

  const onSubmit = async (data: ProductSubFormData): Promise<void> => {
    try {
      if (isEditing && productsub) {
        const updatedProductSub = await updateProductSub(productsub.id, data);
        onSuccess(updatedProductSub);
      } else {
        const newProductSub = await createProductSub(data);
        onSuccess(newProductSub);
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
    <div className="bg-gradient-to-br from-slate-50 to-purple-50 p-6 rounded-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Header */}
        <div className="text-center pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Edit Product Sub' : 'Create Product Sub'}
          </h2>
          <p className="text-gray-600">
            {isEditing ? 'Update product sub configuration' : 'Create a new product sub-component'}
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
          {/* ProductSub Code Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <FileText className="w-4 h-4 mr-2 text-purple-500" />
              ProductSub Code
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="productsubCode"
              type="text"
              {...register('productsubCode')}
              aria-required="true"
              aria-describedby={errors.productsubCode ? 'productsubCode-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.productsubCode 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder="e.g., PROD-SUB-001"
            />
            {errors.productsubCode && (
              <p id="productsubCode-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.productsubCode.message}
              </p>
            )}
          </div>

          {/* ProductSub Name Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Layers className="w-4 h-4 mr-2 text-purple-500" />
              ProductSub Name
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="productsubName"
              type="text"
              {...register('productsubName')}
              aria-required="true"
              aria-describedby={errors.productsubName ? 'productsubName-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.productsubName 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder="Enter product sub name"
            />
            {errors.productsubName && (
              <p id="productsubName-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.productsubName.message}
              </p>
            )}
          </div>

          {/* Category Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Tag className="w-4 h-4 mr-2 text-purple-500" />
              Category
            </label>
            <input
              id="category"
              type="text"
              {...register('category')}
              aria-describedby={errors.category ? 'category-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.category 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder="e.g., Components, Accessories"
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

          {/* Product Select Field */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Package className="w-4 h-4 mr-2 text-purple-500" />
              Parent Product
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="productId"
              {...register('productId', { valueAsNumber: true })}
              className={`block w-full rounded-lg border py-3 px-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.productId 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              disabled={loadingProducts}
            >
              <option value="">
                {loadingProducts ? 'Loading products...' : 'Select a parent product'}
              </option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.productName} ({p.productCode})
                </option>
              ))}
            </select>
            {errors.productId && (
              <p id="productId-error" className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {errors.productId.message}
              </p>
            )}
            {productError && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-600 text-xs">!</span>
                </span>
                {productError}
              </p>
            )}
          </div>

          {/* Notes Field - Full Width */}
          <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <StickyNote className="w-4 h-4 mr-2 text-purple-500" />
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              {...register('notes')}
              aria-describedby={errors.notes ? 'notes-error' : undefined}
              className={`block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none ${
                errors.notes 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              placeholder="Additional notes about the product sub..."
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
            Cancel
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            )}
            {isSubmitting
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update ProductSub'
                : 'Create ProductSub'}
          </button>
        </div>
      </form>
    </div>
  );
}
