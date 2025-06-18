/**
 * @file Multi-assign page tests - TDD for Bulk Add Production Step Details
 * Tests for the bulk assignment functionality with proper auth integration
 */

import { useAuth } from '@clerk/nextjs';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { useProductionSteps } from '@/hooks/useProductionSteps';
import { useProducts } from '@/hooks/useProducts';

import MultiAssignPage from '../page';

// Mock the hooks
vi.mock('@clerk/nextjs');
vi.mock('@/hooks/useProducts');
vi.mock('@/hooks/useProductionSteps');

// Mock the feature components
vi.mock('@/features/productionStep/ProductMultiSelect', () => ({
  ProductMultiSelect: vi.fn(() => <div data-testid="product-multi-select">Product Multi Select</div>),
}));

vi.mock('@/features/productionStep/StepMultiSelect', () => ({
  StepMultiSelect: vi.fn(() => <div data-testid="step-multi-select">Step Multi Select</div>),
}));

vi.mock('@/features/productionStep/MultiAssignConfigForm', () => ({
  MultiAssignConfigForm: vi.fn(() => <div data-testid="multi-assign-config-form">Config Form</div>),
}));

vi.mock('@/features/productionStep/MultiAssignPreview', () => ({
  MultiAssignPreview: vi.fn(() => <div data-testid="multi-assign-preview">Preview</div>),
}));

vi.mock('@/features/productionStep/MultiAssignProgress', () => ({
  MultiAssignProgress: vi.fn(() => <div data-testid="multi-assign-progress">Progress</div>),
}));

