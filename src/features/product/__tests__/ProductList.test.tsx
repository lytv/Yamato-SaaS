/**
 * ProductList Component Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing data display, pagination, sorting, actions, and loading states
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductList } from '../ProductList';
import { useProducts } from '@/hooks/useProducts';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useProductMutations } from '@/hooks/useProductMutations';
import type { Product, ProductFilters } from '@/types/product';

// Mock hooks
vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
}));

vi.mock('@/hooks/useProductFilters', () => ({
  useProductFilters: vi.fn(),
}));

vi.mock('@/hooks/useProductMutations', () => ({
  useProductMutations: vi.fn(),
}));

const mockUseProducts = vi.mocked(useProducts);
const mockUseProductFilters = vi.mocked(useProductFilters);
const mockUseProductMutations = vi.mocked(useProductMutations);

describe('ProductList Component', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockRefresh = vi.fn();
  const mockDeleteProduct = vi.fn();
  const mockHandleSearchChange = vi.fn();
  const mockHandleSortChange = vi.fn();
  const mockHandleSortOrderChange = vi.fn();
  const mockResetFilters = vi.fn();

  const mockProducts: Product[] = [
    {
      id: 1,
      ownerId: 'user_123',
      productCode: 'PROD-001',
      productName: 'Product 1',
      category: 'Electronics',
      notes: 'Product 1 notes',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      ownerId: 'user_123',
      productCode: 'PROD-002',
      productName: 'Product 2',
      category: 'Software',
      notes: 'Product 2 notes',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 10,
    total: 2,
    hasMore: false,
  };

  const mockFilters: ProductFilters = {
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseProducts.mockReturnValue({
      products: mockProducts,
      pagination: mockPagination,
      isLoading: false,
      error: null,
      refresh: mockRefresh,
    });

    mockUseProductFilters.mockReturnValue({
      ...mockFilters,
      handleSearchChange: mockHandleSearchChange,
      handleSortChange: mockHandleSortChange,
      handleSortOrderChange: mockHandleSortOrderChange,
      resetFilters: mockResetFilters,
    });

    mockUseProductMutations.mockReturnValue({
      createProduct: vi.fn(),
      updateProduct: vi.fn(),
      deleteProduct: mockDeleteProduct,
      clearError: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
    });
  });

  describe('Data Display', () => {
    it('should render product list with all products', () => {
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('PROD-001')).toBeInTheDocument();
      expect(screen.getByText('PROD-002')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Software')).toBeInTheDocument();
    });

    it('should render empty state when no products', () => {
      mockUseProducts.mockReturnValue({
        products: [],
        pagination: { page: 1, limit: 10, total: 0, hasMore: false },
        isLoading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first product/i)).toBeInTheDocument();
    });

    it('should render product count information', () => {
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText(/showing 2 of 2 products/i)).toBeInTheDocument();
    });

    it('should render created and updated dates', () => {
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Should format dates properly
      expect(screen.getByText(/jan 1, 2023/i)).toBeInTheDocument();
      expect(screen.getByText(/jan 2, 2023/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const searchInput = screen.getByPlaceholderText(/search products/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should call handleSearchChange when search input changes', async () => {
      const user = userEvent.setup();
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const searchInput = screen.getByPlaceholderText(/search products/i);
      await user.type(searchInput, 'test search');

      expect(mockHandleSearchChange).toHaveBeenCalledWith('test search');
    });

    it('should show search results count', () => {
      mockUseProductFilters.mockReturnValue({
        ...mockFilters,
        search: 'Product 1',
        handleSearchChange: mockHandleSearchChange,
        handleSortChange: mockHandleSortChange,
        handleSortOrderChange: mockHandleSortOrderChange,
        resetFilters: mockResetFilters,
      });

      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText(/search results for "Product 1"/i)).toBeInTheDocument();
    });

    it('should show clear search button when searching', async () => {
      const user = userEvent.setup();
      mockUseProductFilters.mockReturnValue({
        ...mockFilters,
        search: 'test',
        handleSearchChange: mockHandleSearchChange,
        handleSortChange: mockHandleSortChange,
        handleSortOrderChange: mockHandleSortOrderChange,
        resetFilters: mockResetFilters,
      });

      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      expect(mockResetFilters).toHaveBeenCalled();
    });
  });

  describe('Sorting Functionality', () => {
    it('should render sort controls', () => {
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sort order/i })).toBeInTheDocument();
    });

    it('should call handleSortChange when sort field changes', async () => {
      const user = userEvent.setup();
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      await user.selectOptions(sortSelect, 'productName');

      expect(mockHandleSortChange).toHaveBeenCalledWith('productName');
    });

    it('should call handleSortOrderChange when sort order changes', async () => {
      const user = userEvent.setup();
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const sortOrderButton = screen.getByRole('button', { name: /sort order/i });
      await user.click(sortOrderButton);

      expect(mockHandleSortOrderChange).toHaveBeenCalledWith('asc');
    });

    it('should show correct sort order icon', () => {
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Should show descending icon for desc order
      expect(screen.getByRole('button', { name: /sort order/i })).toHaveTextContent('↓');
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls when hasMore is true', () => {
      mockUseProducts.mockReturnValue({
        products: mockProducts,
        pagination: { ...mockPagination, hasMore: true },
        isLoading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
    });

    it('should not render load more button when hasMore is false', () => {
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });

    it('should show page information', () => {
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText(/page 1/i)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should render edit and delete buttons for each product', () => {
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons[0]).toBeDefined();
      await user.click(editButtons[0]!);

      expect(mockOnEdit).toHaveBeenCalledWith(mockProducts[0]);
    });

    it('should show delete confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons[0]).toBeDefined();
      await user.click(deleteButtons[0]!);

      expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should delete product when confirmed', async () => {
      const user = userEvent.setup();
      mockDeleteProduct.mockResolvedValue(undefined);
      
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteProduct).toHaveBeenCalledWith(1);
        expect(mockOnDelete).toHaveBeenCalledWith(mockProducts[0]);
      });
    });

    it('should cancel delete when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText(/confirm deletion/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton when isLoading is true', () => {
      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: true,
        error: null,
        refresh: mockRefresh,
      });

      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByTestId('product-list-skeleton')).toBeInTheDocument();
    });

    it('should disable actions when deleting', () => {
      mockUseProductMutations.mockReturnValue({
        createProduct: vi.fn(),
        updateProduct: vi.fn(),
        deleteProduct: mockDeleteProduct,
        clearError: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: true,
        error: null,
      });

      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

      editButtons.forEach(button => expect(button).toBeDisabled());
      deleteButtons.forEach(button => expect(button).toBeDisabled());
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error occurs', () => {
      const errorMessage = 'Failed to load products';
      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: false,
        error: errorMessage,
        refresh: mockRefresh,
      });

      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call refresh when retry button is clicked', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: false,
        error: 'Failed to load products',
        refresh: mockRefresh,
      });

      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to delete product';
      mockDeleteProduct.mockRejectedValue(new Error(errorMessage));

      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /search products/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const searchInput = screen.getByRole('textbox', { name: /search products/i });
      await user.tab();
      
      expect(searchInput).toHaveFocus();
    });

    it('should announce loading state to screen readers', () => {
      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: true,
        error: null,
        refresh: mockRefresh,
      });

      render(<ProductList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByRole('status', { name: /loading products/i })).toBeInTheDocument();
    });
  });
}); 