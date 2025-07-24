/**
 * Satellite Progress Filter Options API Route
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getSatelliteProgressFilterOptions } from '@/libs/queries/satelliteProgress';
import type {
  SatelliteProgressFilterOptionsResponse,
  SatelliteProgressErrorResponse,
} from '@/types/satelliteProgress';

/**
 * GET /api/satellite-progress/filter-options
 * Fetch filter options for dropdowns
 */
export async function GET() {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: SatelliteProgressErrorResponse = {
        success: false,
        error: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Fetch filter options
    const filterOptions = await getSatelliteProgressFilterOptions();

    // Return successful response
    const response: SatelliteProgressFilterOptionsResponse = {
      success: true,
      data: filterOptions,
      message: 'Satellite progress filter options retrieved successfully',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Satellite progress filter options API error:', error);

    const errorResponse: SatelliteProgressErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}