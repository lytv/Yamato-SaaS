/**
 * Products Dashboard Page Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing page layout, modal functionality, CRUD operations, and user interactions
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProductsPage from '@/app/[locale]/(auth)/dashboard/products/page';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useProductMutations } from '@/hooks/useProductMutations';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/product';

// Mock hooks
vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
}));

vi.mock('@/hooks/useProductMutations', () => ({
  useProductMutations: vi.fn(),
}));

vi.mock('@/hooks/useProductFilters', () => ({
  useProductFilters: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, options?: { default?: string }) =>
    options?.default || key,
}));

// Mock Clerk useAuth
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    userId: 'user_123',
    orgId: 'org_456',
    isLoaded: true,
    isSignedIn: true,
  })),
}));

const mockUseProducts = vi.mocked(useProducts);
const mockUseProductMutations = vi.mocked(useProductMutations);
const mockUseProductFilters = vi.mocked(useProductFilters);

describe('Products Dashboard Page', () => {
  const mockProducts: Product[] = [
    {
      id: 1,
      ownerId: 'user_123',
      productCode: 'PROD-001',
      productName: 'Test Product 1',
      category: 'Electronics',
      notes: 'Test notes 1',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      ownerId: 'user_123',
      productCode: 'PROD-002',
      productName: 'Test Product 2',
      category: 'Software',
      notes: 'Test notes 2',
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

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseProducts.mockReturnValue({
      products: mockProducts,
      pagination: mockPagination,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    mockUseProductMutations.mockReturnValue({
      createProduct: vi.fn(),
      updateProduct: vi.fn(),
      deleteProduct: vi.fn(),
      clearError: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
    });

    mockUseProductFilters.mockReturnValue({
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      handleSearchChange: vi.fn(),
      handleSortChange: vi.fn(),
      handleSortOrderChange: vi.fn(),
      resetFilters: vi.fn(),
    });
  });

  describe('Page Layout', () => {
    it('should render page title and description', () => {
      render(<ProductsPage />);

      expect(screen.getByRole('heading', { name: /products/i })).toBeInTheDocument();
      expect(screen.getByText(/manage your products/i)).toBeInTheDocument();
    });

    it('should render create product button', () => {
      render(<ProductsPage />);

      expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
    });

    it('should render product list', () => {
      render(<ProductsPage />);

      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('PROD-001')).toBeInTheDocument();
      expect(screen.getByText('PROD-002')).toBeInTheDocument();
    });

    it('should have proper page structure', () => {
      render(<ProductsPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('products-header')).toBeInTheDocument();
      expect(screen.getByTestId('products-content')).toBeInTheDocument();
    });
  });

  describe('Create Product Modal', () => {
    it('should open create modal when create button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProductsPage />);

      const createButton = screen.getByRole('button', { name: /create product/i });
      await user.click(createButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /create product/i })).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProductsPage />);

      // Open modal
      const createButton = screen.getByRole('button', { name: /create product/i });
      await user.click(createButton);

      // Close modal
      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should close modal when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<ProductsPage />);

      // Open modal
      const createButton = screen.getByRole('button', { name: /create product/i });
      await user.click(createButton);

      // Click backdrop
      const backdrop = screen.getByTestId('modal-backdrop');
      await user.click(backdrop);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render product form in create mode', async () => {
      const user = userEvent.setup();
      render(<ProductsPage />);

      const createButton = screen.getByRole('button', { name: /create product/i });
      await user.click(createButton);

      expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
    });
  });

  describe('Edit Product Modal', () => {
    it('should open edit modal when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProductsPage />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /edit product/i })).toBeInTheDocument();
    });

    it('should render product form in edit mode with existing data', async () => {
      const user = userEvent.setup();
      render(<ProductsPage />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByDisplayValue('PROD-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Product 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update product/i })).toBeInTheDocument();
    });

    it('should close edit modal after successful update', async () => {
      const user = userEvent.setup();
      const mockUpdateProduct = vi.fn().mockResolvedValue(mockProducts[0]);

      mockUseProductMutations.mockReturnValue({
        createProduct: vi.fn(),
        updateProduct: mockUpdateProduct,
        deleteProduct: vi.fn(),
        clearError: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: null,
      });

      render(<ProductsPage />);

      // Open edit modal
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update product/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Product List Integration', () => {
    it('should refresh product list after successful create', async () => {
      const user = userEvent.setup();
      const mockRefresh = vi.fn();
      const mockCreateProduct = vi.fn().mockResolvedValue(mockProducts[0]);

      mockUseProducts.mockReturnValue({
        products: mockProducts,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refresh: mockRefresh,
      });

      mockUseProductMutations.mockReturnValue({
        createProduct: mockCreateProduct,
        updateProduct: vi.fn(),
        deleteProduct: vi.fn(),
        clearError: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: null,
      });

      render(<ProductsPage />);

      // Open create modal
      const createButton = screen.getByRole('button', { name: /create product/i });
      await user.click(createButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should refresh product list after successful delete', async () => {
      const user = userEvent.setup();
      const mockRefresh = vi.fn();
      const mockDeleteProduct = vi.fn().mockResolvedValue(undefined);

      mockUseProducts.mockReturnValue({
        products: mockProducts,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refresh: mockRefresh,
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

      render(<ProductsPage />);

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Confirm delete
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when products are loading', () => {
      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      });

      render(<ProductsPage />);

      expect(screen.getByTestId('product-list-skeleton')).toBeInTheDocument();
    });

    it('should disable create button when creating', () => {
      mockUseProductMutations.mockReturnValue({
        createProduct: vi.fn(),
        updateProduct: vi.fn(),
        deleteProduct: vi.fn(),
        clearError: vi.fn(),
        isCreating: true,
        isUpdating: false,
        isDeleting: false,
        error: null,
      });

      render(<ProductsPage />);

      const createButton = screen.getByRole('button', { name: /create product/i });

      expect(createButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when products fail to load', () => {
      const errorMessage = 'Failed to load products';
      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: false,
        error: errorMessage,
        refresh: vi.fn(),
      });

      render(<ProductsPage />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle form submission errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Product code already exists';

      mockUseProductMutations.mockReturnValue({
        createProduct: vi.fn(),
        updateProduct: vi.fn(),
        deleteProduct: vi.fn(),
        clearError: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: errorMessage,
      });

      render(<ProductsPage />);

      // Open create modal
      const createButton = screen.getByRole('button', { name: /create product/i });
      await user.click(createButton);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<ProductsPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ProductsPage />);

      // Tab to create button
      await user.tab();

      expect(screen.getByRole('button', { name: /create product/i })).toHaveFocus();

      // Enter to open modal
      await user.keyboard('{Enter}');

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Escape to close modal
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should trap focus in modal', async () => {
      const user = userEvent.setup();
      render(<ProductsPage />);

      // Open modal
      const createButton = screen.getByRole('button', { name: /create product/i });
      await user.click(createButton);

      // Focus should be trapped in modal
      const modal = screen.getByRole('dialog');

      expect(modal).toBeInTheDocument();

      // First focusable element should be focused
      const firstInput = screen.getByLabelText(/product code/i);

      expect(firstInput).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile-friendly layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ProductsPage />);

      expect(screen.getByTestId('products-mobile-layout')).toBeInTheDocument();
    });

    it('should render desktop layout on larger screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<ProductsPage />);

      expect(screen.getByTestId('products-desktop-layout')).toBeInTheDocument();
    });
  });
});
