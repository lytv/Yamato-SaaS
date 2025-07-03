/**
 * Plans API Routes - GET, POST
 * Following TDD Workflow Standards - Green Phase
 * Enhanced with critical fixes: auth compatibility, query parameter validation, error handling
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createPlan, getPaginatedPlans, getPlanByCode } from '@/libs/queries/plan';
import { validateCreatePlan, validatePlanListParams } from '@/libs/validations/plan';
import type { PlanListParams, PlanListParamsWithOwner } from '@/types/plan';

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
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      showAll: searchParams.get('showAll') === 'true',
    };

    // ✅ Validation with proper error handling
    const validatedParams = validatePlanListParams(queryParams);

    // Add ownerId to the validated params
    const paramsWithOwner: PlanListParamsWithOwner = {
      page: validatedParams.page,
      limit: validatedParams.limit,
      search: validatedParams.search,
      sortBy: validatedParams.sortBy as PlanListParams['sortBy'],
      sortOrder: validatedParams.sortOrder as PlanListParams['sortOrder'],
      ownerId: orgId || userId,
      showAll: validatedParams.showAll,
    };

    const result = await getPaginatedPlans(paramsWithOwner);

    return Response.json({
      success: true,
      data: result.plans,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: result.pagination.total,
        hasMore: result.pagination.hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching plans:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { success: false, error: 'Invalid parameters', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 },
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // ✅ Same auth pattern
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = validateCreatePlan(body);

    // ✅ Check for duplicate planCode
    const ownerId = orgId || userId;
    const existing = await getPlanByCode(validatedData.planCode, ownerId);
    if (existing) {
      return Response.json(
        { success: false, error: 'Plan code already exists', code: 'DUPLICATE_CODE' },
        { status: 409 },
      );
    }

    const plan = await createPlan({
      ...validatedData,
      ownerId,
    });

    return Response.json({
      success: true,
      data: plan,
      message: 'Plan created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { success: false, error: 'Invalid request data', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes('duplicate')) {
      return Response.json(
        { success: false, error: 'Plan code already exists', code: 'DUPLICATE_CODE' },
        { status: 409 },
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
