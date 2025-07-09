/**
 * OutsourceOrderReceipt API Routes with Enhanced Relations Support
 * Generated based on existing pattern from outsourceOrderDetails/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  createOutsourceOrderReceipt,
  getOutsourceOrderReceiptsByOwner,
  getOutsourceOrderReceiptsCountByOwner,
} from '@/libs/queries/outsourceOrderReceipt';
import {
  validateCreateOutsourceOrderReceipt,
  validateOutsourceOrderReceiptListParams,
} from '@/libs/validations/outsourceOrderReceipt';

// GET /api/outsourceOrderReceipts
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
      outsourceOrderDetailId: searchParams.get('outsourceOrderDetailId') ? Number(searchParams.get('outsourceOrderDetailId')) : undefined,
      qualityStatus: searchParams.get('qualityStatus') || undefined,
      status: searchParams.get('status') || undefined,
      receivedByUserId: searchParams.get('receivedByUserId') || undefined,
      batchNumber: searchParams.get('batchNumber') || undefined,
    };

    const validation = validateOutsourceOrderReceiptListParams(rawParams);
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
    const [outsourceOrderReceipts, totalCount] = await Promise.all([
      getOutsourceOrderReceiptsByOwner({
        ...params,
        ownerId,
      }),
      getOutsourceOrderReceiptsCountByOwner({
        ...params,
        ownerId,
      }),
    ]);

    const hasMore = params.showAll ? false : (params.page * params.limit < totalCount);

    return NextResponse.json({
      success: true,
      data: outsourceOrderReceipts,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        hasMore,
      },
    });

  } catch (error) {
    console.error('GET /api/outsourceOrderReceipts error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/outsourceOrderReceipts
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    const body = await request.json();

    const validation = validateCreateOutsourceOrderReceipt({
      ...body,
      ownerId,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const outsourceOrderReceipt = await createOutsourceOrderReceipt(validation.data);

    return NextResponse.json({
      success: true,
      data: outsourceOrderReceipt,
      message: 'OutsourceOrderReceipt created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/outsourceOrderReceipts error:', error);

    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'Receipt number already exists', code: 'DUPLICATE_ERROR' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('foreign key constraint') || error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Referenced entity not found', code: 'REFERENCE_ERROR' },
          { status: 400 }
        );
      }

      if (error.message.includes('exceeds remaining quantity')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'BUSINESS_RULE_ERROR' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
