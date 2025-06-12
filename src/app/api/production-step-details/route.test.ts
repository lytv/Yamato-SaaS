/**
 * ProductionStepDetails API Route Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing authentication, validation, and error handling
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ✅ Mock console.error to handle expected error logging
vi.spyOn(console, 'error').mockImplementation(() => {});

// ✅ Mock Clerk auth - testing both sync/async patterns
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// ✅ Mock database queries to prevent actual database calls
const mockGetPaginatedProductionStepDetails = vi.fn();
const mockCreateProductionStepDetail = vi.fn();
const mockGetProductionStepDetailById = vi.fn();
const mockGetProductionStepDetailsByOwner = vi.fn();

vi.mock('@/libs/queries/productionStepDetail', () => ({
  getPaginatedProductionStepDetails: mockGetPaginatedProductionStepDetails,
  createProductionStepDetail: mockCreateProductionStepDetail,
  getProductionStepDetailById: mockGetProductionStepDetailById,
  getProductionStepDetailsByOwner: mockGetProductionStepDetailsByOwner,
}));

// Helper to create mock request with proper NextURL structure
function createMockRequest(url: string, options: RequestInit = {}): any {
  const urlObj = new URL(url);
  return {
    url,
    nextUrl: {
      searchParams: urlObj.searchParams,
    },
    json: async () => JSON.parse(options.body as string || '{}'),
    ...options,
  };
}

describe('GET /api/production-step-details', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful database mock
    mockGetPaginatedProductionStepDetails.mockResolvedValue({
      productionStepDetails: [],
      pagination: { page: 1, limit: 10, total: 0, hasMore: false },
    });

    // Default empty result for duplicate checks
    mockGetProductionStepDetailsByOwner.mockResolvedValue([]);
  });

  describe('Authentication Tests', () => {
    it('should handle authenticated requests', async () => {
      // Arrange - Mock auth
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });

      const mockRequest = createMockRequest('http://localhost/api/production-step-details');
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
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const mockRequest = createMockRequest('http://localhost/api/production-step-details');
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

  describe('Query Parameter Validation', () => {
    beforeEach(() => {
      // Setup authenticated user for these tests
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should handle default query parameters', async () => {
      // Arrange - No query parameters
      const mockRequest = createMockRequest('http://localhost/api/production-step-details');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('should handle filtering by productId', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/production-step-details?productId=123');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGetPaginatedProductionStepDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 123,
        }),
      );
    });

    it('should handle filtering by productionStepId', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/production-step-details?productionStepId=456');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGetPaginatedProductionStepDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          productionStepId: 456,
        }),
      );
    });

    it('should handle search functionality', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/production-step-details?search=test');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGetPaginatedProductionStepDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
        }),
      );
    });

    it('should validate sort parameters', async () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost/api/production-step-details?sortBy=sequenceNumber&sortOrder=asc');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      mockGetPaginatedProductionStepDetails.mockRejectedValue(new Error('Database error'));
      const mockRequest = createMockRequest('http://localhost/api/production-step-details');
      const { GET } = await import('./route');

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});

describe('POST /api/production-step-details', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful database mock
    mockCreateProductionStepDetail.mockResolvedValue({
      id: 1,
      ownerId: 'user_123',
      productId: 1,
      productionStepId: 2,
      sequenceNumber: 1,
      factoryPrice: '100.50',
      calculatedPrice: '110.75',
      quantityLimit1: 1000,
      quantityLimit2: 2000,
      isFinalStep: false,
      isVtStep: true,
      isParkingStep: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Default empty result for duplicate checks
    mockGetProductionStepDetailsByOwner.mockResolvedValue([]);
  });

  describe('Authentication Tests', () => {
    it('should create production step detail for authenticated user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });

      const validData = {
        productId: 1,
        productionStepId: 2,
        sequenceNumber: 1,
        factoryPrice: '100.50',
        calculatedPrice: '110.75',
        quantityLimit1: 1000,
        quantityLimit2: 2000,
        isFinalStep: false,
        isVtStep: true,
        isParkingStep: false,
      };

      const mockRequest = createMockRequest('http://localhost/api/production-step-details', {
        method: 'POST',
        body: JSON.stringify(validData),
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Production step detail created successfully');
      expect(mockCreateProductionStepDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validData,
          ownerId: 'org_456',
        }),
      );
    });

    it('should return 401 for unauthenticated POST requests', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const mockRequest = createMockRequest('http://localhost/api/production-step-details', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized access');
      expect(data.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Validation Tests', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should validate required fields', async () => {
      // Arrange - Missing required fields
      const invalidData = {
        productId: 1,
        // Missing productionStepId and sequenceNumber
      };

      const mockRequest = createMockRequest('http://localhost/api/production-step-details', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate number fields', async () => {
      // Arrange - Invalid number types
      const invalidData = {
        productId: 'invalid',
        productionStepId: 'invalid',
        sequenceNumber: 'invalid',
      };

      const mockRequest = createMockRequest('http://localhost/api/production-step-details', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate business rules (unique product-step combination)', async () => {
      // Arrange - Simulate duplicate check
      mockGetProductionStepDetailsByOwner.mockResolvedValue([{
        id: 1,
        ownerId: 'user_123',
        productId: 1,
        productionStepId: 2,
      }]);

      const duplicateData = {
        productId: 1,
        productionStepId: 2,
        sequenceNumber: 1,
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      const mockRequest = createMockRequest('http://localhost/api/production-step-details', {
        method: 'POST',
        body: JSON.stringify(duplicateData),
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Production step already assigned to this product');
      expect(data.code).toBe('DUPLICATE_ASSIGNMENT');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should handle database creation errors', async () => {
      // Arrange
      mockCreateProductionStepDetail.mockRejectedValue(new Error('Database error'));

      const validData = {
        productId: 1,
        productionStepId: 2,
        sequenceNumber: 1,
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      const mockRequest = createMockRequest('http://localhost/api/production-step-details', {
        method: 'POST',
        body: JSON.stringify(validData),
      });

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should handle malformed JSON', async () => {
      // Arrange
      const mockRequest = {
        url: 'http://localhost/api/production-step-details',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      };

      const { POST } = await import('./route');

      // Act
      const response = await POST(mockRequest as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
