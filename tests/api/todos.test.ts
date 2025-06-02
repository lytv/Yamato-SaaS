/**
 * Todo API Routes Tests
 * Following TDD Workflow Standards with integration testing
 * Testing all CRUD endpoints with authentication and validation
 */

import { auth } from '@clerk/nextjs/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { DELETE, GET, PUT } from '@/app/api/todos/[id]/route';
import { GET as getList, POST as createTodo } from '@/app/api/todos/route';
import { GET as getStats } from '@/app/api/todos/stats/route';
import {
  createTodo as createTodoQuery,
  deleteTodo as deleteTodoQuery,
  getPaginatedTodos,
  getTodoById,
  getTodoStats,
  updateTodo as updateTodoQuery,
} from '@/libs/queries/todo';
import {
  validateCreateTodo,
  validateTodoId,
  validateTodoListParams,
  validateUpdateTodo,
} from '@/libs/validations/todo';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock database queries
vi.mock('@/libs/queries/todo', () => ({
  createTodo: vi.fn(),
  deleteTodo: vi.fn(),
  getPaginatedTodos: vi.fn(),
  getTodoById: vi.fn(),
  getTodoStats: vi.fn(),
  updateTodo: vi.fn(),
}));

// Mock validation functions
vi.mock('@/libs/validations/todo', () => ({
  validateCreateTodo: vi.fn(),
  validateTodoId: vi.fn(),
  validateTodoListParams: vi.fn(),
  validateUpdateTodo: vi.fn(),
}));

