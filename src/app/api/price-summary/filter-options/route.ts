/**
 * Price Summary Filter Options API Route
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getPriceSummaryFilterOptions } from '@/libs/queries/priceSummary';
import type {
  PriceSummaryErrorResponse,
  PriceSummaryFilterOptionsResponse,
} from '@/types/priceSummary';

/**
 * GET /api/price-summary/filter-options
 * Fetch filter options for dropdowns
 */
export async function GET(_request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: PriceSummaryErrorResponse = {
        success: false,
        error: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Fetch filter options
    const filterOptions = await getPriceSummaryFilterOptions(userId);

    // Return successful response
    const response: PriceSummaryFilterOptionsResponse = {
      success: true,
      data: filterOptions,
      message: 'Filter options retrieved successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Price summary filter options API error:', error);

    const errorResponse: PriceSummaryErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
