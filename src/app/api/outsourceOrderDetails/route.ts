/**
 * OutsourceOrderDetail API Routes with Enhanced Relations Support
 * Generated based on existing pattern from outsourceOrders/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  createOutsourceOrderDetail,
  getOutsourceOrderDetailsByOwner,
  getOutsourceOrderDetailsCountByOwner,
} from '@/libs/queries/outsourceOrderDetail';
import {
  validateCreateOutsourceOrderDetail,
  validateOutsourceOrderDetailListParams,
} from '@/libs/validations/outsourceOrderDetail';

// GET /api/outsourceOrderDetails
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const rawParams = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 10,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      includeRelations: searchParams.get('includeRelations') === 'true',
      showAll: searchParams.get('showAll') === 'true',
      outsourceOrderId: searchParams.get('outsourceOrderId') ? Number(searchParams.get('outsourceOrderId')) : undefined,
      status: searchParams.get('status') || undefined,
      planId: searchParams.get('planId') ? Number(searchParams.get('planId')) : undefined,
      productId: searchParams.get('productId') ? Number(searchParams.get('productId')) : undefined,
      productionStepId: searchParams.get('productionStepId') ? Number(searchParams.get('productionStepId')) : undefined,
    };

    const validation = validateOutsourceOrderDetailListParams(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const params = validation.data;

    // Get data and count efficiently
    const [outsourceOrderDetails, totalCount] = await Promise.all([
      getOutsourceOrderDetailsByOwner({
        ...params,
        ownerId,
      }),
      getOutsourceOrderDetailsCountByOwner({
        ...params,
        ownerId,
      }),
    ]);

    const hasMore = params.showAll ? false : (params.page * params.limit < totalCount);

    return NextResponse.json({
      success: true,
      data: outsourceOrderDetails,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        hasMore,
      },
    });
  } catch (error) {
    console.error('GET /api/outsourceOrderDetails error:', error);
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

// POST /api/outsourceOrderDetails
export async function POST(request: NextRequest) {
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

    const body = await request.json();

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

    const validation = validateCreateOutsourceOrderDetail({
      ...body,
      ownerId,
      status: body.status || 'pending',
      completedQuantity: body.completedQuantity || 0,
    });
    
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

    const outsourceOrderDetail = await createOutsourceOrderDetail(validation.data);

    return NextResponse.json({
      success: true,
      data: outsourceOrderDetail,
      message: 'OutsourceOrderDetail created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/outsourceOrderDetails error:', error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'A detail with this combination already exists',
            code: 'DUPLICATE_ERROR',
          },
          { status: 409 },
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

      if (error.message.includes('not found or access denied')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
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
