/**
 * Todo Database Queries Tests
 * Following TDD Workflow Standards with Arrange-Act-Assert pattern
 * Testing all CRUD operations and edge cases
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/libs/DB';
import {
  createTodo,
  deleteTodo,
  getPaginatedTodos,
  getTodoById,
  getTodosByOwner,
  getTodosCount,
  getTodoStats,
  todoExists,
  updateTodo,
} from '@/libs/queries/todo';
import type { CreateTodoInput, TodoListParams } from '@/types/todo';

// Mock the database
vi.mock('@/libs/DB', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Todo Database Queries', () => {
  const mockOwnerId = 'user_123';
  const mockTodo = {
    id: 1,
    ownerId: mockOwnerId,
    title: 'Test Todo',
    message: 'Test message',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTodo', () => {
    it('should create a new todo with valid data', async () => {
      // Arrange
      const todoData: CreateTodoInput = {
        ownerId: mockOwnerId,
        title: 'New Todo',
        message: 'New todo message',
      };

      const mockInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockTodo]),
      };

      (db.insert as any).mockReturnValue(mockInsertChain);

      // Act
      const result = await createTodo(todoData);

      // Assert
      expect(db.insert).toHaveBeenCalledWith(expect.any(Object));
      expect(mockInsertChain.values).toHaveBeenCalledWith({
        ownerId: todoData.ownerId,
        title: todoData.title,
        message: todoData.message,
      });
      expect(mockInsertChain.returning).toHaveBeenCalled();
      expect(result).toEqual(mockTodo);
    });

    it('should throw error when todo creation fails', async () => {
      // Arrange
      const todoData: CreateTodoInput = {
        ownerId: mockOwnerId,
        title: 'New Todo',
        message: 'New todo message',
      };

      const mockInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      (db.insert as any).mockReturnValue(mockInsertChain);

      // Act & Assert
      await expect(createTodo(todoData)).rejects.toThrow('Failed to create todo');
    });
  });

  describe('getTodosByOwner', () => {
    const mockParams: TodoListParams = {
      ownerId: mockOwnerId,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    it('should retrieve todos for owner with pagination', async () => {
      // Arrange
      const mockTodos = [mockTodo];
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockTodos),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getTodosByOwner(mockParams);

      // Assert
      expect(db.select).toHaveBeenCalled();
      expect(mockSelectChain.from).toHaveBeenCalled();
      expect(mockSelectChain.where).toHaveBeenCalled();
      expect(mockSelectChain.orderBy).toHaveBeenCalled();
      expect(mockSelectChain.limit).toHaveBeenCalledWith(10);
      expect(mockSelectChain.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockTodos);
    });

    it('should apply search filter when search term is provided', async () => {
      // Arrange
      const paramsWithSearch = { ...mockParams, search: 'test' };
      const mockTodos = [mockTodo];
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockTodos),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getTodosByOwner(paramsWithSearch);

      // Assert
      expect(mockSelectChain.where).toHaveBeenCalled();
      expect(result).toEqual(mockTodos);
    });

    it('should handle different sort orders', async () => {
      // Arrange
      const paramsWithAscOrder = { ...mockParams, sortOrder: 'asc' as const };
      const mockTodos = [mockTodo];
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockTodos),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getTodosByOwner(paramsWithAscOrder);

      // Assert
      expect(mockSelectChain.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockTodos);
    });
  });

  describe('getTodoById', () => {
    it('should return todo when found with correct owner', async () => {
      // Arrange
      const todoId = 1;
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockTodo]),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getTodoById(todoId, mockOwnerId);

      // Assert
      expect(db.select).toHaveBeenCalled();
      expect(mockSelectChain.where).toHaveBeenCalled();
      expect(mockSelectChain.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTodo);
    });

    it('should return null when todo not found', async () => {
      // Arrange
      const todoId = 999;
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getTodoById(todoId, mockOwnerId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateTodo', () => {
    it('should update todo when exists and belongs to owner', async () => {
      // Arrange
      const todoId = 1;
      const updateData = { title: 'Updated Title' };
      const updatedTodo = { ...mockTodo, title: 'Updated Title' };

      // Mock getTodoById to return existing todo
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockTodo]),
      };
      (db.select as any).mockReturnValue(mockSelectChain);

      // Mock update operation
      const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedTodo]),
      };
      (db.update as any).mockReturnValue(mockUpdateChain);

      // Act
      const result = await updateTodo(todoId, mockOwnerId, updateData);

      // Assert
      expect(db.update).toHaveBeenCalled();
      expect(mockUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
        }),
      );
      expect(result).toEqual(updatedTodo);
    });

    it('should throw error when todo not found or access denied', async () => {
      // Arrange
      const todoId = 999;
      const updateData = { title: 'Updated Title' };

      // Mock getTodoById to return null
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      (db.select as any).mockReturnValue(mockSelectChain);

      // Act & Assert
      await expect(updateTodo(todoId, mockOwnerId, updateData)).rejects.toThrow(
        'Todo not found or access denied',
      );
    });
  });

  describe('deleteTodo', () => {
    it('should delete todo when exists and belongs to owner', async () => {
      // Arrange
      const todoId = 1;

      // Mock getTodoById to return existing todo
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockTodo]),
      };
      (db.select as any).mockReturnValue(mockSelectChain);

      // Mock delete operation
      const mockDeleteChain = {
        where: vi.fn().mockResolvedValue({ affectedRows: 1 }),
      };
      (db.delete as any).mockReturnValue(mockDeleteChain);

      // Act
      const result = await deleteTodo(todoId, mockOwnerId);

      // Assert
      expect(db.delete).toHaveBeenCalled();
      expect(mockDeleteChain.where).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error when todo not found or access denied', async () => {
      // Arrange
      const todoId = 999;

      // Mock getTodoById to return null
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      (db.select as any).mockReturnValue(mockSelectChain);

      // Act & Assert
      await expect(deleteTodo(todoId, mockOwnerId)).rejects.toThrow(
        'Todo not found or access denied',
      );
    });
  });

  describe('getTodoStats', () => {
    it('should return correct statistics for owner', async () => {
      // Arrange

      // Mock multiple calls for different time periods
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ count: 10 }]), // total
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ count: 2 }]), // today
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ count: 5 }]), // week
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ count: 8 }]), // month
        });

      // Act
      const result = await getTodoStats(mockOwnerId);

      // Assert
      expect(result.total).toBe(10);
      expect(result.today).toBe(2);
      expect(result.thisWeek).toBe(5);
      expect(result.thisMonth).toBe(8);
    });
  });

  describe('getTodosCount', () => {
    it('should return correct count for owner', async () => {
      // Arrange
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      };
      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getTodosCount(mockOwnerId);

      // Assert
      expect(result).toBe(5);
    });

    it('should apply search filter when provided', async () => {
      // Arrange
      const searchTerm = 'test';
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      };
      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getTodosCount(mockOwnerId, searchTerm);

      // Assert
      expect(result).toBe(2);
    });
  });

  describe('todoExists', () => {
    it('should return true when todo exists and belongs to owner', async () => {
      // Arrange
      const todoId = 1;
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockTodo]),
      };
      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await todoExists(todoId, mockOwnerId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when todo does not exist', async () => {
      // Arrange
      const todoId = 999;
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await todoExists(todoId, mockOwnerId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getPaginatedTodos', () => {
    it('should return todos with pagination metadata', async () => {
      // Arrange
      const mockParams: TodoListParams = {
        ownerId: mockOwnerId,
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockTodos = [mockTodo];

      // Mock getTodosByOwner
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockTodos),
      };
      (db.select as any).mockReturnValue(mockSelectChain);

      // Act
      const result = await getPaginatedTodos(mockParams);

      // Assert
      expect(result.todos).toEqual(mockTodos);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.hasMore).toBe(true);
    });
  });
});
