/**
 * Individual Product API Routes Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing: GET /api/products/[id], PUT /api/products/[id], DELETE /api/products/[id]
 */

import { auth } from '@clerk/nextjs/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { DELETE, GET, PUT } from '@/app/api/products/[id]/route';
import {
  deleteProduct,
  getProductById,
  updateProduct,
} from '@/libs/queries/product';
import {
  validateProductId,
  validateUpdateProduct,
} from '@/libs/validations/product';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/libs/queries/product', () => ({
  deleteProduct: vi.fn(),
  getProductById: vi.fn(),
  updateProduct: vi.fn(),
}));

vi.mock('@/libs/validations/product', () => ({
  validateProductId: vi.fn(),
  validateUpdateProduct: vi.fn(),
}));

const mockAuth = vi.mocked(auth);
const mockDeleteProduct = vi.mocked(deleteProduct);
const mockGetProductById = vi.mocked(getProductById);
const mockUpdateProduct = vi.mocked(updateProduct);
const mockValidateProductId = vi.mocked(validateProductId);
const mockValidateUpdateProduct = vi.mocked(validateUpdateProduct);

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

const routeParams = { params: { id: '1' } };

function createMockRequest(url: string, options: RequestInit = {}): Request {
  return new Request(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
}

describe('GET /api/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: null, orgId: null });
      const mockRequest = createMockRequest('http://localhost/api/products/1');

      // Act
      const response = await GET(mockRequest, routeParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      });
    });

    it('should handle async auth result', async () => {
      // Arrange
      mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_123', orgId: null }));
      mockValidateProductId.mockReturnValue({ id: 1 });
      mockGetProductById.mockResolvedValue(mockProduct);
      const mockRequest = createMockRequest('http://localhost/api/products/1');

      // Act
      const response = await GET(mockRequest, routeParams);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('Product ID Validation', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
    });

    it('should validate product ID parameter', async () => {
      // Arrange
      mockValidateProductId.mockReturnValue({ id: 1 });
      mockGetProductById.mockResolvedValue(mockProduct);
      const mockRequest = createMockRequest('http://localhost/api/products/1');

      // Act
      const response = await GET(mockRequest, routeParams);

      // Assert
      expect(mockValidateProductId).toHaveBeenCalledWith({ id: '1' });
      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid product ID', async () => {
      // Arrange
      const validationError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'number',
          received: 'string',
          path: ['id'],
          message: 'Expected number, received string',
        },
      ]);
      mockValidateProductId.mockImplementation(() => {
        throw validationError;
      });
      const mockRequest = createMockRequest('http://localhost/api/products/invalid');

      // Act
      const response = await GET(mockRequest, routeParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid product ID',
        code: 'VALIDATION_ERROR',
        details: validationError.errors,
      });
    });
  });

  describe('Ownership Check', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
      mockValidateProductId.mockReturnValue({ id: 1 });
    });

    it('should return product for authorized owner', async () => {
      // Arrange
      mockGetProductById.mockResolvedValue(mockProduct);
      const mockRequest = createMockRequest('http://localhost/api/products/1');

      // Act
      const response = await GET(mockRequest, routeParams);
      const data = await response.json();

      // Assert
      expect(mockGetProductById).toHaveBeenCalledWith(1, 'user_123');
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockProduct,
      });
    });

    it('should return 404 when product not found or access denied', async () => {
      // Arrange
      mockGetProductById.mockResolvedValue(null);
      const mockRequest = createMockRequest('http://localhost/api/products/1');

      // Act
      const response = await GET(mockRequest, routeParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Product not found or access denied',
        code: 'NOT_FOUND',
      });
    });

    it('should use orgId when available for ownership check', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: 'org_456' });
      mockGetProductById.mockResolvedValue(mockProduct);
      const mockRequest = createMockRequest('http://localhost/api/products/1');

      // Act
      const response = await GET(mockRequest, routeParams);

      // Assert
      expect(mockGetProductById).toHaveBeenCalledWith(1, 'org_456');
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
      mockValidateProductId.mockReturnValue({ id: 1 });
    });

    it('should return 500 for database errors', async () => {
      // Arrange
      mockGetProductById.mockRejectedValue(new Error('Database connection failed'));
      const mockRequest = createMockRequest('http://localhost/api/products/1');

      // Act
      const response = await GET(mockRequest, routeParams);
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

describe('PUT /api/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: null, orgId: null });
      const mockRequest = createMockRequest('http://localhost/api/products/1', {
        method: 'PUT',
        body: JSON.stringify({ productName: 'Updated Product' }),
      });

      // Act
      const response = await PUT(mockRequest, routeParams);
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

  describe('Product Update', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
    });

    it('should update product successfully', async () => {
      // Arrange
      const updateData = { productName: 'Updated Product', category: 'Updated Category' };
      const updatedProduct = { ...mockProduct, ...updateData };

      mockValidateProductId.mockReturnValue({ id: 1 });
      mockValidateUpdateProduct.mockReturnValue(updateData);
      mockUpdateProduct.mockResolvedValue(updatedProduct);

      const mockRequest = createMockRequest('http://localhost/api/products/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await PUT(mockRequest, routeParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully',
      });
      expect(mockUpdateProduct).toHaveBeenCalledWith(1, 'user_123', updateData);
    });

    it('should return 404 when product not found', async () => {
      // Arrange
      const updateData = { productName: 'Updated Product' };

      mockValidateProductId.mockReturnValue({ id: 1 });
      mockValidateUpdateProduct.mockReturnValue(updateData);
      mockUpdateProduct.mockRejectedValue(new Error('Product not found or access denied'));

      const mockRequest = createMockRequest('http://localhost/api/products/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await PUT(mockRequest, routeParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Product not found or access denied',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('Validation Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
      mockValidateProductId.mockReturnValue({ id: 1 });
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

      mockValidateUpdateProduct.mockImplementation(() => {
        throw validationError;
      });

      const mockRequest = createMockRequest('http://localhost/api/products/1', {
        method: 'PUT',
        body: JSON.stringify({ productName: '' }),
      });

      // Act
      const response = await PUT(mockRequest, routeParams);
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
      const mockRequest = createMockRequest('http://localhost/api/products/1', {
        method: 'PUT',
        body: 'invalid json',
      });

      // Act
      const response = await PUT(mockRequest, routeParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});

describe('DELETE /api/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: null, orgId: null });
      const mockRequest = createMockRequest('http://localhost/api/products/1', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(mockRequest, routeParams);
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

  describe('Product Deletion', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
    });

    it('should delete product successfully', async () => {
      // Arrange
      mockValidateProductId.mockReturnValue({ id: 1 });
      mockDeleteProduct.mockResolvedValue(true);

      const mockRequest = createMockRequest('http://localhost/api/products/1', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(mockRequest, routeParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Product deleted successfully',
      });
      expect(mockDeleteProduct).toHaveBeenCalledWith(1, 'user_123');
    });

    it('should return 404 when product not found', async () => {
      // Arrange
      mockValidateProductId.mockReturnValue({ id: 1 });
      mockDeleteProduct.mockRejectedValue(new Error('Product not found or access denied'));

      const mockRequest = createMockRequest('http://localhost/api/products/1', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(mockRequest, routeParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Product not found or access denied',
        code: 'NOT_FOUND',
      });
    });

    it('should use orgId when available for deletion', async () => {
      // Arrange
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: 'org_456' });
      mockValidateProductId.mockReturnValue({ id: 1 });
      mockDeleteProduct.mockResolvedValue(true);

      const mockRequest = createMockRequest('http://localhost/api/products/1', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(mockRequest, routeParams);

      // Assert
      expect(mockDeleteProduct).toHaveBeenCalledWith(1, 'org_456');
      expect(response.status).toBe(200);
    });
  });

  describe('Validation Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
    });

    it('should return 400 for invalid product ID', async () => {
      // Arrange
      const validationError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'number',
          received: 'string',
          path: ['id'],
          message: 'Expected number, received string',
        },
      ]);

      mockValidateProductId.mockImplementation(() => {
        throw validationError;
      });

      const mockRequest = createMockRequest('http://localhost/api/products/invalid', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(mockRequest, routeParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid product ID',
        code: 'VALIDATION_ERROR',
        details: validationError.errors,
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123', orgId: null });
      mockValidateProductId.mockReturnValue({ id: 1 });
    });

    it('should return 500 for database errors', async () => {
      // Arrange
      mockDeleteProduct.mockRejectedValue(new Error('Database connection failed'));
      const mockRequest = createMockRequest('http://localhost/api/products/1', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(mockRequest, routeParams);
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
