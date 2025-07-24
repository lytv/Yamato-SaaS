/**
 * Production Progress Pivot API Routes - GET
 * Following TDD Workflow Standards and Yamato-SaaS patterns
 * Enhanced with critical fixes: auth compatibility, query parameter validation, error handling
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { getProductionProgressPivot } from '@/libs/queries/productionProgressPivot';
import { validateProductionProgressPivotListParams } from '@/libs/validations/productionProgressPivot';
import type { ProductionProgressPivotFiltersWithOwner } from '@/types/productionProgressPivot';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // ✅ CRITICAL: Handle both sync/async auth (from debug guide)
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // Handle both NextRequest (runtime) and Request (testing)
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // ✅ CRITICAL: Convert null to undefined (400 fix)
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      product_code: searchParams.get('product_code') || undefined,
      plan_code: searchParams.get('plan_code') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    // ✅ Validation with proper error handling
    const validatedParams = validateProductionProgressPivotListParams(queryParams);

    // Add ownerId to the validated params
    const paramsWithOwner: ProductionProgressPivotFiltersWithOwner = {
      ...validatedParams,
      ownerId: orgId || userId,
    };

    const result = await getProductionProgressPivot(paramsWithOwner);

    return Response.json({
      success: true,
      data: result.data,
      summary: result.summary,
      pagination: result.pagination,
      message: 'Production progress pivot data retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching production progress pivot:', error);

    if (error instanceof ZodError) {
      return Response.json(
        {
          success: false,
          error: 'Invalid parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
          validationErrors: error.errors.reduce((acc, err) => {
            const field = err.path.join('.');
            if (!acc[field]) {
              acc[field] = [];
            }
            acc[field].push(err.message);
            return acc;
          }, {} as Record<string, string[]>),
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      // Handle specific database or business logic errors
      if (error.message.includes('stored procedure')) {
        return Response.json(
          { success: false, error: 'Database query failed', code: 'DATABASE_ERROR' },
          { status: 500 },
        );
      }

      if (error.message.includes('Failed to fetch')) {
        return Response.json(
          { success: false, error: 'Unable to retrieve production progress pivot data', code: 'FETCH_ERROR' },
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