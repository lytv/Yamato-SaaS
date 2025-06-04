/**
 * Product Statistics API Route
 * GET /api/products/stats - Get product statistics for dashboard
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getProductStats } from '@/libs/queries/product';
import type {
  ProductErrorResponse,
  ProductStatsResponse,
} from '@/types/product';

/**
 * GET /api/products/stats - Get product statistics for dashboard
 */
export async function GET(_request: NextRequest): Promise<NextResponse<ProductStatsResponse | ProductErrorResponse>> {
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

    // Use orgId for organization products, fallback to userId for personal products
    const ownerId = orgId || userId;

    // Get product statistics
    const stats = await getProductStats(ownerId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'STATS_ERROR',
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
