/**
 * useProductionStepDetails Hook Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing production step detail data fetching, pagination, and state management
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProductionStepDetails } from '@/hooks/useProductionStepDetails';
import type { ProductionStepDetail } from '@/types/productionStepDetail';

// Mock API client
vi.mock('@/libs/api/productionStepDetails', () => ({
  fetchProductionStepDetails: vi.fn(),
}));

const { fetchProductionStepDetails } = await import('@/libs/api/productionStepDetails');

describe('useProductionStepDetails Hook', () => {
  const mockProductionStepDetails: ProductionStepDetail[] = [
    {
      id: 1,
      ownerId: 'user_123',
      productId: 1,
      productionStepId: 2,
      sequenceNumber: 1,
      factoryPrice: '100.50',
      calculatedPrice: '110.75',
      quantityLimit1: 1000,
      quantityLimit2: 2000,
      isFinalStep: false,
      isVtStep: true,
      isParkingStep: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      ownerId: 'user_123',
      productId: 1,
      productionStepId: 3,
      sequenceNumber: 2,
      factoryPrice: '150.00',
      calculatedPrice: '165.50',
      quantityLimit1: 1500,
      quantityLimit2: 2500,
      isFinalStep: true,
      isVtStep: false,
      isParkingStep: false,
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
    it('should return initial state with empty production step details and loading true', () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      const { result } = renderHook(() => useProductionStepDetails({ ownerId: 'user_123' }));

      // Assert
      expect(result.current.productionStepDetails).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when ownerId is missing', () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockImplementation(() => new Promise(() => {}));

      // Act
      const { result } = renderHook(() => useProductionStepDetails({}));

      // Assert
      expect(result.current.productionStepDetails).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(fetchProductionStepDetails).not.toHaveBeenCalled();
    });
  });

  describe('Successful Data Fetching', () => {
    it('should fetch production step details and update state correctly', async () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockResolvedValue({
        success: true,
        data: mockProductionStepDetails,
        pagination: mockPagination,
      });

      // Act
      const { result } = renderHook(() => useProductionStepDetails({ ownerId: 'user_123' }));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.productionStepDetails).toEqual(mockProductionStepDetails);
      expect(result.current.pagination).toEqual(mockPagination);
      expect(result.current.error).toBeNull();
      expect(fetchProductionStepDetails).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'user_123',
      });
    });

    it('should fetch production step details with custom parameters', async () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockResolvedValue({
        success: true,
        data: mockProductionStepDetails,
        pagination: mockPagination,
      });

      const customParams = {
        page: 2,
        limit: 5,
        search: 'test',
        sortBy: 'sequenceNumber' as const,
        sortOrder: 'asc' as const,
        productId: 1,
        productionStepId: 2,
        ownerId: 'user_123',
      };

      // Act
      const { result } = renderHook(() => useProductionStepDetails(customParams));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchProductionStepDetails).toHaveBeenCalledWith(customParams);
    });

    it('should use default values for missing parameters', async () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockResolvedValue({
        success: true,
        data: mockProductionStepDetails,
        pagination: mockPagination,
      });

      // Act
      const { result } = renderHook(() => useProductionStepDetails({
        ownerId: 'user_123',
        search: 'step',
        productId: 1,
      }));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchProductionStepDetails).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'step',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        productId: 1,
        ownerId: 'user_123',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch production step details';
      vi.mocked(fetchProductionStepDetails).mockRejectedValue(new Error(errorMessage));

      // Act
      const { result } = renderHook(() => useProductionStepDetails({ ownerId: 'user_123' }));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.productionStepDetails).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle unknown errors correctly', async () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockRejectedValue('Unknown error');

      // Act
      const { result } = renderHook(() => useProductionStepDetails({ ownerId: 'user_123' }));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.productionStepDetails).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.error).toBe('Failed to fetch production step details');
    });
  });

  describe('Refresh Functionality', () => {
    it('should provide refresh function to refetch data', async () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockResolvedValue({
        success: true,
        data: mockProductionStepDetails,
        pagination: mockPagination,
      });

      // Act
      const { result } = renderHook(() => useProductionStepDetails({ ownerId: 'user_123' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call refresh
      act(() => {
        result.current.refresh();
      });

      // Assert
      await waitFor(() => {
        expect(fetchProductionStepDetails).toHaveBeenCalledTimes(2);
      });
    });

    it('should set loading state during refresh', async () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockResolvedValue({
        success: true,
        data: mockProductionStepDetails,
        pagination: mockPagination,
      });

      const { result } = renderHook(() => useProductionStepDetails({ ownerId: 'user_123' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      vi.mocked(fetchProductionStepDetails).mockImplementation(() => new Promise(() => {})); // Never resolves
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
      vi.mocked(fetchProductionStepDetails).mockResolvedValue({
        success: true,
        data: mockProductionStepDetails,
        pagination: mockPagination,
      });

      // Act
      const { result, rerender } = renderHook(
        ({ page, ownerId }) => useProductionStepDetails({ page, ownerId }),
        { initialProps: { page: 1, ownerId: 'user_123' } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change page parameter
      rerender({ page: 2, ownerId: 'user_123' });

      // Assert
      await waitFor(() => {
        expect(fetchProductionStepDetails).toHaveBeenCalledTimes(2);
      });

      expect(fetchProductionStepDetails).toHaveBeenLastCalledWith({
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'user_123',
      });
    });

    it('should not refetch when parameters are the same', async () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockResolvedValue({
        success: true,
        data: mockProductionStepDetails,
        pagination: mockPagination,
      });

      // Act
      const { result, rerender } = renderHook(
        ({ params }) => useProductionStepDetails(params),
        { initialProps: { params: { page: 1, ownerId: 'user_123' } } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rerender with same parameters
      rerender({ params: { page: 1, ownerId: 'user_123' } });

      // Assert - should not refetch due to primitive dependency optimization
      expect(fetchProductionStepDetails).toHaveBeenCalledTimes(1);
    });

    it('should handle search parameter changes', async () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockResolvedValue({
        success: true,
        data: mockProductionStepDetails,
        pagination: mockPagination,
      });

      // Act
      const { result, rerender } = renderHook(
        ({ search, ownerId }) => useProductionStepDetails({ search, ownerId }),
        { initialProps: { search: '', ownerId: 'user_123' } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change search parameter
      rerender({ search: 'step', ownerId: 'user_123' });

      // Assert
      await waitFor(() => {
        expect(fetchProductionStepDetails).toHaveBeenCalledTimes(2);
      });

      expect(fetchProductionStepDetails).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        search: 'step',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'user_123',
      });
    });

    it('should handle productId filter changes', async () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockResolvedValue({
        success: true,
        data: mockProductionStepDetails,
        pagination: mockPagination,
      });

      // Act
      const { result, rerender } = renderHook(
        ({ productId, ownerId }) => useProductionStepDetails({ productId, ownerId }),
        { initialProps: { productId: 1, ownerId: 'user_123' } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change productId parameter
      rerender({ productId: 2, ownerId: 'user_123' });

      // Assert
      await waitFor(() => {
        expect(fetchProductionStepDetails).toHaveBeenCalledTimes(2);
      });

      expect(fetchProductionStepDetails).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        productId: 2,
        ownerId: 'user_123',
      });
    });
  });

  describe('Loading States', () => {
    it('should set loading to true during initial fetch', () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      const { result } = renderHook(() => useProductionStepDetails({ ownerId: 'user_123' }));

      // Assert
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should handle unmount during fetch', async () => {
      // Arrange
      vi.mocked(fetchProductionStepDetails).mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      // Act
      const { unmount } = renderHook(() => useProductionStepDetails({ ownerId: 'user_123' }));

      // Unmount before request completes
      unmount();

      // Assert - No specific assertion needed as this tests cleanup behavior
      // The important thing is that no errors are thrown
    });
  });
});