describe('MultiAssignPage', () => {
  const mockUseAuth = vi.mocked(useAuth);
  const mockUseProducts = vi.mocked(useProducts);
  const mockUseProductionSteps = vi.mocked(useProductionSteps);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup
    mockUseAuth.mockReturnValue({
      userId: 'user_123',
      orgId: 'org_456',
      isLoaded: true,
      isSignedIn: true,
    } as any);
  });

  describe('Data Loading with Authentication', () => {
    it('should pass ownerId to useProducts hook when orgId is available', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
        isLoaded: true,
        isSignedIn: true,
      } as any);

      mockUseProducts.mockReturnValue({
        products: [
          { id: 1, ownerId: 'org_456', productCode: 'PROD-001', productName: 'Product 1', category: 'Electronics', notes: '', createdAt: new Date(), updatedAt: new Date() },
        ],
        pagination: { page: 1, limit: 10, total: 1, hasMore: false },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      mockUseProductionSteps.mockReturnValue({
        productionSteps: [
          { id: 1, ownerId: 'org_456', stepCode: 'STEP-001', stepName: 'Step 1', stepGroup: 'Group A', notes: '', createdAt: new Date(), updatedAt: new Date() },
        ],
        pagination: { page: 1, limit: 10, total: 1, hasMore: false },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<MultiAssignPage />);

      // Assert
      await waitFor(() => {
        expect(mockUseProducts).toHaveBeenCalledWith({
          page: 1,
          search: '',
          ownerId: 'org_456', // Should prefer orgId over userId
        });

        expect(mockUseProductionSteps).toHaveBeenCalledWith({
          page: 1,
          search: '',
          ownerId: 'org_456', // Should prefer orgId over userId
        });
      });
    });

    it('should fallback to userId when orgId is not available', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        userId: 'user_123',
        orgId: null,
        isLoaded: true,
        isSignedIn: true,
      } as any);

      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      mockUseProductionSteps.mockReturnValue({
        productionSteps: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<MultiAssignPage />);

      // Assert
      await waitFor(() => {
        expect(mockUseProducts).toHaveBeenCalledWith({
          page: 1,
          search: '',
          ownerId: 'user_123', // Should use userId when orgId is null
        });

        expect(mockUseProductionSteps).toHaveBeenCalledWith({
          page: 1,
          search: '',
          ownerId: 'user_123', // Should use userId when orgId is null
        });
      });
    });

    it('should not load data when no authentication is available', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        userId: null,
        orgId: null,
        isLoaded: true,
        isSignedIn: false,
      } as any);

      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      mockUseProductionSteps.mockReturnValue({
        productionSteps: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<MultiAssignPage />);

      // Assert
      await waitFor(() => {
        expect(mockUseProducts).toHaveBeenCalledWith({
          page: 1,
          search: '',
          ownerId: '', // Should be empty string when no auth
        });

        expect(mockUseProductionSteps).toHaveBeenCalledWith({
          page: 1,
          search: '',
          ownerId: '', // Should be empty string when no auth
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state for products', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
        isLoaded: true,
        isSignedIn: true,
      } as any);

      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      });

      mockUseProductionSteps.mockReturnValue({
        productionSteps: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<MultiAssignPage />);

      // Assert
      expect(screen.getByText('Đang tải sản phẩm...')).toBeInTheDocument();
    });

    it('should show loading state for production steps', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
        isLoaded: true,
        isSignedIn: true,
      } as any);

      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      mockUseProductionSteps.mockReturnValue({
        productionSteps: [],
        pagination: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<MultiAssignPage />);

      // Assert
      expect(screen.getByText('Đang tải công đoạn...')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no products available', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
        isLoaded: true,
        isSignedIn: true,
      } as any);

      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      mockUseProductionSteps.mockReturnValue({
        productionSteps: [
          { id: 1, ownerId: 'org_456', stepCode: 'STEP-001', stepName: 'Step 1', stepGroup: 'Group A', notes: '', createdAt: new Date(), updatedAt: new Date() },
        ],
        pagination: { page: 1, limit: 10, total: 1, hasMore: false },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<MultiAssignPage />);

      // Assert
      expect(screen.getByText('Không có sản phẩm')).toBeInTheDocument();
    });

    it('should show empty state when no production steps available', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
        isLoaded: true,
        isSignedIn: true,
      } as any);

      mockUseProducts.mockReturnValue({
        products: [
          { id: 1, ownerId: 'org_456', productCode: 'PROD-001', productName: 'Product 1', category: 'Electronics', notes: '', createdAt: new Date(), updatedAt: new Date() },
        ],
        pagination: { page: 1, limit: 10, total: 1, hasMore: false },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      mockUseProductionSteps.mockReturnValue({
        productionSteps: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<MultiAssignPage />);

      // Assert
      expect(screen.getByText('Không có công đoạn')).toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    it('should render product and step selection components when data is loaded', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
        isLoaded: true,
        isSignedIn: true,
      } as any);

      mockUseProducts.mockReturnValue({
        products: [
          { id: 1, ownerId: 'org_456', productCode: 'PROD-001', productName: 'Product 1', category: 'Electronics', notes: '', createdAt: new Date(), updatedAt: new Date() },
        ],
        pagination: { page: 1, limit: 10, total: 1, hasMore: false },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      mockUseProductionSteps.mockReturnValue({
        productionSteps: [
          { id: 1, ownerId: 'org_456', stepCode: 'STEP-001', stepName: 'Step 1', stepGroup: 'Group A', notes: '', createdAt: new Date(), updatedAt: new Date() },
        ],
        pagination: { page: 1, limit: 10, total: 1, hasMore: false },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<MultiAssignPage />);

      // Assert
      expect(screen.getByTestId('product-multi-select')).toBeInTheDocument();
      expect(screen.getByTestId('step-multi-select')).toBeInTheDocument();
      expect(screen.getByTestId('multi-assign-config-form')).toBeInTheDocument();
      expect(screen.getByTestId('multi-assign-preview')).toBeInTheDocument();
      expect(screen.getByTestId('multi-assign-progress')).toBeInTheDocument();
    });
  });

  describe('Page Title and Structure', () => {
    it('should render the correct page title', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
        isLoaded: true,
        isSignedIn: true,
      } as any);

      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      mockUseProductionSteps.mockReturnValue({
        productionSteps: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<MultiAssignPage />);

      // Assert
      expect(screen.getByText('🗂️ Bulk Add Production Step Details')).toBeInTheDocument();
    });

    it('should render the products and steps selection sections', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
        isLoaded: true,
        isSignedIn: true,
      } as any);

      mockUseProducts.mockReturnValue({
        products: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      mockUseProductionSteps.mockReturnValue({
        productionSteps: [],
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<MultiAssignPage />);

      // Assert
      expect(screen.getByText('Products Selection')).toBeInTheDocument();
      expect(screen.getByText('Steps Selection')).toBeInTheDocument();
    });
  });
});
