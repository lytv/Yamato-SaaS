/**
 * useTodos Hook Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing todo data fetching, pagination, and state management
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTodos } from '@/hooks/useTodos';
import type { Todo } from '@/types/todo';

// Mock API client
vi.mock('@/libs/api/todos', () => ({
  fetchTodos: vi.fn(),
}));

const { fetchTodos } = await import('@/libs/api/todos');

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
      vi.mocked(fetchTodos).mockImplementation(() => new Promise(() => {})); // Never resolves

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
      vi.mocked(fetchTodos).mockResolvedValue({
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
      expect(fetchTodos).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should fetch todos with custom parameters', async () => {
      // Arrange
      vi.mocked(fetchTodos).mockResolvedValue({
        success: true,
        data: mockTodos,
        pagination: mockPagination,
      });

      const customParams = {
        page: 2,
        limit: 5,
        search: 'test',
        sortBy: 'title' as const,
        sortOrder: 'asc' as const,
      };

      // Act
      const { result } = renderHook(() => useTodos(customParams));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchTodos).toHaveBeenCalledWith(customParams);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch todos';
      vi.mocked(fetchTodos).mockRejectedValue(new Error(errorMessage));

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
      const errorMessage = 'Unauthorized access';
      vi.mocked(fetchTodos).mockRejectedValue(new Error(errorMessage));

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
  });

  describe('Refresh Functionality', () => {
    it('should provide refresh function to refetch data', async () => {
      // Arrange
      vi.mocked(fetchTodos).mockResolvedValue({
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
      act(() => {
        result.current.refresh();
      });

      // Assert
      await waitFor(() => {
        expect(fetchTodos).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Loading States', () => {
    it('should set loading to true during initial fetch', () => {
      // Arrange
      vi.mocked(fetchTodos).mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      const { result } = renderHook(() => useTodos());

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should set loading to true during refresh', async () => {
      // Arrange
      vi.mocked(fetchTodos).mockResolvedValue({
        success: true,
        data: mockTodos,
        pagination: mockPagination,
      });

      const { result } = renderHook(() => useTodos());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      vi.mocked(fetchTodos).mockImplementation(() => new Promise(() => {})); // Never resolves
      act(() => {
        result.current.refresh();
      });

      // Assert
      expect(result.current.isLoading).toBe(true);
    });
  });
});
