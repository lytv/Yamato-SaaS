/**
 * useTodoFilters Hook Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing todo filtering and search state management
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useTodoFilters } from '@/hooks/useTodoFilters';

describe('useTodoFilters Hook', () => {
  describe('Initial State', () => {
    it('should return default filter state', () => {
      // Act
      const { result } = renderHook(() => useTodoFilters());

      // Assert
      expect(result.current.search).toBe('');
      expect(result.current.sortBy).toBe('createdAt');
      expect(result.current.sortOrder).toBe('desc');
    });

    it('should accept initial filters', () => {
      // Arrange
      const initialFilters = {
        search: 'test',
        sortBy: 'title' as const,
        sortOrder: 'asc' as const,
      };

      // Act
      const { result } = renderHook(() => useTodoFilters(initialFilters));

      // Assert
      expect(result.current.search).toBe('test');
      expect(result.current.sortBy).toBe('title');
      expect(result.current.sortOrder).toBe('asc');
    });
  });

  describe('Search Handling', () => {
    it('should update search value', () => {
      // Arrange
      const { result } = renderHook(() => useTodoFilters());

      // Act
      act(() => {
        result.current.handleSearchChange('new search');
      });

      // Assert
      expect(result.current.search).toBe('new search');
    });

    it('should clear search value', () => {
      // Arrange
      const { result } = renderHook(() => useTodoFilters({ search: 'initial' }));

      // Act
      act(() => {
        result.current.handleSearchChange('');
      });

      // Assert
      expect(result.current.search).toBe('');
    });
  });

  describe('Sort Handling', () => {
    it('should update sort by value', () => {
      // Arrange
      const { result } = renderHook(() => useTodoFilters());

      // Act
      act(() => {
        result.current.handleSortChange('title');
      });

      // Assert
      expect(result.current.sortBy).toBe('title');
    });

    it('should update sort order value', () => {
      // Arrange
      const { result } = renderHook(() => useTodoFilters());

      // Act
      act(() => {
        result.current.handleSortOrderChange('asc');
      });

      // Assert
      expect(result.current.sortOrder).toBe('asc');
    });
  });

  describe('Reset Filters', () => {
    it('should reset all filters to default values', () => {
      // Arrange
      const { result } = renderHook(() => useTodoFilters({
        search: 'test search',
        sortBy: 'title',
        sortOrder: 'asc',
      }));

      // Verify initial state
      expect(result.current.search).toBe('test search');
      expect(result.current.sortBy).toBe('title');
      expect(result.current.sortOrder).toBe('asc');

      // Act
      act(() => {
        result.current.resetFilters();
      });

      // Assert
      expect(result.current.search).toBe('');
      expect(result.current.sortBy).toBe('createdAt');
      expect(result.current.sortOrder).toBe('desc');
    });
  });

  describe('Function Stability', () => {
    it('should maintain function references across re-renders', () => {
      // Arrange
      const { result, rerender } = renderHook(() => useTodoFilters());
      const initialHandlers = {
        handleSearchChange: result.current.handleSearchChange,
        handleSortChange: result.current.handleSortChange,
        handleSortOrderChange: result.current.handleSortOrderChange,
        resetFilters: result.current.resetFilters,
      };

      // Act
      rerender();

      // Assert
      expect(result.current.handleSearchChange).toBe(initialHandlers.handleSearchChange);
      expect(result.current.handleSortChange).toBe(initialHandlers.handleSortChange);
      expect(result.current.handleSortOrderChange).toBe(initialHandlers.handleSortOrderChange);
      expect(result.current.resetFilters).toBe(initialHandlers.resetFilters);
    });
  });
});
