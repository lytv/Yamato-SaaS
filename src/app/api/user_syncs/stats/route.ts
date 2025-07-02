/**
 * UserSync Statistics API Route
 * GET /api/user_syncs/stats - Get user_sync statistics for dashboard
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getUserSyncStats } from '@/libs/queries/user_sync';
import type {
  UserSyncErrorResponse,
  UserSyncStatsResponse,
} from '@/types/user_sync';

// Force dynamic rendering due to auth() usage
export const dynamic = 'force-dynamic';

/**
 * GET /api/user_syncs/stats - Get user_sync statistics for dashboard
 */
export async function GET(_request: NextRequest): Promise<NextResponse<UserSyncStatsResponse | UserSyncErrorResponse>> {
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

    // Get user_sync statistics
    const stats = await getUserSyncStats(ownerId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching user_sync stats:', error);

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
