/**
 * Product Validation Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing Zod validation schemas and query parameter handling
 */

import { describe, expect, it } from 'vitest';

// These imports will fail until we implement them (RED phase)
import {
  productFormSchema,
  productListParamsSchema,
  validateCreateProduct,
  validateProductForm,
  validateProductId,
  validateProductListParams,
  validateUpdateProduct,
} from '@/libs/validations/product';

describe('Product Validation Schemas', () => {
  describe('validateProductListParams', () => {
    it('should handle null to undefined conversion (400 fix)', () => {
      // Arrange - Simulating searchParams.get() returning null
      const queryParams = {
        page: null,
        limit: null,
        search: null,
        sortBy: null,
        sortOrder: null,
      };

      // Act
      const result = validateProductListParams(queryParams);

      // Assert - Should convert null to sensible defaults
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.search).toBeUndefined();
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should handle string number conversion correctly', () => {
      // Arrange
      const queryParams = {
        page: '2',
        limit: '25',
        search: 'test product',
        sortBy: 'productName',
        sortOrder: 'asc',
      };

      // Act
      const result = validateProductListParams(queryParams);

      // Assert
      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
      expect(result.search).toBe('test product');
      expect(result.sortBy).toBe('productName');
      expect(result.sortOrder).toBe('asc');
    });

    it('should use Number.isNaN not isNaN for validation', () => {
      // Arrange - Invalid number strings
      const queryParams = {
        page: 'invalid',
        limit: 'notanumber',
      };

      // Act
      const result = validateProductListParams(queryParams);

      // Assert - Should fallback to defaults for invalid numbers
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should enforce pagination limits', () => {
      // Arrange
      const queryParams = {
        page: '0', // Below minimum
        limit: '150', // Above maximum
      };

      // Act
      const result = validateProductListParams(queryParams);

      // Assert
      expect(result.page).toBe(1); // Minimum enforced
      expect(result.limit).toBe(100); // Maximum enforced
    });

    it('should validate sortBy enum values', () => {
      // Arrange
      const validSortBy = ['createdAt', 'updatedAt', 'productName', 'productCode'];

      for (const sortBy of validSortBy) {
        const queryParams = { sortBy };

        // Act
        const result = validateProductListParams(queryParams);

        // Assert
        expect(result.sortBy).toBe(sortBy);
      }
    });

    it('should default invalid sortBy values', () => {
      // Arrange
      const queryParams = {
        sortBy: 'invalidSort',
        sortOrder: 'invalidOrder',
      };

      // Act
      const result = validateProductListParams(queryParams);

      // Assert
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });
  });

  describe('validateProductForm', () => {
    it('should validate required fields', () => {
      // Arrange
      const validFormData = {
        productCode: 'PROD001',
        productName: 'Test Product',
        category: 'Electronics',
        notes: 'Test notes',
      };

      // Act
      const result = validateProductForm(validFormData);

      // Assert
      expect(result.productCode).toBe('PROD001');
      expect(result.productName).toBe('Test Product');
      expect(result.category).toBe('Electronics');
      expect(result.notes).toBe('Test notes');
    });

    it('should enforce productCode regex pattern', () => {
      // Arrange
      const invalidCodes = [
        'PROD@001', // Special characters
        'PROD 001', // Spaces
        'PROD#001', // Hash
      ];

      // Act & Assert
      for (const productCode of invalidCodes) {
        expect(() => {
          validateProductForm({
            productCode,
            productName: 'Test Product',
          });
        }).toThrow();
      }
    });

    it('should allow valid productCode patterns', () => {
      // Arrange
      const validCodes = [
        'PROD001',
        'PROD_001',
        'PROD-001',
        'prod001',
        'Product123',
      ];

      // Act & Assert
      for (const productCode of validCodes) {
        expect(() => {
          validateProductForm({
            productCode,
            productName: 'Test Product',
          });
        }).not.toThrow();
      }
    });

    it('should enforce field length limits', () => {
      // Arrange
      const longData = {
        productCode: 'A'.repeat(51), // Over 50 limit
        productName: 'B'.repeat(201), // Over 200 limit
        category: 'C'.repeat(101), // Over 100 limit
        notes: 'D'.repeat(1001), // Over 1000 limit
      };

      // Act & Assert
      expect(() => validateProductForm(longData)).toThrow();
    });

    it('should allow optional fields to be undefined', () => {
      // Arrange
      const minimalData = {
        productCode: 'PROD001',
        productName: 'Test Product',
      };

      // Act
      const result = validateProductForm(minimalData);

      // Assert
      expect(result.productCode).toBe('PROD001');
      expect(result.productName).toBe('Test Product');
      expect(result.category).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  describe('validateCreateProduct', () => {
    it('should validate complete product creation data', () => {
      // Arrange
      const createData = {
        productCode: 'PROD001',
        productName: 'Test Product',
        category: 'Electronics',
        notes: 'Test notes',
      };

      // Act
      const result = validateCreateProduct(createData);

      // Assert
      expect(result.productCode).toBe('PROD001');
      expect(result.productName).toBe('Test Product');
      expect(result.category).toBe('Electronics');
      expect(result.notes).toBe('Test notes');
    });

    it('should require productCode and productName', () => {
      // Arrange
      const incompleteData = {
        category: 'Electronics',
      };

      // Act & Assert
      expect(() => validateCreateProduct(incompleteData)).toThrow();
    });
  });

  describe('validateUpdateProduct', () => {
    it('should allow partial updates', () => {
      // Arrange
      const updateData = {
        productName: 'Updated Product Name',
      };

      // Act
      const result = validateUpdateProduct(updateData);

      // Assert
      expect(result.productName).toBe('Updated Product Name');
      expect(result.productCode).toBeUndefined();
    });

    it('should require at least one field for update', () => {
      // Arrange
      const emptyData = {};

      // Act & Assert
      expect(() => validateUpdateProduct(emptyData)).toThrow();
    });

    it('should validate individual field constraints', () => {
      // Arrange
      const invalidUpdate = {
        productCode: 'INVALID@CODE',
      };

      // Act & Assert
      expect(() => validateUpdateProduct(invalidUpdate)).toThrow();
    });
  });

  describe('validateProductId', () => {
    it('should validate positive integer IDs', () => {
      // Arrange
      const validIds = [
        { id: 1 },
        { id: '123' }, // String numbers should be coerced
        { id: 999 },
      ];

      // Act & Assert
      for (const idData of validIds) {
        const result = validateProductId(idData);

        expect(typeof result.id).toBe('number');
        expect(result.id).toBeGreaterThan(0);
      }
    });

    it('should reject invalid IDs', () => {
      // Arrange
      const invalidIds = [
        { id: 0 },
        { id: -1 },
        { id: 'abc' },
        { id: null },
        {},
      ];

      // Act & Assert
      for (const idData of invalidIds) {
        expect(() => validateProductId(idData)).toThrow();
      }
    });
  });

  describe('Schema Integration Tests', () => {
    it('should handle complex query parameter scenarios', () => {
      // Arrange - Simulating real URL query params
      const complexQuery = {
        page: '3',
        limit: '15',
        search: '   trimmed search   ',
        sortBy: 'productName',
        sortOrder: 'asc',
      };

      // Act
      const result = productListParamsSchema.parse(complexQuery);

      // Assert
      expect(result.page).toBe(3);
      expect(result.limit).toBe(15);
      expect(result.search).toBe('trimmed search'); // Should be trimmed
      expect(result.sortBy).toBe('productName');
      expect(result.sortOrder).toBe('asc');
    });

    it('should handle edge cases in form validation', () => {
      // Arrange - Edge case data
      const edgeCase = {
        productCode: 'A', // Minimum length
        productName: 'B', // Minimum length
        category: '', // Empty string
        notes: '', // Empty string
      };

      // Act
      const result = productFormSchema.parse(edgeCase);

      // Assert
      expect(result.productCode).toBe('A');
      expect(result.productName).toBe('B');
    });
  });
});
