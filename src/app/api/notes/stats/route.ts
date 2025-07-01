/**
 * Note Statistics API Route
 * GET /api/notes/stats - Get note statistics for dashboard
 * Following Yamato-SaaS patterns with Clerk authentication
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getNoteStats } from '@/libs/queries/note';
import type {
  NoteErrorResponse,
  NoteStatsResponse,
} from '@/types/note';

// Force dynamic rendering due to auth() usage
export const dynamic = 'force-dynamic';

/**
 * GET /api/notes/stats - Get note statistics for dashboard
 */
export async function GET(_request: NextRequest): Promise<NextResponse<NoteStatsResponse | NoteErrorResponse>> {
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

    // Use orgId for organization notes, fallback to userId for personal notes
    const ownerId = orgId || userId;

    // Get note statistics
    const stats = await getNoteStats(ownerId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching note stats:', error);

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
