/**
 * ProductionStepDetail Database Queries Tests
 * Following TDD Workflow Standards with Arrange-Act-Assert pattern
 * Testing all CRUD operations and edge cases
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/libs/DB';
import {
  createProductionStepDetail,
  deleteProductionStepDetail,
  getProductionStepDetailById,
  getProductionStepDetailsByOwner,
  productionStepDetailExists,
  updateProductionStepDetail,
} from '@/libs/queries/productionStepDetail';
import type { CreateProductionStepDetailInput, ProductionStepDetailListParamsWithOwner } from '@/types/productionStepDetail';

// Mock the database
vi.mock('@/libs/DB', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ProductionStepDetail Database Queries', () => {
  const mockOwnerId = 'user_123';
  const mockProductionStepDetail = {
    id: 1,
    ownerId: mockOwnerId,
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
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProductionStepDetail', () => {
    it('should create a new production step detail with valid data', async () => {
      // Arrange
      const data: CreateProductionStepDetailInput = {
        ownerId: mockOwnerId,
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

      const mockInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockProductionStepDetail]),
      };

      (db.insert as any).mockReturnValue(mockInsertChain);

      // Act
      const result = await createProductionStepDetail(data);

      // Assert
      expect(db.insert).toHaveBeenCalledWith(expect.any(Object));
      expect(mockInsertChain.values).toHaveBeenCalledWith({
        ownerId: data.ownerId,
        productId: data.productId,
        productionStepId: data.productionStepId,
        sequenceNumber: data.sequenceNumber,
        factoryPrice: data.factoryPrice,
        calculatedPrice: data.calculatedPrice,
        quantityLimit1: data.quantityLimit1,
        quantityLimit2: data.quantityLimit2,
        isFinalStep: data.isFinalStep,
        isVtStep: data.isVtStep,
        isParkingStep: data.isParkingStep,
      });
      expect(mockInsertChain.returning).toHaveBeenCalled();
      expect(result).toEqual(mockProductionStepDetail);
    });

    it('should throw error when creation fails', async () => {
      // Arrange
      const data: CreateProductionStepDetailInput = {
        ownerId: mockOwnerId,
        productId: 1,
        productionStepId: 2,
        sequenceNumber: 1,
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      const mockInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      (db.insert as any).mockReturnValue(mockInsertChain);

      // Act & Assert
      await expect(createProductionStepDetail(data)).rejects.toThrow('Failed to create production step detail');
    });
  });

  describe('getProductionStepDetailsByOwner', () => {
    const mockParams: ProductionStepDetailListParamsWithOwner = {
      ownerId: mockOwnerId,
      page: 1,
      limit: 10,
      sortBy: 'sequenceNumber',
      sortOrder: 'asc',
    };

    it('should retrieve production step details for owner with pagination', async () => {
      // Arrange
      const mockDetails = [mockProductionStepDetail];
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockDetails),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getProductionStepDetailsByOwner(mockParams);

      // Assert
      expect(db.select).toHaveBeenCalled();
      expect(mockSelectChain.from).toHaveBeenCalled();
      expect(mockSelectChain.where).toHaveBeenCalled();
      expect(mockSelectChain.orderBy).toHaveBeenCalled();
      expect(mockSelectChain.limit).toHaveBeenCalledWith(10);
      expect(mockSelectChain.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockDetails);
    });

    it('should filter by productId when provided', async () => {
      // Arrange
      const paramsWithProduct = { ...mockParams, productId: 1 };
      const mockDetails = [mockProductionStepDetail];
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockDetails),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getProductionStepDetailsByOwner(paramsWithProduct);

      // Assert
      expect(mockSelectChain.where).toHaveBeenCalled();
      expect(result).toEqual(mockDetails);
    });
  });

  describe('getProductionStepDetailById', () => {
    it('should return production step detail when found with correct owner', async () => {
      // Arrange
      const detailId = 1;
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProductionStepDetail]),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getProductionStepDetailById(detailId, mockOwnerId);

      // Assert
      expect(db.select).toHaveBeenCalled();
      expect(mockSelectChain.where).toHaveBeenCalled();
      expect(mockSelectChain.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProductionStepDetail);
    });

    it('should return null when production step detail not found', async () => {
      // Arrange
      const detailId = 999;
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getProductionStepDetailById(detailId, mockOwnerId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateProductionStepDetail', () => {
    it('should update production step detail with valid data', async () => {
      // Arrange
      const detailId = 1;
      const updateData = {
        sequenceNumber: 2,
        factoryPrice: '105.00',
        isFinalStep: true,
      };

      // Mock existing detail lookup
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProductionStepDetail]),
      };

      const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...mockProductionStepDetail, ...updateData }]),
      };

      (db.select as any).mockReturnValue(mockSelectChain);
      (db.update as any).mockReturnValue(mockUpdateChain);

      // Act
      const result = await updateProductionStepDetail(detailId, mockOwnerId, updateData);

      // Assert
      expect(db.update).toHaveBeenCalled();
      expect(mockUpdateChain.set).toHaveBeenCalledWith(expect.objectContaining({
        sequenceNumber: updateData.sequenceNumber,
        factoryPrice: updateData.factoryPrice,
        isFinalStep: updateData.isFinalStep,
        updatedAt: expect.any(Date),
      }));
      expect(result.sequenceNumber).toBe(2);
      expect(result.isFinalStep).toBe(true);
    });

    it('should throw error when production step detail not found', async () => {
      // Arrange
      const detailId = 999;
      const updateData = { sequenceNumber: 2 };

      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act & Assert
      await expect(updateProductionStepDetail(detailId, mockOwnerId, updateData))
        .rejects.toThrow('Production step detail not found or access denied');
    });
  });

  describe('deleteProductionStepDetail', () => {
    it('should delete production step detail when found', async () => {
      // Arrange
      const detailId = 1;

      // Mock existing detail lookup
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProductionStepDetail]),
      };

      const mockDeleteChain = {
        where: vi.fn().mockResolvedValue([mockProductionStepDetail]),
      };

      (db.select as any).mockReturnValue(mockSelectChain);
      (db.delete as any).mockReturnValue(mockDeleteChain);

      // Act
      const result = await deleteProductionStepDetail(detailId, mockOwnerId);

      // Assert
      expect(db.delete).toHaveBeenCalled();
      expect(mockDeleteChain.where).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when production step detail not found', async () => {
      // Arrange
      const detailId = 999;

      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await deleteProductionStepDetail(detailId, mockOwnerId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('productionStepDetailExists', () => {
    it('should return true when production step detail exists', async () => {
      // Arrange
      const detailId = 1;
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProductionStepDetail]),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await productionStepDetailExists(detailId, mockOwnerId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when production step detail does not exist', async () => {
      // Arrange
      const detailId = 999;
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await productionStepDetailExists(detailId, mockOwnerId);

      // Assert
      expect(result).toBe(false);
    });
  });
});
