/**
 * useTodoMutations Hook Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing todo CRUD mutations (create, update, delete)
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTodoMutations } from '@/hooks/useTodoMutations';
import type { Todo } from '@/types/todo';

// Mock API client
vi.mock('@/libs/api/todos', () => ({
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}));

const { createTodo, updateTodo, deleteTodo } = await import('@/libs/api/todos');

describe('useTodoMutations Hook', () => {
  const mockTodo: Todo = {
    id: 1,
    ownerId: 'user_123',
    title: 'Test Todo',
    message: 'Test message',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state with no loading or errors', () => {
      // Act
      const { result } = renderHook(() => useTodoMutations());

      // Assert
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Create Todo', () => {
    it('should handle successful todo creation', async () => {
      // Arrange
      vi.mocked(createTodo).mockResolvedValue(mockTodo);
      const { result } = renderHook(() => useTodoMutations());

      // Act
      let promise: Promise<any>;
      act(() => {
        promise = result.current.createTodo({
          title: 'New Todo',
          message: 'New message',
        });
      });

      // Assert loading state
      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      });

      expect(result.current.error).toBeNull();

      const todo = await promise!;

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(todo).toEqual(mockTodo);
      expect(createTodo).toHaveBeenCalledWith({
        title: 'New Todo',
        message: 'New message',
      });
    });

    it('should handle todo creation error', async () => {
      // Arrange
      const errorMessage = 'Failed to create todo';
      vi.mocked(createTodo).mockRejectedValue(new Error(errorMessage));
      const { result } = renderHook(() => useTodoMutations());

      // Act & Assert
      let promise: Promise<any>;
      act(() => {
        promise = result.current.createTodo({
          title: 'New Todo',
          message: 'New message',
        });
      });

      await expect(promise!).rejects.toThrow(errorMessage);

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('Update Todo', () => {
    it('should handle successful todo update', async () => {
      // Arrange
      const updatedTodo = { ...mockTodo, title: 'Updated Title' };
      vi.mocked(updateTodo).mockResolvedValue(updatedTodo);
      const { result } = renderHook(() => useTodoMutations());

      // Act
      let promise: Promise<any>;
      act(() => {
        promise = result.current.updateTodo(1, {
          title: 'Updated Title',
          message: 'Updated message',
        });
      });

      // Assert loading state
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      expect(result.current.error).toBeNull();

      const todo = await promise!;

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(todo).toEqual(updatedTodo);
      expect(updateTodo).toHaveBeenCalledWith(1, {
        title: 'Updated Title',
        message: 'Updated message',
      });
    });

    it('should handle todo update error', async () => {
      // Arrange
      const errorMessage = 'Failed to update todo';
      vi.mocked(updateTodo).mockRejectedValue(new Error(errorMessage));
      const { result } = renderHook(() => useTodoMutations());

      // Act & Assert
      let promise: Promise<any>;
      act(() => {
        promise = result.current.updateTodo(1, {
          title: 'Updated Title',
          message: 'Updated message',
        });
      });

      await expect(promise!).rejects.toThrow(errorMessage);

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('Delete Todo', () => {
    it('should handle successful todo deletion', async () => {
      // Arrange
      vi.mocked(deleteTodo).mockResolvedValue();
      const { result } = renderHook(() => useTodoMutations());

      // Act
      let promise: Promise<any>;
      act(() => {
        promise = result.current.deleteTodo(1);
      });

      // Assert loading state
      await waitFor(() => {
        expect(result.current.isDeleting).toBe(true);
      });

      expect(result.current.error).toBeNull();

      await promise!;

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });

      expect(deleteTodo).toHaveBeenCalledWith(1);
    });

    it('should handle todo deletion error', async () => {
      // Arrange
      const errorMessage = 'Failed to delete todo';
      vi.mocked(deleteTodo).mockRejectedValue(new Error(errorMessage));
      const { result } = renderHook(() => useTodoMutations());

      // Act & Assert
      let promise: Promise<any>;
      act(() => {
        promise = result.current.deleteTodo(1);
      });

      await expect(promise!).rejects.toThrow(errorMessage);

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('Clear Error', () => {
    it('should clear error state', async () => {
      // Arrange
      vi.mocked(createTodo).mockRejectedValue(new Error('Test error'));
      const { result } = renderHook(() => useTodoMutations());

      // Create an error
      let promise: Promise<any>;
      act(() => {
        promise = result.current.createTodo({
          title: 'New Todo',
          message: 'New message',
        });
      });

      await expect(promise!).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
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
