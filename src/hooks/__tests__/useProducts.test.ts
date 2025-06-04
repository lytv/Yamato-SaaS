/**
 * useProducts Hook Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing product data fetching, pagination, and state management
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/product';

// Mock API client
vi.mock('@/libs/api/products', () => ({
  fetchProducts: vi.fn(),
}));

const { fetchProducts } = await import('@/libs/api/products');

describe('useProducts Hook', () => {
  const mockProducts: Product[] = [
    {
      id: 1,
      ownerId: 'user_123',
      productCode: 'PROD-001',
      productName: 'Test Product 1',
      category: 'Electronics',
      notes: 'First test product',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      ownerId: 'user_123',
      productCode: 'PROD-002',
      productName: 'Test Product 2',
      category: 'Electronics',
      notes: 'Second test product',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 10,
    total: 2,
    hasMore: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state with empty products and loading true', () => {
      // Arrange
      vi.mocked(fetchProducts).mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      const { result } = renderHook(() => useProducts({ ownerId: 'user_123' }));

      // Assert
      expect(result.current.products).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when ownerId is missing', () => {
      // Arrange
      vi.mocked(fetchProducts).mockImplementation(() => new Promise(() => {}));

      // Act
      const { result } = renderHook(() => useProducts({}));

      // Assert
      expect(result.current.products).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(fetchProducts).not.toHaveBeenCalled();
    });
  });

  describe('Successful Data Fetching', () => {
    it('should fetch products and update state correctly', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: mockPagination,
      });

      // Act
      const { result } = renderHook(() => useProducts({ ownerId: 'user_123' }));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toEqual(mockProducts);
      expect(result.current.pagination).toEqual(mockPagination);
      expect(result.current.error).toBeNull();
      expect(fetchProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'user_123',
      });
    });

    it('should fetch products with custom parameters', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: mockPagination,
      });

      const customParams = {
        page: 2,
        limit: 5,
        search: 'test',
        sortBy: 'productName' as const,
        sortOrder: 'asc' as const,
        ownerId: 'user_123',
      };

      // Act
      const { result } = renderHook(() => useProducts(customParams));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchProducts).toHaveBeenCalledWith(customParams);
    });

    it('should use default values for missing parameters', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: mockPagination,
      });

      // Act
      const { result } = renderHook(() => useProducts({
        ownerId: 'user_123',
        search: 'electronics',
      }));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'electronics',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'user_123',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch products';
      vi.mocked(fetchProducts).mockRejectedValue(new Error(errorMessage));

      // Act
      const { result } = renderHook(() => useProducts({ ownerId: 'user_123' }));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle unknown errors correctly', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockRejectedValue('Unknown error');

      // Act
      const { result } = renderHook(() => useProducts({ ownerId: 'user_123' }));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.error).toBe('Failed to fetch products');
    });
  });

  describe('Refresh Functionality', () => {
    it('should provide refresh function to refetch data', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: mockPagination,
      });

      // Act
      const { result } = renderHook(() => useProducts({ ownerId: 'user_123' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call refresh
      act(() => {
        result.current.refresh();
      });

      // Assert
      await waitFor(() => {
        expect(fetchProducts).toHaveBeenCalledTimes(2);
      });
    });

    it('should set loading state during refresh', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: mockPagination,
      });

      const { result } = renderHook(() => useProducts({ ownerId: 'user_123' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      vi.mocked(fetchProducts).mockImplementation(() => new Promise(() => {})); // Never resolves
      act(() => {
        result.current.refresh();
      });

      // Assert
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Parameter Changes (Primitive Dependencies)', () => {
    it('should refetch data when primitive parameters change', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: mockPagination,
      });

      // Act
      const { result, rerender } = renderHook(
        ({ page, ownerId }) => useProducts({ page, ownerId }),
        { initialProps: { page: 1, ownerId: 'user_123' } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change page parameter
      rerender({ page: 2, ownerId: 'user_123' });

      // Assert
      await waitFor(() => {
        expect(fetchProducts).toHaveBeenCalledTimes(2);
      });

      expect(fetchProducts).toHaveBeenLastCalledWith({
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'user_123',
      });
    });

    it('should not refetch when parameters are the same', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: mockPagination,
      });

      // Act
      const { result, rerender } = renderHook(
        ({ params }) => useProducts(params),
        { initialProps: { params: { page: 1, ownerId: 'user_123' } } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rerender with same parameters
      rerender({ params: { page: 1, ownerId: 'user_123' } });

      // Assert - should not refetch due to primitive dependency optimization
      expect(fetchProducts).toHaveBeenCalledTimes(1);
    });

    it('should handle search parameter changes', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: mockPagination,
      });

      // Act
      const { result, rerender } = renderHook(
        ({ search, ownerId }) => useProducts({ search, ownerId }),
        { initialProps: { search: '', ownerId: 'user_123' } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change search parameter
      rerender({ search: 'electronics', ownerId: 'user_123' });

      // Assert
      await waitFor(() => {
        expect(fetchProducts).toHaveBeenCalledTimes(2);
      });

      expect(fetchProducts).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        search: 'electronics',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'user_123',
      });
    });
  });

  describe('Loading States', () => {
    it('should set loading to true during initial fetch', () => {
      // Arrange
      vi.mocked(fetchProducts).mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      const { result } = renderHook(() => useProducts({ ownerId: 'user_123' }));

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should clear previous error when starting new fetch', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useProducts({ ownerId: 'user_123' }));

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      // Act - fetch again with success
      vi.mocked(fetchProducts).mockResolvedValueOnce({
        success: true,
        data: mockProducts,
        pagination: mockPagination,
      });

      act(() => {
        result.current.refresh();
      });

      // Assert
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should handle unmount during fetch', async () => {
      // Arrange
      vi.mocked(fetchProducts).mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      // Act
      const { unmount } = renderHook(() => useProducts({ ownerId: 'user_123' }));

      // Unmount before request completes
      unmount();

      // Assert - No specific assertion needed as this tests cleanup behavior
      // The important thing is that no errors are thrown
    });
  });
});
