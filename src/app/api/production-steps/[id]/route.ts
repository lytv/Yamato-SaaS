/**
 * Individual Production Step API Routes
 * GET /api/production-steps/[id] - Get single production step
 * PUT /api/production-steps/[id] - Update production step
 * DELETE /api/production-steps/[id] - Delete production step
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  deleteProductionStep,
  getProductionStepById,
  updateProductionStep,
} from '@/libs/queries/productionStep';
import {
  validateProductionStepId,
  validateUpdateProductionStep,
} from '@/libs/validations/productionStep';
import type {
  ProductionStepErrorResponse,
  ProductionStepResponse,
} from '@/types/productionStep';

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * GET /api/production-steps/[id] - Get single production step with ownership check
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ProductionStepResponse | ProductionStepErrorResponse>> {
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

    // Use orgId for organization production steps, fallback to userId for personal production steps
    const ownerId = orgId || userId;

    // Validate production step ID
    const { id } = validateProductionStepId({ id: params.id });

    // Get production step with ownership check
    const productionStep = await getProductionStepById(id, ownerId);

    if (!productionStep) {
      return NextResponse.json(
        {
          success: false,
          error: 'Production step not found or access denied',
          code: 'NOT_FOUND',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: productionStep,
    });
  } catch (error) {
    console.error('Error fetching production step:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid production step ID',
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
 * PUT /api/production-steps/[id] - Update production step with ownership check
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ProductionStepResponse | ProductionStepErrorResponse>> {
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

    // Use orgId for organization production steps, fallback to userId for personal production steps
    const ownerId = orgId || userId;

    // Validate production step ID
    const { id } = validateProductionStepId({ id: params.id });

    // Validate update data
    const body = await request.json();
    const validatedData = validateUpdateProductionStep(body);

    // Update production step with ownership check
    const updatedStep = await updateProductionStep(id, ownerId, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedStep,
      message: 'Production step updated successfully',
    });
  } catch (error) {
    console.error('Error updating production step:', error);

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
      if (error.message === 'Production step not found or access denied') {
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
 * DELETE /api/production-steps/[id] - Delete production step with ownership check
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<{ success: true; message: string } | ProductionStepErrorResponse>> {
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

    // Use orgId for organization production steps, fallback to userId for personal production steps
    const ownerId = orgId || userId;

    // Validate production step ID
    const { id } = validateProductionStepId({ id: params.id });

    // Delete production step with ownership check
    await deleteProductionStep(id, ownerId);

    return NextResponse.json({
      success: true,
      message: 'Production step deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting production step:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid production step ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Production step not found or access denied') {
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
