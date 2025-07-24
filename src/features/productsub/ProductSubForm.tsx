/**
 * ProductSubForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing productsubs with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* ProductSub Code Field */}
      <div>
        <label
          htmlFor="productsubCode"
          className="block text-sm font-medium text-gray-700"
        >
          ProductSub Code *
        </label>
        <input
          id="productsubCode"
          type="text"
          {...register('productsubCode')}
          aria-required="true"
          aria-describedby={errors.productsubCode ? 'productsubCode-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.productsubCode ? 'border-red-300' : ''
          }`}
          placeholder="e.g., PROD-001"
        />
        {errors.productsubCode && (
          <p id="productsubCode-error" className="mt-2 text-sm text-red-600">
            {errors.productsubCode.message}
          </p>
        )}
      </div>

      {/* ProductSub Name Field */}
      <div>
        <label
          htmlFor="productsubName"
          className="block text-sm font-medium text-gray-700"
        >
          ProductSub Name *
        </label>
        <input
          id="productsubName"
          type="text"
          {...register('productsubName')}
          aria-required="true"
          aria-describedby={errors.productsubName ? 'productsubName-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.productsubName ? 'border-red-300' : ''
          }`}
          placeholder="Enter productsub name"
        />
        {errors.productsubName && (
          <p id="productsubName-error" className="mt-2 text-sm text-red-600">
            {errors.productsubName.message}
          </p>
        )}
      </div>

      {/* Category Field */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          Category
        </label>
        <input
          id="category"
          type="text"
          {...register('category')}
          aria-describedby={errors.category ? 'category-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.category ? 'border-red-300' : ''
          }`}
          placeholder="e.g., Electronics, Software"
        />
        {errors.category && (
          <p id="category-error" className="mt-2 text-sm text-red-600">
            {errors.category.message}
          </p>
        )}
      </div>

      {/* Notes Field */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700"
        >
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          {...register('notes')}
          aria-describedby={errors.notes ? 'notes-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.notes ? 'border-red-300' : ''
          }`}
          placeholder="Additional notes about the productsub..."
        />
        {errors.notes && (
          <p id="notes-error" className="mt-2 text-sm text-red-600">
            {errors.notes.message}
          </p>
        )}
      </div>

      {/* Product Select Field */}
      <div>
        <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
          Product *
        </label>
        <select
          id="productId"
          {...register('productId', { valueAsNumber: true })}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.productId ? 'border-red-300' : ''}`}
          disabled={loadingProducts}
        >
          <option value="">Select a product</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.productName}
              {' '}
              (
              {p.productCode}
              )
            </option>
          ))}
        </select>
        {errors.productId && (
          <p id="productId-error" className="mt-2 text-sm text-red-600">
            {errors.productId.message}
          </p>
        )}
        {productError && (
          <p className="mt-2 text-sm text-red-600">{productError}</p>
        )}
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
              ? 'Update ProductSub'
              : 'Create ProductSub'}
        </button>
      </div>
    </form>
  );
}
