/**
 * Todo API Routes - Main endpoint
 * GET /api/todos - List todos with pagination and filtering
 * POST /api/todos - Create new todo
 * Following Yamato-SaaS patterns with Clerk authentication
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { createTodo, getPaginatedTodos } from '@/libs/queries/todo';
import {
  validateCreateTodo,
  validateTodoListParams,
} from '@/libs/validations/todo';
import type {
  TodoErrorResponse,
  TodoResponse,
  TodosResponse,
} from '@/types/todo';

/**
 * GET /api/todos - List todos with pagination and filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse<TodosResponse | TodoErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization todos, fallback to userId for personal todos
    const ownerId = orgId || userId;
    // FIX: Parse and validate query parameters with proper null handling
    const { searchParams } = new URL(request.url);

    // Convert null to undefined for optional parameters
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = { ...validateTodoListParams(queryParams), ownerId };

    // Get paginated todos
    const result = await getPaginatedTodos(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching todos:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/todos - Create new todo
 */
export async function POST(request: NextRequest): Promise<NextResponse<TodoResponse | TodoErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization todos, fallback to userId for personal todos
    const ownerId = orgId || userId;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateCreateTodo(body);

    // Create todo with owner information
    const todo = await createTodo({
      ...validatedData,
      ownerId,
    });

    return NextResponse.json(
      {
        success: true,
        data: todo,
        message: 'Todo created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating todo:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'CREATE_ERROR',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
