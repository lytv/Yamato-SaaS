/**
 * Products API Routes Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing main endpoints: GET /api/products and POST /api/products
 */

import { auth } from '@clerk/nextjs/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { GET, POST } from '@/app/api/products/route';
import {
  createProduct,
  getPaginatedProducts,
  getProductByCode,
} from '@/libs/queries/product';
import {
  validateCreateProduct,
  validateProductListParams,
} from '@/libs/validations/product';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/libs/queries/product', () => ({
  createProduct: vi.fn(),
  getProductByCode: vi.fn(),
  getPaginatedProducts: vi.fn(),
}));

vi.mock('@/libs/validations/product', () => ({
  validateCreateProduct: vi.fn(),
  validateProductListParams: vi.fn(),
}));

const mockAuth = vi.mocked(auth);
const mockCreateProduct = vi.mocked(createProduct);
const mockGetProductByCode = vi.mocked(getProductByCode);
const mockGetPaginatedProducts = vi.mocked(getPaginatedProducts);
const mockValidateCreateProduct = vi.mocked(validateCreateProduct);
const mockValidateProductListParams = vi.mocked(validateProductListParams);

// Test data
const mockProduct = {
  id: 1,
  ownerId: 'user_123',
  productCode: 'PROD-001',
  productName: 'Test Product',
  category: 'Electronics',
  notes: 'Test notes',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

const mockPaginatedResponse = {
  products: [mockProduct],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    hasMore: false,
  },
};

function createMockRequest(url: string, options: RequestInit = {}): Request {
  return new Request(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
}

describe('GET /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: null, orgId: null });
      const mockRequest = createMockRequest('http://localhost/api/products');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      });
    });

    it('should handle auth() function returning async result', async () => {
      // Arrange
      mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_123', orgId: null }));
      mockValidateProductListParams.mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      mockGetPaginatedProducts.mockResolvedValue(mockPaginatedResponse);
      const mockRequest = createMockRequest('http://localhost/api/products');

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response.status).toBe(200);
    });

    it('should handle auth() function returning sync result', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
      mockValidateProductListParams.mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      mockGetPaginatedProducts.mockResolvedValue(mockPaginatedResponse);
      const mockRequest = createMockRequest('http://localhost/api/products');

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('Query Parameter Validation (400 Fix)', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: 'org_456' });
      mockGetPaginatedProducts.mockResolvedValue(mockPaginatedResponse);
    });

    it('should handle null query parameters correctly', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/products');
      mockValidateProductListParams.mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(mockValidateProductListParams).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        search: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(response.status).toBe(200);
    });

    it('should convert null to undefined for query parameters', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/products?page=1&limit=5&search=test');
      mockValidateProductListParams.mockReturnValue({
        page: 1,
        limit: 5,
        search: 'test',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(mockValidateProductListParams).toHaveBeenCalledWith({
        page: '1',
        limit: '5',
        search: 'test',
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(response.status).toBe(200);
    });
  });

  describe('Multi-tenancy Support', () => {
    beforeEach(() => {
      mockValidateProductListParams.mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      mockGetPaginatedProducts.mockResolvedValue(mockPaginatedResponse);
    });

    it('should use orgId when available', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: 'org_456' });
      const mockRequest = createMockRequest('http://localhost/api/products');

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(mockGetPaginatedProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'org_456',
      });
      expect(response.status).toBe(200);
    });

    it('should fallback to userId when orgId is not available', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
      const mockRequest = createMockRequest('http://localhost/api/products');

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(mockGetPaginatedProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ownerId: 'user_123',
      });
      expect(response.status).toBe(200);
    });
  });

  describe('Validation Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
    });

    it('should return 400 for validation errors', async () => {
      // Arrange
      const validationError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'number',
          received: 'string',
          path: ['page'],
          message: 'Expected number, received string',
        },
      ]);
      mockValidateProductListParams.mockImplementation(() => {
        throw validationError;
      });
      const mockRequest = createMockRequest('http://localhost/api/products?page=invalid');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid parameters',
        code: 'VALIDATION_ERROR',
        details: validationError.errors,
      });
    });
  });

  describe('Successful Responses', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
      mockValidateProductListParams.mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should return products with pagination', async () => {
      // Arrange
      mockGetPaginatedProducts.mockResolvedValue(mockPaginatedResponse);
      const mockRequest = createMockRequest('http://localhost/api/products');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: [mockProduct],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          hasMore: false,
        },
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      mockGetPaginatedProducts.mockResolvedValue({
        products: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          hasMore: false,
        },
      });
      const mockRequest = createMockRequest('http://localhost/api/products');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
      mockValidateProductListParams.mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should return 500 for database errors', async () => {
      // Arrange
      mockGetPaginatedProducts.mockRejectedValue(new Error('Database connection failed'));
      const mockRequest = createMockRequest('http://localhost/api/products');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });
  });
});

describe('POST /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: null, orgId: null });
      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          productCode: 'PROD-001',
          productName: 'Test Product',
        }),
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('Product Creation', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
    });

    it('should create product successfully', async () => {
      // Arrange
      const createData = {
        productCode: 'PROD-001',
        productName: 'Test Product',
        category: 'Electronics',
        notes: 'Test notes',
      };

      mockValidateCreateProduct.mockReturnValue(createData);
      mockGetProductByCode.mockResolvedValue(null); // No duplicate
      mockCreateProduct.mockResolvedValue(mockProduct);

      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify(createData),
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        data: mockProduct,
        message: 'Product created successfully',
      });
      expect(mockCreateProduct).toHaveBeenCalledWith({
        ...createData,
        ownerId: 'user_123',
      });
    });

    it('should check for duplicate product codes', async () => {
      // Arrange
      const createData = {
        productCode: 'PROD-001',
        productName: 'Test Product',
      };

      mockValidateCreateProduct.mockReturnValue(createData);
      mockGetProductByCode.mockResolvedValue(mockProduct); // Duplicate found

      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify(createData),
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data).toEqual({
        success: false,
        error: 'Product code already exists',
        code: 'DUPLICATE_CODE',
      });
      expect(mockCreateProduct).not.toHaveBeenCalled();
    });
  });

  describe('Validation Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
    });

    it('should return 400 for validation errors', async () => {
      // Arrange
      const validationError = new ZodError([
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'Product name is required',
          path: ['productName'],
        },
      ]);

      mockValidateCreateProduct.mockImplementation(() => {
        throw validationError;
      });

      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          productCode: 'PROD-001',
          productName: '', // Invalid
        }),
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: validationError.errors,
      });
    });

    it('should handle malformed JSON', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: 'invalid json',
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Database Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
      mockValidateCreateProduct.mockReturnValue({
        productCode: 'PROD-001',
        productName: 'Test Product',
      });
      mockGetProductByCode.mockResolvedValue(null);
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      mockCreateProduct.mockRejectedValue(new Error('Database connection failed'));
      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          productCode: 'PROD-001',
          productName: 'Test Product',
        }),
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });

    it('should handle database constraint violations', async () => {
      // Arrange
      mockCreateProduct.mockRejectedValue(new Error('duplicate key value violates unique constraint'));
      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          productCode: 'PROD-001',
          productName: 'Test Product',
        }),
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data).toEqual({
        success: false,
        error: 'Product code already exists',
        code: 'DUPLICATE_CODE',
      });
    });
  });
});
