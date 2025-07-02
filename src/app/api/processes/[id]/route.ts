/**
 * Individual Process API Routes
 * GET /api/processes/[id] - Get single process
 * PUT /api/processes/[id] - Update process
 * DELETE /api/processes/[id] - Delete process
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  deleteProcess,
  getProcessById,
  updateProcess,
} from '@/libs/queries/process';
import {
  validateProcessId,
  validateUpdateProcess,
} from '@/libs/validations/process';
import type {
  ProcessErrorResponse,
  ProcessResponse,
} from '@/types/process';

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * GET /api/processes/[id] - Get single process with ownership check
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ProcessResponse | ProcessErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization processs, fallback to userId for personal processs
    const ownerId = orgId || userId;

    // Validate process ID
    const { id } = validateProcessId({ id: params.id });

    // Get process with ownership check
    const process = await getProcessById(id, ownerId);

    if (!process) {
      return NextResponse.json(
        {
          success: false,
          error: 'Process not found or access denied',
          code: 'NOT_FOUND',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: process,
    });
  } catch (error) {
    console.error('Error fetching process:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid process ID',
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
 * PUT /api/processes/[id] - Update process with ownership check
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ProcessResponse | ProcessErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization processs, fallback to userId for personal processs
    const ownerId = orgId || userId;

    // Validate process ID
    const { id } = validateProcessId({ id: params.id });

    // Validate update data
    const body = await request.json();
    const validatedData = validateUpdateProcess(body);

    // Update process with ownership check
    const updatedProcess = await updateProcess(id, ownerId, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedProcess,
      message: 'Process updated successfully',
    });
  } catch (error) {
    console.error('Error updating process:', error);

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
      if (error.message === 'Process not found or access denied') {
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
 * DELETE /api/processes/[id] - Delete process with ownership check
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<{ success: true; message: string } | ProcessErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization processs, fallback to userId for personal processs
    const ownerId = orgId || userId;

    // Validate process ID
    const { id } = validateProcessId({ id: params.id });

    // Delete process with ownership check
    await deleteProcess(id, ownerId);

    return NextResponse.json({
      success: true,
      message: 'Process deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting process:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid process ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Process not found or access denied') {
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
