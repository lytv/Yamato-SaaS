/**
 * ProductionStep Validation Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing Zod validation schemas and query parameter handling
 */

import { describe, expect, it } from 'vitest';

// These imports will fail until we implement them (RED phase)
import {
  validateCreateProductionStep,
  validateProductionStepForm,
  validateProductionStepId,
  validateProductionStepListParams,
  validateUpdateProductionStep,
} from '@/libs/validations/productionStep';

describe('ProductionStep Validation Schemas', () => {
  describe('validateProductionStepListParams', () => {
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
      const result = validateProductionStepListParams(queryParams);

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
        search: 'test step',
        sortBy: 'stepName',
        sortOrder: 'asc',
      };

      // Act
      const result = validateProductionStepListParams(queryParams);

      // Assert
      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
      expect(result.search).toBe('test step');
      expect(result.sortBy).toBe('stepName');
      expect(result.sortOrder).toBe('asc');
    });

    it('should use Number.isNaN not isNaN for validation', () => {
      // Arrange - Invalid number strings
      const queryParams = {
        page: 'invalid',
        limit: 'notanumber',
      };

      // Act
      const result = validateProductionStepListParams(queryParams);

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
      const result = validateProductionStepListParams(queryParams);

      // Assert
      expect(result.page).toBe(1); // Minimum enforced
      expect(result.limit).toBe(100); // Maximum enforced
    });

    it('should validate sortBy enum values', () => {
      // Arrange
      const validSortBy = ['createdAt', 'updatedAt', 'stepName', 'stepCode', 'filmSequence'];

      for (const sortBy of validSortBy) {
        const queryParams = { sortBy };

        // Act
        const result = validateProductionStepListParams(queryParams);

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
      const result = validateProductionStepListParams(queryParams);

      // Assert
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });
  });

  describe('validateProductionStepForm', () => {
    it('should validate required fields', () => {
      // Arrange
      const validFormData = {
        stepCode: 'CD61',
        stepName: 'Ủi túi lớn',
        filmSequence: '61',
        stepGroup: 'Group A',
        notes: 'Test notes',
      };

      // Act
      const result = validateProductionStepForm(validFormData);

      // Assert
      expect(result.stepCode).toBe('CD61');
      expect(result.stepName).toBe('Ủi túi lớn');
      expect(result.filmSequence).toBe('61');
      expect(result.stepGroup).toBe('Group A');
      expect(result.notes).toBe('Test notes');
    });

    it('should enforce stepCode regex pattern', () => {
      // Arrange
      const invalidCodes = [
        'CD@61', // Special characters
        'CD 61', // Spaces
        'CD#61', // Hash
      ];

      // Act & Assert
      for (const stepCode of invalidCodes) {
        expect(() => {
          validateProductionStepForm({
            stepCode,
            stepName: 'Test Step',
          });
        }).toThrow();
      }
    });

    it('should allow valid stepCode patterns', () => {
      // Arrange
      const validCodes = [
        'CD61',
        'CD_61',
        'CD-61',
        'cd61',
        'Step123',
      ];

      // Act & Assert
      for (const stepCode of validCodes) {
        expect(() => {
          validateProductionStepForm({
            stepCode,
            stepName: 'Test Step',
          });
        }).not.toThrow();
      }
    });

    it('should enforce field length limits', () => {
      // Arrange
      const longData = {
        stepCode: 'A'.repeat(51), // Over 50 limit
        stepName: 'B'.repeat(201), // Over 200 limit
        filmSequence: 'C'.repeat(51), // Over 50 limit
        stepGroup: 'D'.repeat(101), // Over 100 limit
        notes: 'E'.repeat(1001), // Over 1000 limit
      };

      // Act & Assert
      expect(() => validateProductionStepForm(longData)).toThrow();
    });

    it('should allow optional fields to be undefined', () => {
      // Arrange
      const minimalData = {
        stepCode: 'CD61',
        stepName: 'Ủi túi lớn',
      };

      // Act
      const result = validateProductionStepForm(minimalData);

      // Assert
      expect(result.stepCode).toBe('CD61');
      expect(result.stepName).toBe('Ủi túi lớn');
      expect(result.filmSequence).toBeUndefined();
      expect(result.stepGroup).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('should allow empty strings for optional fields', () => {
      // Arrange
      const dataWithEmptyStrings = {
        stepCode: 'CD61',
        stepName: 'Ủi túi lớn',
        filmSequence: '',
        stepGroup: '',
        notes: '',
      };

      // Act
      const result = validateProductionStepForm(dataWithEmptyStrings);

      // Assert
      expect(result.stepCode).toBe('CD61');
      expect(result.stepName).toBe('Ủi túi lớn');
      expect(result.filmSequence).toBe('');
      expect(result.stepGroup).toBe('');
      expect(result.notes).toBe('');
    });

    it('should trim whitespace from all fields', () => {
      // Arrange
      const dataWithWhitespace = {
        stepCode: '  CD61  ',
        stepName: '  Ủi túi lớn  ',
        filmSequence: '  61  ',
        stepGroup: '  Group A  ',
        notes: '  Test notes  ',
      };

      // Act
      const result = validateProductionStepForm(dataWithWhitespace);

      // Assert
      expect(result.stepCode).toBe('CD61');
      expect(result.stepName).toBe('Ủi túi lớn');
      expect(result.filmSequence).toBe('61');
      expect(result.stepGroup).toBe('Group A');
      expect(result.notes).toBe('Test notes');
    });
  });

  describe('validateCreateProductionStep', () => {
    it('should validate complete creation data', () => {
      // Arrange
      const createData = {
        stepCode: 'CD61',
        stepName: 'Ủi túi lớn',
        filmSequence: '61',
        stepGroup: 'Group A',
        notes: 'Test notes',
      };

      // Act
      const result = validateCreateProductionStep(createData);

      // Assert
      expect(result.stepCode).toBe('CD61');
      expect(result.stepName).toBe('Ủi túi lớn');
      expect(result.filmSequence).toBe('61');
      expect(result.stepGroup).toBe('Group A');
      expect(result.notes).toBe('Test notes');
    });

    it('should require stepCode and stepName', () => {
      // Arrange
      const incompleteData = {
        filmSequence: '61',
      };

      // Act & Assert
      expect(() => validateCreateProductionStep(incompleteData)).toThrow();
    });
  });

  describe('validateUpdateProductionStep', () => {
    it('should allow partial updates', () => {
      // Arrange
      const updateData = {
        stepName: 'Updated step name',
      };

      // Act
      const result = validateUpdateProductionStep(updateData);

      // Assert
      expect(result.stepName).toBe('Updated step name');
      expect(result.stepCode).toBeUndefined();
      expect(result.filmSequence).toBeUndefined();
      expect(result.stepGroup).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('should require at least one field', () => {
      // Arrange
      const emptyData = {};

      // Act & Assert
      expect(() => validateUpdateProductionStep(emptyData)).toThrow('At least one field must be provided');
    });

    it('should validate provided fields', () => {
      // Arrange
      const updateData = {
        stepCode: 'CD62',
        stepName: 'Updated step',
        filmSequence: '62',
      };

      // Act
      const result = validateUpdateProductionStep(updateData);

      // Assert
      expect(result.stepCode).toBe('CD62');
      expect(result.stepName).toBe('Updated step');
      expect(result.filmSequence).toBe('62');
    });
  });

  describe('validateProductionStepId', () => {
    it('should validate positive integer IDs', () => {
      // Arrange
      const validIds = [1, 42, 999, '123'];

      // Act & Assert
      for (const id of validIds) {
        const result = validateProductionStepId({ id });

        expect(typeof result.id).toBe('number');
        expect(result.id).toBeGreaterThan(0);
      }
    });

    it('should reject invalid IDs', () => {
      // Arrange
      const invalidIds = [0, -1, 'abc', null, undefined];

      // Act & Assert
      for (const id of invalidIds) {
        expect(() => validateProductionStepId({ id })).toThrow();
      }
    });

    it('should coerce string numbers to integers', () => {
      // Arrange
      const stringId = { id: '42' };

      // Act
      const result = validateProductionStepId(stringId);

      // Assert
      expect(result.id).toBe(42);
      expect(typeof result.id).toBe('number');
    });
  });
});