describe('Todo API Routes', () => {
  const mockUserId = 'user_123';
  const mockOrgId = 'org_456';
  const mockTodo = {
    id: 1,
    ownerId: mockUserId,
    title: 'Test Todo',
    message: 'Test message',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/todos (List todos)', () => {
    it('should return paginated todos for authenticated user', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateTodoListParams as any).mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      (getPaginatedTodos as any).mockResolvedValue({
        todos: [mockTodo],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          hasMore: false,
        },
      });

      const mockRequest = new Request('http://localhost/api/todos') as any;

      // Act
      const response = await getList(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockTodo]);
      expect(data.pagination).toBeDefined();
      expect(getPaginatedTodos).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: mockUserId }),
      );
    });

    it('should use orgId when user is in organization', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: mockOrgId });
      (validateTodoListParams as any).mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      (getPaginatedTodos as any).mockResolvedValue({
        todos: [mockTodo],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          hasMore: false,
        },
      });

      const mockRequest = new Request('http://localhost/api/todos') as any;

      // Act
      await getList(mockRequest);

      // Assert
      expect(getPaginatedTodos).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: mockOrgId }),
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: null, orgId: null });

      const mockRequest = new Request('http://localhost/api/todos') as any;

      // Act
      const response = await getList(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid query parameters', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateTodoListParams as any).mockImplementation(() => {
        throw new ZodError([]);
      });

      const mockRequest = new Request('http://localhost/api/todos?page=invalid') as any;

      // Act
      const response = await getList(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request parameters');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for database errors', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateTodoListParams as any).mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      (getPaginatedTodos as any).mockRejectedValue(new Error('Database error'));

      const mockRequest = new Request('http://localhost/api/todos') as any;

      // Act
      const response = await getList(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /api/todos (Create todo)', () => {
    it('should create todo for authenticated user', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateCreateTodo as any).mockReturnValue({
        title: 'New Todo',
        message: 'New message',
      });
      (createTodoQuery as any).mockResolvedValue(mockTodo);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          title: 'New Todo',
          message: 'New message',
        }),
      } as any;

      // Act
      const response = await createTodo(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTodo);
      expect(data.message).toBe('Todo created successfully');
      expect(createTodoQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: mockUserId,
          title: 'New Todo',
          message: 'New message',
        }),
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: null, orgId: null });

      const mockRequest = {
        json: vi.fn().mockResolvedValue({}),
      } as any;

      // Act
      const response = await createTodo(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid request data', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateCreateTodo as any).mockImplementation(() => {
        throw new ZodError([]);
      });

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ title: '' }),
      } as any;

      // Act
      const response = await createTodo(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/todos/[id] (Get single todo)', () => {
    it('should return todo for authenticated user with ownership', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateTodoId as any).mockReturnValue({ id: 1 });
      (getTodoById as any).mockResolvedValue(mockTodo);

      const mockRequest = {} as any;
      const mockParams = { params: { id: '1' } };

      // Act
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTodo);
      expect(getTodoById).toHaveBeenCalledWith(1, mockUserId);
    });

    it('should return 404 when todo not found', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateTodoId as any).mockReturnValue({ id: 999 });
      (getTodoById as any).mockResolvedValue(null);

      const mockRequest = {} as any;
      const mockParams = { params: { id: '999' } };

      // Act
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Todo not found');
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should return 401 for unauthenticated request', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: null, orgId: null });

      const mockRequest = {} as any;
      const mockParams = { params: { id: '1' } };

      // Act
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/todos/[id] (Update todo)', () => {
    it('should update todo for authenticated user with ownership', async () => {
      // Arrange
      const updatedTodo = { ...mockTodo, title: 'Updated Title' };
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateTodoId as any).mockReturnValue({ id: 1 });
      (validateUpdateTodo as any).mockReturnValue({ title: 'Updated Title' });
      (updateTodoQuery as any).mockResolvedValue(updatedTodo);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ title: 'Updated Title' }),
      } as any;
      const mockParams = { params: { id: '1' } };

      // Act
      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedTodo);
      expect(data.message).toBe('Todo updated successfully');
      expect(updateTodoQuery).toHaveBeenCalledWith(1, mockUserId, { title: 'Updated Title' });
    });

    it('should return 404 when todo not found', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateTodoId as any).mockReturnValue({ id: 999 });
      (validateUpdateTodo as any).mockReturnValue({ title: 'Updated Title' });
      (updateTodoQuery as any).mockRejectedValue(new Error('Todo not found or access denied'));

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ title: 'Updated Title' }),
      } as any;
      const mockParams = { params: { id: '999' } };

      // Act
      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Todo not found or access denied');
      expect(data.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/todos/[id] (Delete todo)', () => {
    it('should delete todo for authenticated user with ownership', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateTodoId as any).mockReturnValue({ id: 1 });
      (deleteTodoQuery as any).mockResolvedValue(true);

      const mockRequest = {} as any;
      const mockParams = { params: { id: '1' } };

      // Act
      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Todo deleted successfully');
      expect(deleteTodoQuery).toHaveBeenCalledWith(1, mockUserId);
    });

    it('should return 404 when todo not found', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (validateTodoId as any).mockReturnValue({ id: 999 });
      (deleteTodoQuery as any).mockRejectedValue(new Error('Todo not found or access denied'));

      const mockRequest = {} as any;
      const mockParams = { params: { id: '999' } };

      // Act
      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Todo not found or access denied');
      expect(data.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/todos/stats (Get todo statistics)', () => {
    it('should return statistics for authenticated user', async () => {
      // Arrange
      const mockStats = {
        total: 10,
        today: 2,
        thisWeek: 5,
        thisMonth: 8,
      };
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (getTodoStats as any).mockResolvedValue(mockStats);

      const mockRequest = {} as any;

      // Act
      const response = await getStats(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockStats);
      expect(getTodoStats).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 401 for unauthenticated request', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: null, orgId: null });

      const mockRequest = {} as any;

      // Act
      const response = await getStats(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for stats errors', async () => {
      // Arrange
      (auth as any).mockResolvedValue({ userId: mockUserId, orgId: null });
      (getTodoStats as any).mockRejectedValue(new Error('Stats calculation failed'));

      const mockRequest = {} as any;

      // Act
      const response = await getStats(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Stats calculation failed');
      expect(data.code).toBe('STATS_ERROR');
    });
  });
});
