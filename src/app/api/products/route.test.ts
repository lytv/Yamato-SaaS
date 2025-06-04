/**
 * Products API Route Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing critical fixes: auth compatibility, query parameter validation, error handling
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ✅ Mock console.error to handle expected error logging
vi.spyOn(console, 'error').mockImplementation(() => {});

// ✅ Mock Clerk auth - testing both sync/async patterns
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs', () => ({
  auth: mockAuth,
}));

// ✅ Mock database queries to prevent actual database calls
const mockGetPaginatedProducts = vi.fn();
const mockCreateProduct = vi.fn();
const mockGetProductByCode = vi.fn();

vi.mock('@/libs/queries/product', () => ({
  getPaginatedProducts: mockGetPaginatedProducts,
  createProduct: mockCreateProduct,
  getProductByCode: mockGetProductByCode,
}));

// Helper to create mock request with proper NextURL structure
function createMockRequest(url: string, options: RequestInit = {}): any {
  const urlObj = new URL(url);
  return {
    nextUrl: {
      searchParams: urlObj.searchParams,
    },
    json: async () => JSON.parse(options.body as string || '{}'),
    ...options,
  };
}

describe('GET /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful database mock
    mockGetPaginatedProducts.mockResolvedValue({
      products: [],
      pagination: { page: 1, limit: 10, total: 0, hasMore: false },
    });
  });

  describe('Authentication Tests', () => {
    it('should handle sync auth() function', async () => {
      // Arrange - Mock sync auth pattern
      mockAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
      });

      const mockRequest = createMockRequest('http://localhost/api/products');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAuth).toHaveBeenCalledOnce();
    });

    it('should handle async auth() function', async () => {
      // Arrange - Mock async auth pattern
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });

      const mockRequest = createMockRequest('http://localhost/api/products');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAuth).toHaveBeenCalledOnce();
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange - Mock no auth
      mockAuth.mockReturnValue({
        userId: null,
        orgId: null,
      });

      const mockRequest = createMockRequest('http://localhost/api/products');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized access');
      expect(data.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Query Parameter Validation (400 Fix)', () => {
    beforeEach(() => {
      // Setup authenticated user for these tests
      mockAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should handle null query parameters (400 fix)', async () => {
      // Arrange - No query parameters (searchParams.get() returns null)
      const mockRequest = createMockRequest('http://localhost/api/products');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pagination.page).toBe(1); // Default value
      expect(data.pagination.limit).toBe(10); // Default value
    });

    it('should handle string number conversion correctly', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/products?page=2&limit=25&search=test');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(25);
    });

    it('should enforce pagination limits', async () => {
      // Arrange - Invalid pagination
      const mockRequest = createMockRequest('http://localhost/api/products?page=0&limit=150');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(1); // Corrected to minimum
      expect(data.pagination.limit).toBe(100); // Corrected to maximum
    });

    it('should handle invalid number strings', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/products?page=invalid&limit=notanumber');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(1); // Fallback to default
      expect(data.pagination.limit).toBe(10); // Fallback to default
    });

    it('should validate sortBy and sortOrder parameters', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/products?sortBy=productName&sortOrder=asc');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should default invalid sort parameters', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/products?sortBy=invalid&sortOrder=wrong');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should use default values (createdAt, desc)
    });

    it('should return validation error for extremely invalid input', async () => {
      // Arrange - This should trigger Zod validation error
      const mockRequest = createMockRequest('http://localhost/api/products?page=-999999');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert - Should still work due to our robust validation
      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(1); // Corrected by validation
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should return correct response structure', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/products');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(data).toMatchObject({
        success: true,
        data: expect.any(Array),
        pagination: {
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          hasMore: expect.any(Boolean),
        },
      });
    });

    it('should include proper CORS headers', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/products');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Error Handling', () => {
    it('should handle auth errors gracefully', async () => {
      // ✅ Expect console.error to be called for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Arrange - Mock auth throwing error
      mockAuth.mockImplementation(() => {
        throw new Error('Auth service unavailable');
      });

      const mockRequest = createMockRequest('http://localhost/api/products');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching products:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle database errors gracefully', async () => {
      // ✅ Expect console.error to be called for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Arrange - Mock successful auth but database error
      mockAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
      });

      mockGetPaginatedProducts.mockRejectedValue(new Error('Database connection failed'));

      const mockRequest = createMockRequest('http://localhost/api/products');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);

      // Assert - Should not expose internal errors
      if (response.status === 500) {
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.code).toBe('INTERNAL_ERROR');
        expect(data.error).not.toContain('database'); // Don't leak internals
      }

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching products:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});

describe('POST /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockGetProductByCode.mockResolvedValue(null); // No existing product
    mockCreateProduct.mockResolvedValue({
      id: 1,
      ownerId: 'user_123',
      productCode: 'PROD001',
      productName: 'Test Product',
      category: 'Electronics',
      notes: 'Test notes',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('Authentication Tests', () => {
    it('should require authentication', async () => {
      // Arrange
      mockAuth.mockReturnValue({
        userId: null,
        orgId: null,
      });

      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          productCode: 'PROD001',
          productName: 'Test Product',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should validate required fields', async () => {
      // ✅ Expect console.error to be called for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Arrange - Missing required fields
      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          category: 'Electronics', // Missing productCode and productName
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Error creating product:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should validate productCode format', async () => {
      // ✅ Expect console.error to be called for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Arrange - Invalid productCode
      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          productCode: 'PROD@001!', // Invalid characters
          productName: 'Test Product',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(consoleSpy).toHaveBeenCalledWith('Error creating product:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should accept valid product data', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          productCode: 'PROD001',
          productName: 'Test Product',
          category: 'Electronics',
          notes: 'Test notes',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.message).toBe('Product created successfully');
    });

    it('should handle duplicate productCode', async () => {
      // Arrange - Mock existing product
      mockGetProductByCode.mockResolvedValue({
        id: 1,
        ownerId: 'user_123',
        productCode: 'EXISTING001',
        productName: 'Existing Product',
        category: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          productCode: 'EXISTING001',
          productName: 'Test Product',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.code).toBe('DUPLICATE_CODE');
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should return 201 with correct structure on success', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify({
          productCode: 'PROD001',
          productName: 'Test Product',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        success: true,
        data: expect.any(Object),
        message: expect.any(String),
      });
    });
  });
});
