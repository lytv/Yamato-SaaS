/**
 * Individual UserSync API Routes
 * GET /api/user_syncs/[id] - Get single user_sync
 * PUT /api/user_syncs/[id] - Update user_sync
 * DELETE /api/user_syncs/[id] - Delete user_sync
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  deleteUserSync,
  getUserSyncByUserId,
  updateUserSync,
} from '@/libs/queries/user_sync';
import {
  validateUpdateUserSync,
} from '@/libs/validations/user_sync';
import type {
  UserSyncErrorResponse,
  UserSyncResponse,
} from '@/types/user_sync';

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * GET /api/user_syncs/[id] - Get single user_sync with ownership check
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<UserSyncResponse | UserSyncErrorResponse>> {
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

    // Use orgId for organization user_syncs, fallback to userId for personal user_syncs
    const ownerId = orgId || userId;

    // Use userId (string) directly
    const user_sync = await getUserSyncByUserId(params.id, ownerId);

    if (!user_sync) {
      return NextResponse.json(
        {
          success: false,
          error: 'UserSync not found or access denied',
          code: 'NOT_FOUND',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: user_sync,
    });
  } catch (error) {
    console.error('Error fetching user_sync:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user_sync ID',
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
 * PUT /api/user_syncs/[id] - Update user_sync with ownership check
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<UserSyncResponse | UserSyncErrorResponse>> {
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

    // Use orgId for organization user_syncs, fallback to userId for personal user_syncs
    const ownerId = orgId || userId;

    // Use userId (string) directly
    const body = await request.json();
    const validatedData = validateUpdateUserSync(body);
    const updatedUserSync = await updateUserSync(params.id, ownerId, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedUserSync,
      message: 'UserSync updated successfully',
    });
  } catch (error) {
    console.error('Error updating user_sync:', error);

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
      if (error.message === 'UserSync not found or access denied') {
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
 * DELETE /api/user_syncs/[id] - Delete user_sync with ownership check
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<{ success: true; message: string } | UserSyncErrorResponse>> {
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

    // Use orgId for organization user_syncs, fallback to userId for personal user_syncs
    const ownerId = orgId || userId;

    // Use userId (string) directly
    await deleteUserSync(params.id, ownerId);

    return NextResponse.json({
      success: true,
      message: 'UserSync deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user_sync:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user_sync ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === 'UserSync not found or access denied') {
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
