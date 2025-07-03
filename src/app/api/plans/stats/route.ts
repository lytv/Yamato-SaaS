/**
 * Plan Statistics API Route
 * GET /api/plans/stats - Get plan statistics for dashboard
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getPlanStats } from '@/libs/queries/plan';
import type {
  PlanErrorResponse,
  PlanStatsResponse,
} from '@/types/plan';

// Force dynamic rendering due to auth() usage
export const dynamic = 'force-dynamic';

/**
 * GET /api/plans/stats - Get plan statistics for dashboard
 */
export async function GET(_request: NextRequest): Promise<NextResponse<PlanStatsResponse | PlanErrorResponse>> {
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

    // Use orgId for organization plans, fallback to userId for personal plans
    const ownerId = orgId || userId;

    // Get plan statistics
    const stats = await getPlanStats(ownerId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching plan stats:', error);

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
