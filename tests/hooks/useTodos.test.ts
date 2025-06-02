/**
 * useTodos Hook Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing todo data fetching, pagination, and state management
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTodos } from '@/hooks/useTodos';
import { fetchTodos } from '@/libs/api/todos';
import type { Todo, TodoListParams } from '@/types/todo';

// Mock API client
vi.mock('@/libs/api/todos', () => ({
  fetchTodos: vi.fn(),
}));

const mockFetchTodos = vi.mocked(fetchTodos);

describe('useTodos Hook', () => {
  const mockTodos: Todo[] = [
    {
      id: 1,
      ownerId: 'user_123',
      title: 'Test Todo 1',
      message: 'First test todo',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      id: 2,
      ownerId: 'user_123',
      title: 'Test Todo 2',
      message: 'Second test todo',
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
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
    it('should return initial state with empty todos and loading true', () => {
      // Arrange
      mockFetchTodos.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      const { result } = renderHook(() => useTodos());

      // Assert
      expect(result.current.todos).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Successful Data Fetching', () => {
    it('should fetch todos and update state correctly', async () => {
      // Arrange
      mockFetchTodos.mockResolvedValue({
        success: true,
        data: mockTodos,
        pagination: mockPagination,
      });

      // Act
      const { result } = renderHook(() => useTodos());

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.todos).toEqual(mockTodos);
      expect(result.current.pagination).toEqual(mockPagination);
      expect(result.current.error).toBeNull();
      expect(mockFetchTodos).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should fetch todos with custom parameters', async () => {
      // Arrange
      mockFetchTodos.mockResolvedValue({
        success: true,
        data: mockTodos,
        pagination: mockPagination,
      });

      const customParams: TodoListParams = {
        page: 2,
        limit: 5,
        search: 'test',
        sortBy: 'title',
        sortOrder: 'asc',
        ownerId: 'test-owner-id',
      };

      // Act
      const { result } = renderHook(() => useTodos(customParams));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchTodos).toHaveBeenCalledWith(customParams);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch todos';
      mockFetchTodos.mockRejectedValue(new Error(errorMessage));

      // Act
      const { result } = renderHook(() => useTodos());

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.todos).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle API response errors correctly', async () => {
      // Arrange
      mockFetchTodos.mockResolvedValue({
        success: false,
        error: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      } as any);

      // Act
      const { result } = renderHook(() => useTodos());

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.todos).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.error).toBe('Unauthorized access');
    });
  });

  describe('Parameter Changes', () => {
    it('should refetch data when parameters change', async () => {
      // Arrange
      mockFetchTodos.mockResolvedValue({
        success: true,
        data: mockTodos,
        pagination: mockPagination,
      });

      const initialParams: TodoListParams = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'test-owner-id',
      };

      // Act
      const { result, rerender } = renderHook(
        ({ params }) => useTodos(params),
        { initialProps: { params: initialParams } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change parameters
      const newParams: TodoListParams = {
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'test-owner-id',
      };

      rerender({ params: newParams });

      // Assert
      await waitFor(() => {
        expect(mockFetchTodos).toHaveBeenCalledTimes(2);
      });

      expect(mockFetchTodos).toHaveBeenLastCalledWith(newParams);
    });

    it('should not refetch data when parameters are the same', async () => {
      // Arrange
      mockFetchTodos.mockResolvedValue({
        success: true,
        data: mockTodos,
        pagination: mockPagination,
      });

      const params: TodoListParams = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'test-owner-id',
      };

      // Act
      const { result, rerender } = renderHook(
        ({ params }) => useTodos(params),
        { initialProps: { params } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rerender with same parameters
      rerender({ params });

      // Assert
      expect(mockFetchTodos).toHaveBeenCalledTimes(1);
    });
  });

  describe('Refresh Functionality', () => {
    it('should provide refresh function to refetch data', async () => {
      // Arrange
      mockFetchTodos.mockResolvedValue({
        success: true,
        data: mockTodos,
        pagination: mockPagination,
      });

      // Act
      const { result } = renderHook(() => useTodos());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call refresh
      result.current.refresh();

      // Assert
      await waitFor(() => {
        expect(mockFetchTodos).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Loading States', () => {
    it('should set loading to true during initial fetch', () => {
      // Arrange
      mockFetchTodos.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      const { result } = renderHook(() => useTodos());

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should set loading to true during refresh', async () => {
      // Arrange
      mockFetchTodos.mockResolvedValue({
        success: true,
        data: mockTodos,
        pagination: mockPagination,
      });

      const { result } = renderHook(() => useTodos());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      mockFetchTodos.mockImplementation(() => new Promise(() => {})); // Never resolves
      result.current.refresh();

      // Assert
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cancel ongoing requests on unmount', async () => {
      // Arrange
      mockFetchTodos.mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      // Act
      const { unmount } = renderHook(() => useTodos());

      // Unmount before request completes
      unmount();

      // Assert - No specific assertion needed as this tests cleanup behavior
      // The important thing is that no errors are thrown
    });
  });
});
