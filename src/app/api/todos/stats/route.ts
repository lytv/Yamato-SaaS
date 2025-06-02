/**
 * Todo Statistics API Route
 * GET /api/todos/stats - Get todo statistics for dashboard
 * Following Yamato-SaaS patterns with Clerk authentication
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getTodoStats } from '@/libs/queries/todo';
import type {
  TodoErrorResponse,
  TodoStatsResponse,
} from '@/types/todo';

/**
 * GET /api/todos/stats - Get todo statistics for dashboard
 */
export async function GET(_request: NextRequest): Promise<NextResponse<TodoStatsResponse | TodoErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization todos, fallback to userId for personal todos
    const ownerId = orgId || userId;

    // Get todo statistics
    const stats = await getTodoStats(ownerId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching todo stats:', error);

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
