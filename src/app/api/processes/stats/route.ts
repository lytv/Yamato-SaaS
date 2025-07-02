/**
 * Process Statistics API Route
 * GET /api/processes/stats - Get process statistics for dashboard
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getProcessStats } from '@/libs/queries/process';
import type {
  ProcessErrorResponse,
  ProcessStatsResponse,
} from '@/types/process';

// Force dynamic rendering due to auth() usage
export const dynamic = 'force-dynamic';

/**
 * GET /api/processes/stats - Get process statistics for dashboard
 */
export async function GET(_request: NextRequest): Promise<NextResponse<ProcessStatsResponse | ProcessErrorResponse>> {
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

    // Get process statistics
    const stats = await getProcessStats(ownerId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching process stats:', error);

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
