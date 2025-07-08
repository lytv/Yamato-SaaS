/**
 * OutsourceOrderDetail Individual Item API Routes
 * Generated based on existing pattern from outsourceOrders/[id]/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  deleteOutsourceOrderDetail,
  getOutsourceOrderDetailById,
  updateOutsourceOrderDetail,
} from '@/libs/queries/outsourceOrderDetail';
import {
  validateUpdateOutsourceOrderDetail,
} from '@/libs/validations/outsourceOrderDetail';

// GET /api/outsourceOrderDetails/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const includeRelations = searchParams.get('includeRelations') === 'true';

    const outsourceOrderDetail = await getOutsourceOrderDetailById(id, ownerId, includeRelations);

    if (!outsourceOrderDetail) {
      return NextResponse.json(
        { success: false, error: 'OutsourceOrderDetail not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: outsourceOrderDetail,
    });
  } catch (error) {
    console.error('GET /api/outsourceOrderDetails/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

// PUT /api/outsourceOrderDetails/[id]
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const body = await _request.json();

    // Check if body is valid object
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }

    const validation = validateUpdateOutsourceOrderDetail(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const updatedOutsourceOrderDetail = await updateOutsourceOrderDetail(id, validation.data, ownerId);

    return NextResponse.json({
      success: true,
      data: updatedOutsourceOrderDetail,
      message: 'OutsourceOrderDetail updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/outsourceOrderDetails/[id] error:', error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('not found or access denied')) {
        return NextResponse.json(
          {
            success: false,
            error: 'OutsourceOrderDetail not found or access denied',
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Referenced entity not found',
            code: 'REFERENCE_ERROR',
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

// DELETE /api/outsourceOrderDetails/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    await deleteOutsourceOrderDetail(id, ownerId);

    return NextResponse.json({
      success: true,
      message: 'OutsourceOrderDetail deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/outsourceOrderDetails/[id] error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found or access denied')) {
        return NextResponse.json(
          {
            success: false,
            error: 'OutsourceOrderDetail not found or access denied',
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
