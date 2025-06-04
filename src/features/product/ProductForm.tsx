/**
 * ProductForm Component
 * Following TDD Workflow Standards - Green Phase
 * Form for creating and editing products with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Product Code Field */}
      <div>
        <label
          htmlFor="productCode"
          className="block text-sm font-medium text-gray-700"
        >
          Product Code *
        </label>
        <input
          id="productCode"
          type="text"
          {...register('productCode')}
          aria-required="true"
          aria-describedby={errors.productCode ? 'productCode-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.productCode ? 'border-red-300' : ''
          }`}
          placeholder="e.g., PROD-001"
        />
        {errors.productCode && (
          <p id="productCode-error" className="mt-2 text-sm text-red-600">
            {errors.productCode.message}
          </p>
        )}
      </div>

      {/* Product Name Field */}
      <div>
        <label
          htmlFor="productName"
          className="block text-sm font-medium text-gray-700"
        >
          Product Name *
        </label>
        <input
          id="productName"
          type="text"
          {...register('productName')}
          aria-required="true"
          aria-describedby={errors.productName ? 'productName-error' : undefined}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.productName ? 'border-red-300' : ''
          }`}
          placeholder="Enter product name"
        />
        {errors.productName && (
          <p id="productName-error" className="mt-2 text-sm text-red-600">
            {errors.productName.message}
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
          placeholder="Additional notes about the product..."
        />
        {errors.notes && (
          <p id="notes-error" className="mt-2 text-sm text-red-600">
            {errors.notes.message}
          </p>
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
              ? 'Update Product'
              : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
