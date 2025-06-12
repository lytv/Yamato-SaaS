/**
 * ProductionStepDetails Statistics API Route - GET
 * Following TDD Workflow Standards - Green Phase
 * Enhanced with authentication and comprehensive statistics
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

import { getProductionStepDetailStats } from '@/libs/queries/productionStepDetail';

// Force dynamic rendering due to auth() usage
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest): Promise<Response> {
  try {
    // ✅ Handle authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // ✅ Fetch statistics
    const ownerId = orgId || userId;
    const stats = await getProductionStepDetailStats(ownerId);

    return Response.json({
      success: true,
      data: stats,
      message: 'Production step detail statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching production step detail statistics:', error);

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
