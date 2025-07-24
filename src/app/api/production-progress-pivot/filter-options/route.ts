/**
 * Production Progress Pivot Filter Options API Route
 * Following TDD Workflow Standards and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';

import { getProductionProgressPivotFilterOptions } from '@/libs/queries/productionProgressPivot';

export async function GET(): Promise<Response> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const filterOptions = await getProductionProgressPivotFilterOptions();

    return Response.json({
      success: true,
      data: filterOptions,
      message: 'Production progress pivot filter options retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching production progress pivot filter options:', error);

    if (error instanceof Error) {
      if (error.message.includes('stored procedure')) {
        return Response.json(
          { success: false, error: 'Database query failed', code: 'DATABASE_ERROR' },
          { status: 500 },
        );
      }

      if (error.message.includes('Failed to fetch')) {
        return Response.json(
          { success: false, error: 'Unable to retrieve filter options', code: 'FETCH_ERROR' },
          { status: 500 },
        );
      }
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}