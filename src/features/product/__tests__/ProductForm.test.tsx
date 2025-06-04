/**
 * ProductForm Component Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing form validation, submission, editing modes, and error handling
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductForm } from '../ProductForm';
import { useProductMutations } from '@/hooks/useProductMutations';
import type { Product } from '@/types/product';

// Mock hooks
vi.mock('@/hooks/useProductMutations', () => ({
  useProductMutations: vi.fn(),
}));

const mockUseProductMutations = vi.mocked(useProductMutations);

describe('ProductForm Component', () => {
  const mockCreateProduct = vi.fn();
  const mockUpdateProduct = vi.fn();
  const mockDeleteProduct = vi.fn();
  const mockClearError = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const mockProduct: Product = {
    id: 1,
    ownerId: 'user_123',
    productCode: 'PROD-001',
    productName: 'Test Product',
    category: 'Electronics',
    notes: 'Test notes',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProductMutations.mockReturnValue({
      createProduct: mockCreateProduct,
      updateProduct: mockUpdateProduct,
      deleteProduct: mockDeleteProduct,
      clearError: mockClearError,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
    });
  });

  describe('Create Mode', () => {
    it('should render form fields for creating new product', () => {
      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup();
      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/product code is required/i)).toBeInTheDocument();
        expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate product code format', async () => {
      const user = userEvent.setup();
      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const productCodeInput = screen.getByLabelText(/product code/i);
      await user.type(productCodeInput, 'invalid code!@#');

      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/product code can only contain/i)).toBeInTheDocument();
      });
    });

    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      mockCreateProduct.mockResolvedValue(mockProduct);

      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // Fill out form
      await user.type(screen.getByLabelText(/product code/i), 'PROD-001');
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');
      await user.type(screen.getByLabelText(/category/i), 'Electronics');
      await user.type(screen.getByLabelText(/notes/i), 'Test notes');

      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateProduct).toHaveBeenCalledWith({
          productCode: 'PROD-001',
          productName: 'Test Product',
          category: 'Electronics',
          notes: 'Test notes',
        });
        expect(mockOnSuccess).toHaveBeenCalledWith(mockProduct);
      });
    });

    it('should handle creation errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Product code already exists';
      mockCreateProduct.mockRejectedValue(new Error(errorMessage));

      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // Fill out form
      await user.type(screen.getByLabelText(/product code/i), 'PROD-001');
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');

      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should render form fields with existing product data', () => {
      render(
        <ProductForm 
          product={mockProduct}
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByDisplayValue('PROD-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Electronics')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update product/i })).toBeInTheDocument();
    });

    it('should submit update data', async () => {
      const user = userEvent.setup();
      const updatedProduct = { ...mockProduct, productName: 'Updated Product' };
      mockUpdateProduct.mockResolvedValue(updatedProduct);

      render(
        <ProductForm 
          product={mockProduct}
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      );

      // Update product name
      const productNameInput = screen.getByDisplayValue('Test Product');
      await user.clear(productNameInput);
      await user.type(productNameInput, 'Updated Product');

      const submitButton = screen.getByRole('button', { name: /update product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProduct).toHaveBeenCalledWith(1, {
          productCode: 'PROD-001',
          productName: 'Updated Product',
          category: 'Electronics',
          notes: 'Test notes',
        });
        expect(mockOnSuccess).toHaveBeenCalledWith(updatedProduct);
      });
    });

    it('should handle update errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Product not found';
      mockUpdateProduct.mockRejectedValue(new Error(errorMessage));

      render(
        <ProductForm 
          product={mockProduct}
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      );

      const submitButton = screen.getByRole('button', { name: /update product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when creating', () => {
      mockUseProductMutations.mockReturnValue({
        createProduct: mockCreateProduct,
        updateProduct: mockUpdateProduct,
        deleteProduct: mockDeleteProduct,
        clearError: mockClearError,
        isCreating: true,
        isUpdating: false,
        isDeleting: false,
        error: null,
      });

      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /creating/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state when updating', () => {
      mockUseProductMutations.mockReturnValue({
        createProduct: mockCreateProduct,
        updateProduct: mockUpdateProduct,
        deleteProduct: mockDeleteProduct,
        clearError: mockClearError,
        isCreating: false,
        isUpdating: true,
        isDeleting: false,
        error: null,
      });

      render(
        <ProductForm 
          product={mockProduct}
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      );

      const submitButton = screen.getByRole('button', { name: /updating/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display mutation errors', () => {
      const errorMessage = 'Network error';
      mockUseProductMutations.mockReturnValue({
        createProduct: mockCreateProduct,
        updateProduct: mockUpdateProduct,
        deleteProduct: mockDeleteProduct,
        clearError: mockClearError,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: errorMessage,
      });

      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should clear errors when form is modified', async () => {
      const user = userEvent.setup();
      mockUseProductMutations.mockReturnValue({
        createProduct: mockCreateProduct,
        updateProduct: mockUpdateProduct,
        deleteProduct: mockDeleteProduct,
        clearError: mockClearError,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: 'Previous error',
      });

      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const productCodeInput = screen.getByLabelText(/product code/i);
      await user.type(productCodeInput, 'PROD-001');

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should reset form when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // Fill out form
      await user.type(screen.getByLabelText(/product code/i), 'PROD-001');
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      expect(screen.getByLabelText(/product code/i)).toHaveValue('');
      expect(screen.getByLabelText(/product name/i)).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and aria attributes', () => {
      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const productCodeInput = screen.getByLabelText(/product code/i);
      const productNameInput = screen.getByLabelText(/product name/i);

      expect(productCodeInput).toHaveAttribute('aria-required', 'true');
      expect(productNameInput).toHaveAttribute('aria-required', 'true');
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      render(
        <ProductForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        const productCodeInput = screen.getByLabelText(/product code/i);
        const errorMessage = screen.getByText(/product code is required/i);
        
        expect(productCodeInput).toHaveAttribute('aria-describedby');
        expect(errorMessage).toHaveAttribute('id');
      });
    });
  });
}); 