/**
 * ProductionStepDetails [id] API Route Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing GET, PUT, DELETE operations for single records
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ✅ Mock console.error to handle expected error logging
vi.spyOn(console, 'error').mockImplementation(() => {});

// ✅ Mock Clerk auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// ✅ Mock database queries
const mockGetProductionStepDetailById = vi.fn();
const mockUpdateProductionStepDetail = vi.fn();
const mockDeleteProductionStepDetail = vi.fn();
const mockGetProductionStepDetailsByOwner = vi.fn();

vi.mock('@/libs/queries/productionStepDetail', () => ({
  getProductionStepDetailById: mockGetProductionStepDetailById,
  updateProductionStepDetail: mockUpdateProductionStepDetail,
  deleteProductionStepDetail: mockDeleteProductionStepDetail,
  getProductionStepDetailsByOwner: mockGetProductionStepDetailsByOwner,
}));

// Helper to create mock request
function createMockRequest(options: RequestInit = {}): any {
  return {
    json: async () => JSON.parse(options.body as string || '{}'),
    ...options,
  };
}

describe('GET /api/production-step-details/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock
    mockGetProductionStepDetailById.mockResolvedValue({
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
  });

  describe('Authentication Tests', () => {
    it('should return production step detail for authenticated user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });

      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest(), { params: { id: '1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
      expect(mockGetProductionStepDetailById).toHaveBeenCalledWith(1, 'org_456');
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest(), { params: { id: '1' } });
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

    it('should validate ID parameter', async () => {
      // Arrange
      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest(), { params: { id: 'invalid' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid ID parameter');
      expect(data.code).toBe('INVALID_ID');
    });

    it('should return 404 for non-existent records', async () => {
      // Arrange
      mockGetProductionStepDetailById.mockResolvedValue(null);
      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest(), { params: { id: '999' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Production step detail not found');
      expect(data.code).toBe('NOT_FOUND');
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
      mockGetProductionStepDetailById.mockRejectedValue(new Error('Database error'));
      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest(), { params: { id: '1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});

describe('PUT /api/production-step-details/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mocks
    mockGetProductionStepDetailById.mockResolvedValue({
      id: 1,
      ownerId: 'user_123',
      productId: 1,
      productionStepId: 2,
    });

    mockUpdateProductionStepDetail.mockResolvedValue({
      id: 1,
      ownerId: 'user_123',
      productId: 1,
      productionStepId: 2,
      sequenceNumber: 2,
      factoryPrice: '150.00',
      calculatedPrice: '165.50',
      quantityLimit1: 1500,
      quantityLimit2: 2500,
      isFinalStep: true,
      isVtStep: false,
      isParkingStep: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Default empty result for duplicate checks
    mockGetProductionStepDetailsByOwner.mockResolvedValue([]);
  });

  describe('Authentication Tests', () => {
    it('should update production step detail for authenticated user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });

      const updateData = {
        sequenceNumber: 2,
        factoryPrice: '150.00',
        calculatedPrice: '165.50',
        quantityLimit1: 1500,
        quantityLimit2: 2500,
        isFinalStep: true,
        isVtStep: false,
        isParkingStep: false,
      };

      const mockRequest = createMockRequest({
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import('./route');

      // Act
      const response = await PUT(mockRequest, { params: { id: '1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Production step detail updated successfully');
      expect(mockUpdateProductionStepDetail).toHaveBeenCalledWith(1, 'org_456', updateData);
    });

    it('should return 401 for unauthenticated PUT requests', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const mockRequest = createMockRequest({
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const { PUT } = await import('./route');

      // Act
      const response = await PUT(mockRequest, { params: { id: '1' } });
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

    it('should validate update data', async () => {
      // Arrange - Invalid data
      const invalidData = {
        sequenceNumber: 'invalid',
        factoryPrice: 'not-a-number',
      };

      const mockRequest = createMockRequest({
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });

      const { PUT } = await import('./route');

      // Act
      const response = await PUT(mockRequest, { params: { id: '1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent records', async () => {
      // Arrange
      mockGetProductionStepDetailById.mockResolvedValue(null);

      const updateData = {
        sequenceNumber: 2,
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      const mockRequest = createMockRequest({
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import('./route');

      // Act
      const response = await PUT(mockRequest, { params: { id: '999' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Production step detail not found');
      expect(data.code).toBe('NOT_FOUND');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should handle database update errors', async () => {
      // Arrange
      mockUpdateProductionStepDetail.mockRejectedValue(new Error('Database error'));

      const validData = {
        sequenceNumber: 2,
        isFinalStep: false,
        isVtStep: false,
        isParkingStep: false,
      };

      const mockRequest = createMockRequest({
        method: 'PUT',
        body: JSON.stringify(validData),
      });

      const { PUT } = await import('./route');

      // Act
      const response = await PUT(mockRequest, { params: { id: '1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});

describe('DELETE /api/production-step-details/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock
    mockGetProductionStepDetailById.mockResolvedValue({
      id: 1,
      ownerId: 'user_123',
      productId: 1,
      productionStepId: 2,
    });

    mockDeleteProductionStepDetail.mockResolvedValue(true);
  });

  describe('Authentication Tests', () => {
    it('should delete production step detail for authenticated user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });

      const { DELETE } = await import('./route');

      // Act
      const response = await DELETE(createMockRequest(), { params: { id: '1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Production step detail deleted successfully');
      expect(mockDeleteProductionStepDetail).toHaveBeenCalledWith(1, 'org_456');
    });

    it('should return 401 for unauthenticated DELETE requests', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const { DELETE } = await import('./route');

      // Act
      const response = await DELETE(createMockRequest(), { params: { id: '1' } });
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

    it('should validate ID parameter', async () => {
      // Arrange
      const { DELETE } = await import('./route');

      // Act
      const response = await DELETE(createMockRequest(), { params: { id: 'invalid' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid ID parameter');
      expect(data.code).toBe('INVALID_ID');
    });

    it('should return 404 for non-existent records', async () => {
      // Arrange
      mockGetProductionStepDetailById.mockResolvedValue(null);
      const { DELETE } = await import('./route');

      // Act
      const response = await DELETE(createMockRequest(), { params: { id: '999' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Production step detail not found');
      expect(data.code).toBe('NOT_FOUND');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should handle database delete errors', async () => {
      // Arrange
      mockDeleteProductionStepDetail.mockRejectedValue(new Error('Database error'));
      const { DELETE } = await import('./route');

      // Act
      const response = await DELETE(createMockRequest(), { params: { id: '1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
