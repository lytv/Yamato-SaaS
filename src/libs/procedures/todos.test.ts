import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  callCreateTodo,
  callDeleteTodo,
  callGetPaginatedTodos,
  callGetTodoById,
  callGetTodosCount,
  callGetTodoStats,
  callTodoExists,
  callUpdateTodo,
} from './todos';

// Mock the database
vi.mock('@/libs/DB', () => ({
  db: {
    execute: vi.fn(),
  },
}));

// Mock validation functions
vi.mock('@/libs/validations/stored-procedures', () => ({
  validateStoredProcedureTodo: vi.fn(data => data),
  validateStoredProcedureStats: vi.fn(data => data),
  validateStoredProcedurePaginated: vi.fn(data => data),
}));

describe('Todo Stored Procedure Wrappers', () => {
  const testOwnerId = 'test-owner-123';

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset validation mocks to default behavior
    const { validateStoredProcedureTodo, validateStoredProcedureStats, validateStoredProcedurePaginated } = await import('@/libs/validations/stored-procedures');
    vi.mocked(validateStoredProcedureTodo).mockImplementation((data: any) => data);
    vi.mocked(validateStoredProcedureStats).mockImplementation((data: any) => data);
    vi.mocked(validateStoredProcedurePaginated).mockImplementation((data: any) => data);
  });

  describe('callGetTodoById', () => {
    it('should return transformed todo when found', async () => {
      // Arrange
      const mockDbResult = [{
        id: 1,
        owner_id: 'test-owner-123',
        title: 'Test Todo',
        message: 'Test Message',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
      }];

      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue(mockDbResult as any);

      // Act
      const result = await callGetTodoById(1, testOwnerId);

      // Assert
      expect(result).toEqual({
        id: 1,
        ownerId: 'test-owner-123',
        title: 'Test Todo',
        message: 'Test Message',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      });
      expect(db.execute).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return null when todo not found', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([] as any);

      // Act
      const result = await callGetTodoById(999, testOwnerId);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      const invalidDbResult = [{
        id: 'invalid', // Should be number
        owner_id: 'test-owner-123',
        title: 'Test Todo',
        message: 'Test Message',
        created_at: new Date(),
        updated_at: new Date(),
      }];

      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue(invalidDbResult as any);

      // Reset validation mock for this test
      const { validateStoredProcedureTodo } = await import('@/libs/validations/stored-procedures');
      vi.mocked(validateStoredProcedureTodo).mockImplementation(() => {
        throw new Error('Invalid stored procedure todo result');
      });

      // Act & Assert
      await expect(callGetTodoById(1, testOwnerId)).rejects.toThrow('Invalid stored procedure todo result');
    });
  });

  describe('callCreateTodo', () => {
    it('should create and return transformed todo', async () => {
      // Arrange
      const mockDbResult = [{
        id: 1,
        owner_id: 'test-owner-123',
        title: 'New Todo',
        message: 'New Message',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      }];

      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue(mockDbResult as any);

      const todoData = {
        ownerId: testOwnerId,
        title: 'New Todo',
        message: 'New Message',
      };

      // Act
      const result = await callCreateTodo(todoData);

      // Assert
      expect(result).toEqual({
        id: 1,
        ownerId: 'test-owner-123',
        title: 'New Todo',
        message: 'New Message',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      });
      expect(db.execute).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw error when creation fails', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([] as any);

      const todoData = {
        ownerId: testOwnerId,
        title: 'New Todo',
        message: 'New Message',
      };

      // Act & Assert
      await expect(callCreateTodo(todoData)).rejects.toThrow('Failed to create todo');
    });
  });

  describe('callUpdateTodo', () => {
    it('should update and return transformed todo', async () => {
      // Arrange
      const mockDbResult = [{
        id: 1,
        owner_id: 'test-owner-123',
        title: 'Updated Title',
        message: 'Original Message',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
      }];

      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue(mockDbResult as any);

      // Act
      const result = await callUpdateTodo(1, testOwnerId, { title: 'Updated Title' });

      // Assert
      expect(result).toEqual({
        id: 1,
        ownerId: 'test-owner-123',
        title: 'Updated Title',
        message: 'Original Message',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      });
      expect(db.execute).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw "Todo not found or access denied" for invalid todo', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([] as any);

      // Act & Assert
      await expect(
        callUpdateTodo(999, testOwnerId, { title: 'Updated' }),
      ).rejects.toThrow('Todo not found or access denied');
    });
  });

  describe('callDeleteTodo', () => {
    it('should return true when deletion succeeds', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([{ success: true }] as any);

      // Act
      const result = await callDeleteTodo(1, testOwnerId);

      // Assert
      expect(result).toBe(true);
      expect(db.execute).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return false when deletion fails', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([{ success: false }] as any);

      // Act
      const result = await callDeleteTodo(999, testOwnerId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('callGetTodoStats', () => {
    it('should return transformed stats', async () => {
      // Arrange
      const mockDbResult = [{
        total: 10,
        today: 2,
        this_week: 5,
        this_month: 8,
      }];

      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue(mockDbResult as any);

      // Act
      const result = await callGetTodoStats(testOwnerId);

      // Assert
      expect(result).toEqual({
        total: 10,
        today: 2,
        thisWeek: 5,
        thisMonth: 8,
      });
      expect(db.execute).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return zero stats when no data', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([] as any);

      // Act
      const result = await callGetTodoStats(testOwnerId);

      // Assert
      expect(result).toEqual({
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
      });
    });
  });

  describe('callGetPaginatedTodos', () => {
    it('should return transformed paginated results', async () => {
      // Arrange
      const mockDbResult = [
        {
          id: 1,
          owner_id: 'test-owner-123',
          title: 'Todo 1',
          message: 'Message 1',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01'),
          total_count: 2,
        },
        {
          id: 2,
          owner_id: 'test-owner-123',
          title: 'Todo 2',
          message: 'Message 2',
          created_at: new Date('2023-01-02'),
          updated_at: new Date('2023-01-02'),
          total_count: 2,
        },
      ];

      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue(mockDbResult as any);

      const params = {
        ownerId: testOwnerId,
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      // Act
      const result = await callGetPaginatedTodos(params);

      // Assert
      expect(result.todos).toHaveLength(2);
      expect(result.todos[0]).toEqual({
        id: 1,
        ownerId: 'test-owner-123',
        title: 'Todo 1',
        message: 'Message 1',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        hasMore: false,
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([] as any);

      const params = {
        ownerId: testOwnerId,
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      // Act
      const result = await callGetPaginatedTodos(params);

      // Assert
      expect(result.todos).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe('callGetTodosCount', () => {
    it('should return count from database', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([{ count: 5 }] as any);

      // Act
      const result = await callGetTodosCount(testOwnerId, 'search term');

      // Assert
      expect(result).toBe(5);
      expect(db.execute).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return 0 when no count returned', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([{}] as any);

      // Act
      const result = await callGetTodosCount(testOwnerId);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('callTodoExists', () => {
    it('should return true when todo exists', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([{ exists: true }] as any);

      // Act
      const result = await callTodoExists(1, testOwnerId);

      // Assert
      expect(result).toBe(true);
      expect(db.execute).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return false when todo does not exist', async () => {
      // Arrange
      const { db } = await import('@/libs/DB');
      vi.mocked(db.execute).mockResolvedValue([{ exists: false }] as any);

      // Act
      const result = await callTodoExists(999, testOwnerId);

      // Assert
      expect(result).toBe(false);
    });
  });
});
