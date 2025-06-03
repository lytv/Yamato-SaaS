import { describe, expect, it } from 'vitest';

import {
  StoredProcedurePaginatedSchema,
  StoredProcedureStatsSchema,
  StoredProcedureTodoSchema,
  validateStoredProcedurePaginated,
  validateStoredProcedureStats,
  validateStoredProcedureTodo,
} from './stored-procedures';

describe('Stored Procedure Validation Schemas', () => {
  describe('StoredProcedureTodoSchema', () => {
    it('should validate valid todo row from stored procedure', () => {
      // Arrange
      const validTodoRow = {
        id: 1,
        owner_id: 'user_123',
        title: 'Test Todo',
        message: 'Test Message',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Act & Assert
      expect(() => StoredProcedureTodoSchema.parse(validTodoRow)).not.toThrow();
    });

    it('should reject todo row with invalid id', () => {
      // Arrange
      const invalidTodoRow = {
        id: -1, // Invalid: negative number
        owner_id: 'user_123',
        title: 'Test Todo',
        message: 'Test Message',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Act & Assert
      expect(() => StoredProcedureTodoSchema.parse(invalidTodoRow)).toThrow();
    });

    it('should reject todo row with empty owner_id', () => {
      // Arrange
      const invalidTodoRow = {
        id: 1,
        owner_id: '', // Invalid: empty string
        title: 'Test Todo',
        message: 'Test Message',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Act & Assert
      expect(() => StoredProcedureTodoSchema.parse(invalidTodoRow)).toThrow();
    });

    it('should reject todo row with empty title', () => {
      // Arrange
      const invalidTodoRow = {
        id: 1,
        owner_id: 'user_123',
        title: '', // Invalid: empty string
        message: 'Test Message',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Act & Assert
      expect(() => StoredProcedureTodoSchema.parse(invalidTodoRow)).toThrow();
    });
  });

  describe('StoredProcedureStatsSchema', () => {
    it('should validate valid stats row from stored procedure', () => {
      // Arrange
      const validStatsRow = {
        total: 10,
        today: 2,
        this_week: 5,
        this_month: 8,
      };

      // Act & Assert
      expect(() => StoredProcedureStatsSchema.parse(validStatsRow)).not.toThrow();
    });

    it('should reject stats row with negative values', () => {
      // Arrange
      const invalidStatsRow = {
        total: -1, // Invalid: negative number
        today: 2,
        this_week: 5,
        this_month: 8,
      };

      // Act & Assert
      expect(() => StoredProcedureStatsSchema.parse(invalidStatsRow)).toThrow();
    });

    it('should allow zero values in stats', () => {
      // Arrange
      const validStatsRow = {
        total: 0,
        today: 0,
        this_week: 0,
        this_month: 0,
      };

      // Act & Assert
      expect(() => StoredProcedureStatsSchema.parse(validStatsRow)).not.toThrow();
    });
  });

  describe('StoredProcedurePaginatedSchema', () => {
    it('should validate valid paginated row from stored procedure', () => {
      // Arrange
      const validPaginatedRow = {
        id: 1,
        owner_id: 'user_123',
        title: 'Test Todo',
        message: 'Test Message',
        created_at: new Date(),
        updated_at: new Date(),
        total_count: 100,
      };

      // Act & Assert
      expect(() => StoredProcedurePaginatedSchema.parse(validPaginatedRow)).not.toThrow();
    });

    it('should reject paginated row with negative total_count', () => {
      // Arrange
      const invalidPaginatedRow = {
        id: 1,
        owner_id: 'user_123',
        title: 'Test Todo',
        message: 'Test Message',
        created_at: new Date(),
        updated_at: new Date(),
        total_count: -1, // Invalid: negative count
      };

      // Act & Assert
      expect(() => StoredProcedurePaginatedSchema.parse(invalidPaginatedRow)).toThrow();
    });
  });

  describe('Validation Helper Functions', () => {
    describe('validateStoredProcedureTodo', () => {
      it('should transform and validate valid todo row', () => {
        // Arrange
        const validRow = {
          id: 1,
          owner_id: 'user_123',
          title: 'Test Todo',
          message: 'Test Message',
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Act
        const result = validateStoredProcedureTodo(validRow);

        // Assert
        expect(result).toEqual(validRow);
        expect(result.id).toBe(1);
        expect(result.owner_id).toBe('user_123');
      });

      it('should throw error for invalid todo row', () => {
        // Arrange
        const invalidRow = {
          id: 'invalid', // Should be number
          owner_id: 'user_123',
          title: 'Test Todo',
          message: 'Test Message',
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Act & Assert
        expect(() => validateStoredProcedureTodo(invalidRow)).toThrow();
      });
    });

    describe('validateStoredProcedureStats', () => {
      it('should transform and validate valid stats row', () => {
        // Arrange
        const validRow = {
          total: 10,
          today: 2,
          this_week: 5,
          this_month: 8,
        };

        // Act
        const result = validateStoredProcedureStats(validRow);

        // Assert
        expect(result).toEqual(validRow);
        expect(result.total).toBe(10);
        expect(result.this_week).toBe(5);
      });
    });

    describe('validateStoredProcedurePaginated', () => {
      it('should transform and validate valid paginated row', () => {
        // Arrange
        const validRow = {
          id: 1,
          owner_id: 'user_123',
          title: 'Test Todo',
          message: 'Test Message',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-02'),
          total_count: 100,
        };

        // Act
        const result = validateStoredProcedurePaginated(validRow);

        // Assert
        expect(result).toEqual(validRow);
        expect(result.total_count).toBe(100);
      });
    });
  });
});
