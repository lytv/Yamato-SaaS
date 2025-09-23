/**
 * Price Summary API Route
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getPriceSummary } from '@/libs/queries/priceSummary';
import { validatePriceSummaryFiltersWithOwner } from '@/libs/validations/priceSummary';
import type {
  PriceSummaryErrorResponse,
  PriceSummaryResponse,
} from '@/types/priceSummary';

/**
 * GET /api/price-summary
 * Fetch price summary data with filters
 */
export async function GET(request: NextRequest) {
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

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      product_code: searchParams.get('product_code') || undefined,
      price_type: searchParams.get('price_type') || 'factory_price',
      show_only_with_pricing: searchParams.get('show_only_with_pricing') === 'true' || false,
      page: Number.parseInt(searchParams.get('page') || '1', 10),
      limit: Number.parseInt(searchParams.get('limit') || '20', 10),
      sortBy: searchParams.get('sortBy') || 'product_code',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      ownerId: userId,
    };

    // Validate filters
    const validatedFilters = validatePriceSummaryFiltersWithOwner(filters);

    // Fetch data
    const result = await getPriceSummary(validatedFilters);

    // Return successful response
    const response: PriceSummaryResponse = {
      success: true,
      data: result.data,
      summary: result.summary,
      pagination: result.pagination,
      message: 'Price summary data retrieved successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Price summary API error:', error);

    const errorResponse: PriceSummaryErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
