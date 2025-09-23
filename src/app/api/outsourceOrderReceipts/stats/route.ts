/**
 * OutsourceOrderReceipt Statistics API Route
 * Generated based on existing pattern from outsourceOrderDetails/stats/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getOutsourceOrderReceiptStats } from '@/libs/queries/outsourceOrderReceipt';

// GET /api/outsourceOrderReceipts/stats
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
    const outsourceOrderDetailId = searchParams.get('outsourceOrderDetailId')
      ? Number(searchParams.get('outsourceOrderDetailId'))
      : undefined;

    // Validate outsourceOrderDetailId if provided
    if (outsourceOrderDetailId !== undefined && (Number.isNaN(outsourceOrderDetailId) || outsourceOrderDetailId <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Invalid outsourceOrderDetailId format', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const stats = await getOutsourceOrderReceiptStats(ownerId, outsourceOrderDetailId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('GET /api/outsourceOrderReceipts/stats error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'NOT_FOUND' },
          { status: 404 },
        );
      }

      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'VALIDATION_ERROR' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
