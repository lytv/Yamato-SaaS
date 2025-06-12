/**
 * Production Step Statistics API Route
 * GET /api/production-steps/stats - Get production step statistics for dashboard
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getProductionStepStats } from '@/libs/queries/productionStep';
import type {
  ProductionStepErrorResponse,
  ProductionStepStatsResponse,
} from '@/types/productionStep';

// Force dynamic rendering due to auth() usage
export const dynamic = 'force-dynamic';

/**
 * GET /api/production-steps/stats - Get production step statistics for dashboard
 */
export async function GET(_request: NextRequest): Promise<NextResponse<ProductionStepStatsResponse | ProductionStepErrorResponse>> {
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

    // Use orgId for organization production steps, fallback to userId for personal production steps
    const ownerId = orgId || userId;

    // Get production step statistics
    const stats = await getProductionStepStats(ownerId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching production step stats:', error);

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
