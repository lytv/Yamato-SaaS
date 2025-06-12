/**
 * ProductionStepDetails Statistics API Route Tests
 * Following TDD Workflow Standards - Red Phase
 * Testing statistics endpoint with authentication and data aggregation
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
const mockGetProductionStepDetailStats = vi.fn();

vi.mock('@/libs/queries/productionStepDetail', () => ({
  getProductionStepDetailStats: mockGetProductionStepDetailStats,
}));

// Helper to create mock request
function createMockRequest(): any {
  return {};
}

describe('GET /api/production-step-details/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful stats mock
    mockGetProductionStepDetailStats.mockResolvedValue({
      total: 150,
      today: 5,
      thisWeek: 25,
      thisMonth: 80,
      byProduct: [
        { productName: 'Product A', count: 45 },
        { productName: 'Product B', count: 30 },
        { productName: 'Product C', count: 25 },
      ],
      byProductionStep: [
        { stepName: 'Step 1', count: 50 },
        { stepName: 'Step 2', count: 40 },
        { stepName: 'Step 3', count: 35 },
      ],
    });
  });

  describe('Authentication Tests', () => {
    it('should return production step detail statistics for authenticated user', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });

      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest());
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();

      // Verify statistics structure
      expect(data.data.total).toBe(150);
      expect(data.data.today).toBe(5);
      expect(data.data.thisWeek).toBe(25);
      expect(data.data.thisMonth).toBe(80);

      // Verify product breakdown
      expect(data.data.byProduct).toHaveLength(3);
      expect(data.data.byProduct[0]).toEqual({ productName: 'Product A', count: 45 });

      // Verify production step breakdown
      expect(data.data.byProductionStep).toHaveLength(3);
      expect(data.data.byProductionStep[0]).toEqual({ stepName: 'Step 1', count: 50 });

      expect(mockGetProductionStepDetailStats).toHaveBeenCalledWith('org_456');
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest());
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized access');
      expect(data.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Data Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should handle empty statistics', async () => {
      // Arrange
      mockGetProductionStepDetailStats.mockResolvedValue({
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        byProduct: [],
        byProductionStep: [],
      });

      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest());
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total).toBe(0);
      expect(data.data.byProduct).toHaveLength(0);
      expect(data.data.byProductionStep).toHaveLength(0);
    });

    it('should include metadata in response', async () => {
      // Arrange
      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest());
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.message).toBe('Production step detail statistics retrieved successfully');
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
      mockGetProductionStepDetailStats.mockRejectedValue(new Error('Database error'));
      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest());
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should handle database connection issues', async () => {
      // Arrange
      mockGetProductionStepDetailStats.mockRejectedValue(new Error('Connection timeout'));
      const { GET } = await import('./route');

      // Act
      const response = await GET(createMockRequest());
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Performance Tests', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_456',
      });
    });

    it('should handle large datasets efficiently', async () => {
      // Arrange
      const largeStats = {
        total: 10000,
        today: 500,
        thisWeek: 2500,
        thisMonth: 8000,
        byProduct: Array.from({ length: 100 }, (_, i) => ({
          productName: `Product ${i + 1}`,
          count: Math.floor(Math.random() * 100) + 1,
        })),
        byProductionStep: Array.from({ length: 50 }, (_, i) => ({
          stepName: `Step ${i + 1}`,
          count: Math.floor(Math.random() * 200) + 1,
        })),
      };

      mockGetProductionStepDetailStats.mockResolvedValue(largeStats);
      const { GET } = await import('./route');

      // Act
      const startTime = Date.now();
      const response = await GET(createMockRequest());
      const endTime = Date.now();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total).toBe(10000);
      expect(data.data.byProduct).toHaveLength(100);
      expect(data.data.byProductionStep).toHaveLength(50);

      // Performance assertion (should respond quickly)
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });
  });
});
