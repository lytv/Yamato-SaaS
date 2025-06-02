/**
 * TodoList Component Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing todo list rendering, pagination, filtering, and interactions
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TodoList } from '@/features/todo/TodoList';
import type { Todo } from '@/types/todo';

// Mock hooks
vi.mock('@/hooks/useTodos', () => ({
  useTodos: vi.fn(),
}));

vi.mock('@/hooks/useTodoFilters', () => ({
  useTodoFilters: vi.fn(),
}));

// Mock i18n
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

describe('TodoList Component', () => {
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

  describe('Rendering', () => {
    it('should render todo list with items', () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');

      useTodos.mockReturnValue({
        todos: mockTodos,
        pagination: mockPagination,
        isLoading: false,
        error: null,
      });

      useTodoFilters.mockReturnValue({
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        handleSearchChange: vi.fn(),
        handleSortChange: vi.fn(),
        resetFilters: vi.fn(),
      });

      // Act
      render(<TodoList />);

      // Assert
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
      expect(screen.getByText('First test todo')).toBeInTheDocument();
      expect(screen.getByText('Second test todo')).toBeInTheDocument();
    });

    it('should render empty state when no todos', () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');

      useTodos.mockReturnValue({
        todos: [],
        pagination: { page: 1, limit: 10, total: 0, hasMore: false },
        isLoading: false,
        error: null,
      });

      useTodoFilters.mockReturnValue({
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        handleSearchChange: vi.fn(),
        handleSortChange: vi.fn(),
        resetFilters: vi.fn(),
      });

      // Act
      render(<TodoList />);

      // Assert
      expect(screen.getByText('todo.noTodos')).toBeInTheDocument();
    });

    it('should render loading skeleton when loading', () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');

      useTodos.mockReturnValue({
        todos: [],
        pagination: null,
        isLoading: true,
        error: null,
      });

      useTodoFilters.mockReturnValue({
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        handleSearchChange: vi.fn(),
        handleSortChange: vi.fn(),
        resetFilters: vi.fn(),
      });

      // Act
      render(<TodoList />);

      // Assert
      expect(screen.getAllByTestId('todo-skeleton')).toHaveLength(5);
    });

    it('should render error state when error occurs', () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');

      useTodos.mockReturnValue({
        todos: [],
        pagination: null,
        isLoading: false,
        error: 'Failed to fetch todos',
      });

      useTodoFilters.mockReturnValue({
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        handleSearchChange: vi.fn(),
        handleSortChange: vi.fn(),
        resetFilters: vi.fn(),
      });

      // Act
      render(<TodoList />);

      // Assert
      expect(screen.getByText('error.fetchTodos')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch todos')).toBeInTheDocument();
    });
  });

  describe('Filtering and Search', () => {
    it('should handle search input changes', async () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');
      const mockHandleSearchChange = vi.fn();

      useTodos.mockReturnValue({
        todos: mockTodos,
        pagination: mockPagination,
        isLoading: false,
        error: null,
      });

      useTodoFilters.mockReturnValue({
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        handleSearchChange: mockHandleSearchChange,
        handleSortChange: vi.fn(),
        resetFilters: vi.fn(),
      });

      render(<TodoList />);

      // Act
      const searchInput = screen.getByPlaceholderText('todo.searchPlaceholder');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      // Assert
      await waitFor(() => {
        expect(mockHandleSearchChange).toHaveBeenCalledWith('test search');
      });
    });

    it('should handle sort change', async () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');
      const mockHandleSortChange = vi.fn();

      useTodos.mockReturnValue({
        todos: mockTodos,
        pagination: mockPagination,
        isLoading: false,
        error: null,
      });

      useTodoFilters.mockReturnValue({
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        handleSearchChange: vi.fn(),
        handleSortChange: mockHandleSortChange,
        resetFilters: vi.fn(),
      });

      render(<TodoList />);

      // Act
      const sortSelect = screen.getByTestId('sort-select');
      fireEvent.change(sortSelect, { target: { value: 'title' } });

      // Assert
      await waitFor(() => {
        expect(mockHandleSortChange).toHaveBeenCalledWith('title');
      });
    });

    it('should handle filter reset', async () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');
      const mockResetFilters = vi.fn();

      useTodos.mockReturnValue({
        todos: mockTodos,
        pagination: mockPagination,
        isLoading: false,
        error: null,
      });

      useTodoFilters.mockReturnValue({
        search: 'current search',
        sortBy: 'title',
        sortOrder: 'asc',
        handleSearchChange: vi.fn(),
        handleSortChange: vi.fn(),
        resetFilters: mockResetFilters,
      });

      render(<TodoList />);

      // Act
      const resetButton = screen.getByText('todo.resetFilters');
      fireEvent.click(resetButton);

      // Assert
      expect(mockResetFilters).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should render pagination when there are multiple pages', () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');

      useTodos.mockReturnValue({
        todos: mockTodos,
        pagination: { page: 1, limit: 10, total: 25, hasMore: true },
        isLoading: false,
        error: null,
      });

      useTodoFilters.mockReturnValue({
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        handleSearchChange: vi.fn(),
        handleSortChange: vi.fn(),
        resetFilters: vi.fn(),
      });

      // Act
      render(<TodoList />);

      // Assert
      expect(screen.getByText('pagination.page')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should not render pagination when all items fit on one page', () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');

      useTodos.mockReturnValue({
        todos: mockTodos,
        pagination: { page: 1, limit: 10, total: 2, hasMore: false },
        isLoading: false,
        error: null,
      });

      useTodoFilters.mockReturnValue({
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        handleSearchChange: vi.fn(),
        handleSortChange: vi.fn(),
        resetFilters: vi.fn(),
      });

      // Act
      render(<TodoList />);

      // Assert
      expect(screen.queryByText('pagination.page')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');

      useTodos.mockReturnValue({
        todos: mockTodos,
        pagination: mockPagination,
        isLoading: false,
        error: null,
      });

      useTodoFilters.mockReturnValue({
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        handleSearchChange: vi.fn(),
        handleSortChange: vi.fn(),
        resetFilters: vi.fn(),
      });

      // Act
      render(<TodoList />);

      // Assert
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      // Arrange
      const { useTodos } = require('@/hooks/useTodos');
      const { useTodoFilters } = require('@/hooks/useTodoFilters');

      useTodos.mockReturnValue({
        todos: mockTodos,
        pagination: mockPagination,
        isLoading: false,
        error: null,
      });

      useTodoFilters.mockReturnValue({
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        handleSearchChange: vi.fn(),
        handleSortChange: vi.fn(),
        resetFilters: vi.fn(),
      });

      render(<TodoList />);

      // Act
      const searchInput = screen.getByRole('searchbox');
      searchInput.focus();

      // Assert
      expect(searchInput).toHaveFocus();
    });
  });
});
