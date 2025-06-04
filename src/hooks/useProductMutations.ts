/**
 * useProductMutations Hook
 * Manages product CRUD mutations (create, update, delete)
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import { createProduct, deleteProduct, updateProduct } from '@/libs/api/products';
import type { Product, ProductFormData, UpdateProductInput } from '@/types/product';

type MutationState = {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
};

type MutationReturn = MutationState & {
  createProduct: (input: ProductFormData) => Promise<Product>;
  updateProduct: (id: number, input: UpdateProductInput) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  clearError: () => void;
};

export function useProductMutations(): MutationReturn {
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleCreateProduct = useCallback(async (input: ProductFormData): Promise<Product> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const product = await createProduct(input);
      setState(prev => ({ ...prev, isCreating: false }));
      return product;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleUpdateProduct = useCallback(async (id: number, input: UpdateProductInput): Promise<Product> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const product = await updateProduct(id, input);
      setState(prev => ({ ...prev, isUpdating: false }));
      return product;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      setState(prev => ({ ...prev, isUpdating: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const handleDeleteProduct = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await deleteProduct(id);
      setState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      setState(prev => ({ ...prev, isDeleting: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    createProduct: handleCreateProduct,
    updateProduct: handleUpdateProduct,
    deleteProduct: handleDeleteProduct,
    clearError,
  };
}
