/**
 * ProductionStepDetail Validation Schema Tests
 * Following TDD Workflow Standards - RED Phase
 * Testing Zod validation schemas with business rules
 */

import { describe, expect, it } from 'vitest';

import {
  validateCreateProductionStepDetail,
  validateProductionStepDetailForm,
  validateProductionStepDetailId,
  validateProductionStepDetailListParams,
  validateUpdateProductionStepDetail,
} from '@/libs/validations/productionStepDetail';

describe('ProductionStepDetail Validation Schemas', () => {
  describe('productionStepDetailListParamsSchema', () => {
    it('should validate valid list parameters', () => {
      // Arrange
      const validParams = {
        page: '1',
        limit: '20',
        search: 'step',
        sortBy: 'sequenceNumber',
        sortOrder: 'asc',
        productId: '1',
        productionStepId: '2',
      };

      // Act
      const result = validateProductionStepDetailListParams(validParams);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.search).toBe('step');
      expect(result.sortBy).toBe('sequenceNumber');
      expect(result.sortOrder).toBe('asc');
      expect(result.productId).toBe(1);
      expect(result.productionStepId).toBe(2);
    });

    it('should use defaults for missing parameters', () => {
      // Arrange
      const emptyParams = {};

      // Act
      const result = validateProductionStepDetailListParams(emptyParams);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should handle invalid page and limit values', () => {
      // Arrange
      const invalidParams = {
        page: 'invalid',
        limit: '200', // Too high
      };

      // Act
      const result = validateProductionStepDetailListParams(invalidParams);

      // Assert
      expect(result.page).toBe(1); // Default
      expect(result.limit).toBe(100); // Capped to max
    });

    it('should sanitize search parameter', () => {
      // Arrange
      const paramsWithSearch = {
        search: '  step search  ',
      };

      // Act
      const result = validateProductionStepDetailListParams(paramsWithSearch);

      // Assert
      expect(result.search).toBe('step search'); // Trimmed
    });
  });

  describe('productionStepDetailFormSchema', () => {
    it('should validate valid form data', () => {
      // Arrange
      const validFormData = {
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

      // Act
      const result = validateProductionStepDetailForm(validFormData);

      // Assert
      expect(result.productId).toBe(1);
      expect(result.productionStepId).toBe(2);
      expect(result.sequenceNumber).toBe(1);
      expect(result.factoryPrice).toBe('100.50');
      expect(result.isFinalStep).toBe(false);
      expect(result.isVtStep).toBe(true);
    });

    it('should require mandatory fields', () => {
      // Arrange
      const incompleteData = {
        productId: 1,
        // Missing productionStepId and sequenceNumber
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      // Act & Assert
      expect(() => validateProductionStepDetailForm(incompleteData)).toThrow();
    });

    it('should validate sequence number is positive', () => {
      // Arrange
      const invalidSequenceData = {
        productId: 1,
        productionStepId: 2,
        sequenceNumber: 0, // Invalid: must be positive
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      // Act & Assert
      expect(() => validateProductionStepDetailForm(invalidSequenceData)).toThrow();
    });

    it('should validate price format', () => {
      // Arrange
      const invalidPriceData = {
        productId: 1,
        productionStepId: 2,
        sequenceNumber: 1,
        factoryPrice: 'invalid-price',
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      // Act & Assert
      expect(() => validateProductionStepDetailForm(invalidPriceData)).toThrow();
    });

    it('should handle optional fields', () => {
      // Arrange
      const minimalData = {
        productId: 1,
        productionStepId: 2,
        sequenceNumber: 1,
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      // Act
      const result = validateProductionStepDetailForm(minimalData);

      // Assert
      expect(result.productId).toBe(1);
      expect(result.factoryPrice).toBeUndefined();
      expect(result.calculatedPrice).toBeUndefined();
      expect(result.quantityLimit1).toBeUndefined();
    });
  });

  describe('createProductionStepDetailSchema', () => {
    it('should validate create input data', () => {
      // Arrange
      const createData = {
        productId: 1,
        productionStepId: 2,
        sequenceNumber: 1,
        factoryPrice: '100.50',
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      // Act
      const result = validateCreateProductionStepDetail(createData);

      // Assert
      expect(result.productId).toBe(1);
      expect(result.sequenceNumber).toBe(1);
      expect(result.factoryPrice).toBe('100.50');
    });
  });

  describe('updateProductionStepDetailSchema', () => {
    it('should validate update input with partial data', () => {
      // Arrange
      const updateData = {
        sequenceNumber: 2,
        factoryPrice: '105.00',
        isFinalStep: true,
      };

      // Act
      const result = validateUpdateProductionStepDetail(updateData);

      // Assert
      expect(result.sequenceNumber).toBe(2);
      expect(result.factoryPrice).toBe('105.00');
      expect(result.isFinalStep).toBe(true);
    });

    it('should require at least one field for update', () => {
      // Arrange
      const emptyUpdateData = {};

      // Act & Assert
      expect(() => validateUpdateProductionStepDetail(emptyUpdateData)).toThrow();
    });

    it('should validate sequence number in update', () => {
      // Arrange
      const invalidUpdateData = {
        sequenceNumber: -1, // Invalid: must be positive
      };

      // Act & Assert
      expect(() => validateUpdateProductionStepDetail(invalidUpdateData)).toThrow();
    });
  });

  describe('productionStepDetailIdSchema', () => {
    it('should validate valid ID', () => {
      // Arrange
      const validId = { id: '123' };

      // Act
      const result = validateProductionStepDetailId(validId);

      // Assert
      expect(result.id).toBe(123);
    });

    it('should reject invalid ID', () => {
      // Arrange
      const invalidId = { id: 'abc' };

      // Act & Assert
      expect(() => validateProductionStepDetailId(invalidId)).toThrow();
    });

    it('should reject negative ID', () => {
      // Arrange
      const negativeId = { id: '-5' };

      // Act & Assert
      expect(() => validateProductionStepDetailId(negativeId)).toThrow();
    });
  });

  describe('Business Rule Validations', () => {
    it('should validate unique product-step combination logic', () => {
      // This will be tested when we implement business rules
      // For now, just ensure basic validation works
      const validData = {
        productId: 1,
        productionStepId: 2,
        sequenceNumber: 1,
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      expect(() => validateProductionStepDetailForm(validData)).not.toThrow();
    });

    it('should handle special step flags validation', () => {
      // Arrange - All flags can be true independently for now
      const flagData = {
        productId: 1,
        productionStepId: 2,
        sequenceNumber: 1,
        isFinalStep: true,
        isVtStep: true,
        isParkingStep: true,
      };

      // Act & Assert
      expect(() => validateProductionStepDetailForm(flagData)).not.toThrow();
    });
  });
});
