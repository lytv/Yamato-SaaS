/**
 * useProductMutations Hook Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing product CRUD mutations (create, update, delete)
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProductMutations } from '@/hooks/useProductMutations';
import type { Product } from '@/types/product';

// Mock API client
vi.mock('@/libs/api/products', () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

const { createProduct, updateProduct, deleteProduct } = await import('@/libs/api/products');

describe('useProductMutations Hook', () => {
  const mockProduct: Product = {
    id: 1,
    ownerId: 'user_123',
    productCode: 'PROD-001',
    productName: 'Test Product',
    category: 'Electronics',
    notes: 'Test notes',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state with no loading or errors', () => {
      // Act
      const { result } = renderHook(() => useProductMutations());

      // Assert
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Create Product', () => {
    it('should handle successful product creation', async () => {
      // Arrange
      vi.mocked(createProduct).mockResolvedValue(mockProduct);
      const { result } = renderHook(() => useProductMutations());

      // Act
      let promise: Promise<any>;
      act(() => {
        promise = result.current.createProduct({
          productCode: 'PROD-001',
          productName: 'New Product',
          category: 'Electronics',
          notes: 'New notes',
        });
      });

      // Assert loading state
      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      });

      expect(result.current.error).toBeNull();

      const product = await promise!;

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(product).toEqual(mockProduct);
      expect(createProduct).toHaveBeenCalledWith({
        productCode: 'PROD-001',
        productName: 'New Product',
        category: 'Electronics',
        notes: 'New notes',
      });
    });

    it('should handle product creation error', async () => {
      // Arrange
      const errorMessage = 'Product code already exists';
      vi.mocked(createProduct).mockRejectedValue(new Error(errorMessage));
      const { result } = renderHook(() => useProductMutations());

      // Act & Assert
      let promise: Promise<any>;
      await act(async () => {
        promise = result.current.createProduct({
          productCode: 'PROD-001',
          productName: 'New Product',
          category: 'Electronics',
          notes: 'New notes',
        });

        await expect(promise).rejects.toThrow(errorMessage);
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it('should handle unknown error during creation', async () => {
      // Arrange
      vi.mocked(createProduct).mockRejectedValue('Unknown error');
      const { result } = renderHook(() => useProductMutations());

      // Act & Assert
      let promise: Promise<any>;
      act(() => {
        promise = result.current.createProduct({
          productCode: 'PROD-001',
          productName: 'New Product',
        });
      });

      await expect(promise!).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
        expect(result.current.error).toBe('Failed to create product');
      });
    });
  });

  describe('Update Product', () => {
    it('should handle successful product update', async () => {
      // Arrange
      const updatedProduct = { ...mockProduct, productName: 'Updated Product' };
      vi.mocked(updateProduct).mockResolvedValue(updatedProduct);
      const { result } = renderHook(() => useProductMutations());

      // Act
      let promise: Promise<any>;
      act(() => {
        promise = result.current.updateProduct(1, {
          productName: 'Updated Product',
          category: 'Updated Electronics',
        });
      });

      // Assert loading state
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      expect(result.current.error).toBeNull();

      const product = await promise!;

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(product).toEqual(updatedProduct);
      expect(updateProduct).toHaveBeenCalledWith(1, {
        productName: 'Updated Product',
        category: 'Updated Electronics',
      });
    });

    it('should handle product update error', async () => {
      // Arrange
      const errorMessage = 'Product not found or access denied';
      vi.mocked(updateProduct).mockRejectedValue(new Error(errorMessage));
      const { result } = renderHook(() => useProductMutations());

      // Act & Assert
      let promise: Promise<any>;
      act(() => {
        promise = result.current.updateProduct(1, {
          productName: 'Updated Product',
        });
      });

      await expect(promise!).rejects.toThrow(errorMessage);

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it('should handle unknown error during update', async () => {
      // Arrange
      vi.mocked(updateProduct).mockRejectedValue('Unknown error');
      const { result } = renderHook(() => useProductMutations());

      // Act & Assert
      let promise: Promise<any>;
      act(() => {
        promise = result.current.updateProduct(1, {
          productName: 'Updated Product',
        });
      });

      await expect(promise!).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
        expect(result.current.error).toBe('Failed to update product');
      });
    });
  });

  describe('Delete Product', () => {
    it('should handle successful product deletion', async () => {
      // Arrange
      vi.mocked(deleteProduct).mockResolvedValue();
      const { result } = renderHook(() => useProductMutations());

      // Act
      let promise: Promise<any>;
      act(() => {
        promise = result.current.deleteProduct(1);
      });

      // Assert loading state
      await waitFor(() => {
        expect(result.current.isDeleting).toBe(true);
      });

      expect(result.current.error).toBeNull();

      await promise!;

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });

      expect(deleteProduct).toHaveBeenCalledWith(1);
    });

    it('should handle product deletion error', async () => {
      // Arrange
      const errorMessage = 'Product not found or access denied';
      vi.mocked(deleteProduct).mockRejectedValue(new Error(errorMessage));
      const { result } = renderHook(() => useProductMutations());

      // Act & Assert
      let promise: Promise<any>;
      act(() => {
        promise = result.current.deleteProduct(1);
      });

      await expect(promise!).rejects.toThrow(errorMessage);

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it('should handle unknown error during deletion', async () => {
      // Arrange
      vi.mocked(deleteProduct).mockRejectedValue('Unknown error');
      const { result } = renderHook(() => useProductMutations());

      // Act & Assert
      let promise: Promise<any>;
      act(() => {
        promise = result.current.deleteProduct(1);
      });

      await expect(promise!).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
        expect(result.current.error).toBe('Failed to delete product');
      });
    });
  });

  describe('Clear Error', () => {
    it('should clear error state', async () => {
      // Arrange
      vi.mocked(createProduct).mockRejectedValue(new Error('Test error'));
      const { result } = renderHook(() => useProductMutations());

      // Create an error
      let promise: Promise<any>;
      act(() => {
        promise = result.current.createProduct({
          productCode: 'PROD-001',
          productName: 'New Product',
        });
      });

      await expect(promise!).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Act
      act(() => {
        result.current.clearError();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe('Multiple Operations', () => {
    it('should handle multiple operations independently', async () => {
      // Arrange
      vi.mocked(createProduct).mockResolvedValue(mockProduct);
      vi.mocked(updateProduct).mockResolvedValue(mockProduct);
      const { result } = renderHook(() => useProductMutations());

      // Act - Create operation
      let createPromise: Promise<any>;
      act(() => {
        createPromise = result.current.createProduct({
          productCode: 'PROD-001',
          productName: 'New Product',
        });
      });

      // Assert create loading
      expect(result.current.isCreating).toBe(true);
      expect(result.current.isUpdating).toBe(false);

      await createPromise!;

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      // Act - Update operation
      let updatePromise: Promise<any>;
      act(() => {
        updatePromise = result.current.updateProduct(1, {
          productName: 'Updated Product',
        });
      });

      // Assert update loading
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(true);

      await updatePromise!;

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });
  });
});
