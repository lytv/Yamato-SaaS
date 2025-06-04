/**
 * useProductFilters Hook Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing product filtering and search state management
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useProductFilters } from '@/hooks/useProductFilters';

describe('useProductFilters Hook', () => {
  beforeEach(() => {
    // No mocks needed for this hook
  });

  describe('Initial State', () => {
    it('should return default filter state', () => {
      // Act
      const { result } = renderHook(() => useProductFilters());

      // Assert
      expect(result.current.search).toBe('');
      expect(result.current.sortBy).toBe('createdAt');
      expect(result.current.sortOrder).toBe('desc');
    });

    it('should accept initial filters', () => {
      // Arrange
      const initialFilters = {
        search: 'electronics',
        sortBy: 'productName' as const,
        sortOrder: 'asc' as const,
      };

      // Act
      const { result } = renderHook(() => useProductFilters(initialFilters));

      // Assert
      expect(result.current.search).toBe('electronics');
      expect(result.current.sortBy).toBe('productName');
      expect(result.current.sortOrder).toBe('asc');
    });

    it('should merge with defaults for partial initial filters', () => {
      // Arrange
      const initialFilters = {
        search: 'test',
      };

      // Act
      const { result } = renderHook(() => useProductFilters(initialFilters));

      // Assert
      expect(result.current.search).toBe('test');
      expect(result.current.sortBy).toBe('createdAt'); // Default
      expect(result.current.sortOrder).toBe('desc'); // Default
    });
  });

  describe('Search Handling', () => {
    it('should update search filter', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters());

      // Act
      act(() => {
        result.current.handleSearchChange('electronics');
      });

      // Assert
      expect(result.current.search).toBe('electronics');
      expect(result.current.sortBy).toBe('createdAt'); // Should remain unchanged
      expect(result.current.sortOrder).toBe('desc'); // Should remain unchanged
    });

    it('should handle empty search', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters({
        search: 'initial search',
      }));

      // Act
      act(() => {
        result.current.handleSearchChange('');
      });

      // Assert
      expect(result.current.search).toBe('');
    });

    it('should handle multiple search changes', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters());

      // Act
      act(() => {
        result.current.handleSearchChange('first');
      });

      act(() => {
        result.current.handleSearchChange('second');
      });

      act(() => {
        result.current.handleSearchChange('third');
      });

      // Assert
      expect(result.current.search).toBe('third');
    });
  });

  describe('Sort Handling', () => {
    it('should update sort by filter', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters());

      // Act
      act(() => {
        result.current.handleSortChange('productName');
      });

      // Assert
      expect(result.current.sortBy).toBe('productName');
      expect(result.current.search).toBe(''); // Should remain unchanged
      expect(result.current.sortOrder).toBe('desc'); // Should remain unchanged
    });

    it('should update sort order filter', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters());

      // Act
      act(() => {
        result.current.handleSortOrderChange('asc');
      });

      // Assert
      expect(result.current.sortOrder).toBe('asc');
      expect(result.current.search).toBe(''); // Should remain unchanged
      expect(result.current.sortBy).toBe('createdAt'); // Should remain unchanged
    });

    it('should handle all sort by options', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters());
      const sortOptions = ['createdAt', 'updatedAt', 'productName', 'productCode'] as const;

      // Act & Assert
      sortOptions.forEach((sortBy) => {
        act(() => {
          result.current.handleSortChange(sortBy);
        });

        expect(result.current.sortBy).toBe(sortBy);
      });
    });

    it('should handle both sort order options', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters());

      // Act & Assert
      act(() => {
        result.current.handleSortOrderChange('asc');
      });

      expect(result.current.sortOrder).toBe('asc');

      act(() => {
        result.current.handleSortOrderChange('desc');
      });

      expect(result.current.sortOrder).toBe('desc');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all filters to defaults', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters({
        search: 'electronics',
        sortBy: 'productName',
        sortOrder: 'asc',
      }));

      // Verify initial state
      expect(result.current.search).toBe('electronics');
      expect(result.current.sortBy).toBe('productName');
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

    it('should reset from modified state', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters());

      // Modify state
      act(() => {
        result.current.handleSearchChange('test search');
        result.current.handleSortChange('productCode');
        result.current.handleSortOrderChange('asc');
      });

      // Verify modified state
      expect(result.current.search).toBe('test search');
      expect(result.current.sortBy).toBe('productCode');
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

  describe('Function References', () => {
    it('should maintain stable function references', () => {
      // Arrange
      const { result, rerender } = renderHook(() => useProductFilters());

      const initialHandlers = {
        handleSearchChange: result.current.handleSearchChange,
        handleSortChange: result.current.handleSortChange,
        handleSortOrderChange: result.current.handleSortOrderChange,
        resetFilters: result.current.resetFilters,
      };

      // Act
      rerender();

      // Assert - Functions should be the same reference
      expect(result.current.handleSearchChange).toBe(initialHandlers.handleSearchChange);
      expect(result.current.handleSortChange).toBe(initialHandlers.handleSortChange);
      expect(result.current.handleSortOrderChange).toBe(initialHandlers.handleSortOrderChange);
      expect(result.current.resetFilters).toBe(initialHandlers.resetFilters);
    });

    it('should maintain stable references after state changes', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters());

      const initialHandlers = {
        handleSearchChange: result.current.handleSearchChange,
        handleSortChange: result.current.handleSortChange,
        handleSortOrderChange: result.current.handleSortOrderChange,
        resetFilters: result.current.resetFilters,
      };

      // Act - Change state
      act(() => {
        result.current.handleSearchChange('new search');
      });

      // Assert - Functions should still be the same reference
      expect(result.current.handleSearchChange).toBe(initialHandlers.handleSearchChange);
      expect(result.current.handleSortChange).toBe(initialHandlers.handleSortChange);
      expect(result.current.handleSortOrderChange).toBe(initialHandlers.handleSortOrderChange);
      expect(result.current.resetFilters).toBe(initialHandlers.resetFilters);
    });
  });

  describe('Complex Filter Combinations', () => {
    it('should handle multiple filter changes in sequence', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters());

      // Act
      act(() => {
        result.current.handleSearchChange('electronics');
      });

      act(() => {
        result.current.handleSortChange('productName');
      });

      act(() => {
        result.current.handleSortOrderChange('asc');
      });

      // Assert
      expect(result.current.search).toBe('electronics');
      expect(result.current.sortBy).toBe('productName');
      expect(result.current.sortOrder).toBe('asc');
    });

    it('should handle interleaved filter changes', () => {
      // Arrange
      const { result } = renderHook(() => useProductFilters());

      // Act
      act(() => {
        result.current.handleSearchChange('test');
        result.current.handleSortChange('productCode');
        result.current.handleSearchChange('updated test');
        result.current.handleSortOrderChange('asc');
        result.current.handleSortChange('updatedAt');
      });

      // Assert
      expect(result.current.search).toBe('updated test');
      expect(result.current.sortBy).toBe('updatedAt');
      expect(result.current.sortOrder).toBe('asc');
    });
  });
});
