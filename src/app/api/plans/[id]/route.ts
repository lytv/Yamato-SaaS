/**
 * Individual Plan API Routes
 * GET /api/plans/[id] - Get single plan
 * PUT /api/plans/[id] - Update plan
 * DELETE /api/plans/[id] - Delete plan
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  deletePlan,
  getPlanById,
  updatePlan,
} from '@/libs/queries/plan';
import {
  validatePlanId,
  validateUpdatePlan,
} from '@/libs/validations/plan';
import type {
  PlanErrorResponse,
  PlanResponse,
} from '@/types/plan';

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * GET /api/plans/[id] - Get single plan with ownership check
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<PlanResponse | PlanErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization plans, fallback to userId for personal plans
    const ownerId = orgId || userId;

    // Validate plan ID
    const { id } = validatePlanId({ id: params.id });

    // Get plan with ownership check
    const plan = await getPlanById(id, ownerId);

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan not found or access denied',
          code: 'NOT_FOUND',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error fetching plan:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid plan ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
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

/**
 * PUT /api/plans/[id] - Update plan with ownership check
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<PlanResponse | PlanErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization plans, fallback to userId for personal plans
    const ownerId = orgId || userId;

    // Validate plan ID
    const { id } = validatePlanId({ id: params.id });

    // Validate update data
    const body = await request.json();
    const validatedData = validateUpdatePlan(body);

    // Update plan with ownership check
    const updatedPlan = await updatePlan(id, ownerId, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedPlan,
      message: 'Plan updated successfully',
    });
  } catch (error) {
    console.error('Error updating plan:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Plan not found or access denied') {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'UPDATE_ERROR',
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

/**
 * DELETE /api/plans/[id] - Delete plan with ownership check
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<{ success: true; message: string } | PlanErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization plans, fallback to userId for personal plans
    const ownerId = orgId || userId;

    // Validate plan ID
    const { id } = validatePlanId({ id: params.id });

    // Delete plan with ownership check
    await deletePlan(id, ownerId);

    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plan:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid plan ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Plan not found or access denied') {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'DELETE_ERROR',
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
