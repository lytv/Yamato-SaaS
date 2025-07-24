/**
 * Satellite Progress API Route
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { getSatelliteProgress } from '@/libs/queries/satelliteProgress';
import { validateSatelliteProgressFiltersWithOwner } from '@/libs/validations/satelliteProgress';
import type {
  SatelliteProgressResponse,
  SatelliteProgressErrorResponse,
} from '@/types/satelliteProgress';

/**
 * GET /api/satellite-progress
 * Fetch satellite progress data with filters
 */
export async function GET(request: NextRequest) {
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

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      plan_code: searchParams.get('plan_code') || undefined,
      product_code: searchParams.get('product_code') || undefined,
      assigned_user_id: searchParams.get('assigned_user_id') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      sortBy: searchParams.get('sortBy') || 'product_code',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      ownerId: userId,
    };

    // Validate filters
    const validatedFilters = validateSatelliteProgressFiltersWithOwner(filters);

    // Fetch data
    const result = await getSatelliteProgress(validatedFilters);

    // Return successful response
    const response: SatelliteProgressResponse = {
      success: true,
      data: result.data,
      summary: result.summary,
      pagination: result.pagination,
      message: 'Satellite progress data retrieved successfully',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Satellite progress API error:', error);

    const errorResponse: SatelliteProgressErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}