/**
 * useProductionStepDetailMutations Hook Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing production step detail CRUD mutations
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProductionStepDetailMutations } from '@/hooks/useProductionStepDetailMutations';
import type { ProductionStepDetail, ProductionStepDetailFormData, UpdateProductionStepDetailInput } from '@/types/productionStepDetail';

// Mock console.error to prevent vitest-fail-on-console from failing
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock API client
vi.mock('@/libs/api/productionStepDetails', () => ({
  createProductionStepDetail: vi.fn(),
  updateProductionStepDetail: vi.fn(),
  deleteProductionStepDetail: vi.fn(),
}));

const { createProductionStepDetail, updateProductionStepDetail, deleteProductionStepDetail } = await import('@/libs/api/productionStepDetails');

describe('useProductionStepDetailMutations Hook', () => {
  const mockProductionStepDetail: ProductionStepDetail = {
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
  };

  const mockFormData: ProductionStepDetailFormData = {
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
  };

  const mockUpdateData: UpdateProductionStepDetailInput = {
    sequenceNumber: 2,
    factoryPrice: '120.00',
    calculatedPrice: '130.00',
    quantityLimit1: 1200,
    quantityLimit2: 2200,
    isFinalStep: true,
    isVtStep: false,
    isParkingStep: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  describe('Initial State', () => {
    it('should return initial state with all loading flags false and no error', () => {
      // Act
      const { result } = renderHook(() => useProductionStepDetailMutations());

      // Assert
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide mutation functions', () => {
      // Act
      const { result } = renderHook(() => useProductionStepDetailMutations());

      // Assert
      expect(typeof result.current.createProductionStepDetail).toBe('function');
      expect(typeof result.current.updateProductionStepDetail).toBe('function');
      expect(typeof result.current.deleteProductionStepDetail).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('Create Mutation', () => {
    it('should create production step detail successfully', async () => {
      // Arrange
      vi.mocked(createProductionStepDetail).mockResolvedValue(mockProductionStepDetail);

      // Act
      const { result } = renderHook(() => useProductionStepDetailMutations());
      const createdItem = await result.current.createProductionStepDetail(mockFormData);

      // Assert
      expect(createdItem).toEqual(mockProductionStepDetail);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(createProductionStepDetail).toHaveBeenCalledWith(mockFormData);
    });

    it('should handle create errors correctly', async () => {
      // Arrange
      const errorMessage = 'Failed to create production step detail';
      vi.mocked(createProductionStepDetail).mockRejectedValue(new Error(errorMessage));

      // Act
      const { result } = renderHook(() => useProductionStepDetailMutations());

      try {
        await result.current.createProductionStepDetail(mockFormData);
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('Update Mutation', () => {
    it('should update production step detail successfully', async () => {
      // Arrange
      const updatedItem = { ...mockProductionStepDetail, ...mockUpdateData };
      vi.mocked(updateProductionStepDetail).mockResolvedValue(updatedItem);

      // Act
      const { result } = renderHook(() => useProductionStepDetailMutations());
      const updated = await result.current.updateProductionStepDetail(1, mockUpdateData);

      // Assert
      expect(updated).toEqual(updatedItem);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(updateProductionStepDetail).toHaveBeenCalledWith(1, mockUpdateData);
    });

    it('should handle update errors correctly', async () => {
      // Arrange
      const errorMessage = 'Failed to update production step detail';
      vi.mocked(updateProductionStepDetail).mockRejectedValue(new Error(errorMessage));

      // Act
      const { result } = renderHook(() => useProductionStepDetailMutations());

      try {
        await result.current.updateProductionStepDetail(1, mockUpdateData);
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('Delete Mutation', () => {
    it('should delete production step detail successfully', async () => {
      // Arrange
      vi.mocked(deleteProductionStepDetail).mockResolvedValue();

      // Act
      const { result } = renderHook(() => useProductionStepDetailMutations());
      await result.current.deleteProductionStepDetail(1);

      // Assert
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(deleteProductionStepDetail).toHaveBeenCalledWith(1);
    });

    it('should handle delete errors correctly', async () => {
      // Arrange
      const errorMessage = 'Failed to delete production step detail';
      vi.mocked(deleteProductionStepDetail).mockRejectedValue(new Error(errorMessage));

      // Act
      const { result } = renderHook(() => useProductionStepDetailMutations());

      try {
        await result.current.deleteProductionStepDetail(1);
      } catch {
        // Expected to throw
      }

      // Assert
      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error when clearError is called', async () => {
      // Arrange
      vi.mocked(createProductionStepDetail).mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useProductionStepDetailMutations());

      try {
        await result.current.createProductionStepDetail(mockFormData);
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      // Act
      act(() => {
        result.current.clearError();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });
});
