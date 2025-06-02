/**
 * Todo API Routes - Individual todo operations
 * GET /api/todos/[id] - Get single todo
 * PUT /api/todos/[id] - Update todo
 * DELETE /api/todos/[id] - Delete todo
 * Following Yamato-SaaS patterns with Clerk authentication
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { deleteTodo, getTodoById, updateTodo } from '@/libs/queries/todo';
import {
  validateTodoId,
  validateUpdateTodo,
} from '@/libs/validations/todo';
import type {
  TodoErrorResponse,
  TodoResponse,
} from '@/types/todo';

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * GET /api/todos/[id] - Get single todo with ownership check
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<TodoResponse | TodoErrorResponse>> {
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

    // Validate todo ID
    const { id } = validateTodoId({ id: params.id });

    // Get todo with ownership check
    const todo = await getTodoById(id, ownerId);

    if (!todo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found',
          code: 'NOT_FOUND',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error('Error fetching todo:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid todo ID',
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
 * PUT /api/todos/[id] - Update todo with ownership check
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<TodoResponse | TodoErrorResponse>> {
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

    // Validate todo ID
    const { id } = validateTodoId({ id: params.id });

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateUpdateTodo(body);

    // Update todo with ownership check
    const updatedTodo = await updateTodo(id, ownerId, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedTodo,
      message: 'Todo updated successfully',
    });
  } catch (error) {
    console.error('Error updating todo:', error);

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
      if (error.message === 'Todo not found or access denied') {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'UPDATE_ERROR',
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
 * DELETE /api/todos/[id] - Delete todo with ownership check
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<{ success: true; message: string } | TodoErrorResponse>> {
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

    // Validate todo ID
    const { id } = validateTodoId({ id: params.id });

    // Delete todo with ownership check
    await deleteTodo(id, ownerId);

    return NextResponse.json({
      success: true,
      message: 'Todo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting todo:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid todo ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Todo not found or access denied') {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'DELETE_ERROR',
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
