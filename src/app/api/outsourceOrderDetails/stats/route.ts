/**
 * OutsourceOrderDetail Statistics API Route
 * Generated based on existing pattern from outsourceOrders/stats/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getOutsourceOrderDetailStats } from '@/libs/queries/outsourceOrderDetail';

// GET /api/outsourceOrderDetails/stats
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const outsourceOrderId = searchParams.get('outsourceOrderId') 
      ? Number(searchParams.get('outsourceOrderId')) 
      : undefined;

    // Validate outsourceOrderId if provided
    if (outsourceOrderId && (isNaN(outsourceOrderId) || outsourceOrderId <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid outsourceOrderId parameter',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const stats = await getOutsourceOrderDetailStats(userId, outsourceOrderId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('GET /api/outsourceOrderDetails/stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
