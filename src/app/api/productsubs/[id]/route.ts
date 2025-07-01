/**
 * Individual ProductSub API Routes
 * GET /api/productsubsubs/[id] - Get single productsubsub
 * PUT /api/productsubsubs/[id] - Update productsubsub
 * DELETE /api/productsubsubs/[id] - Delete productsubsub
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  deleteProductSub,
  getProductSubById,
  updateProductSub,
} from '@/libs/queries/productsub';
import {
  validateProductSubId,
  validateUpdateProductSub,
} from '@/libs/validations/productsub';
import type {
  ProductSubErrorResponse,
  ProductSubResponse,
} from '@/types/productsub';

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * GET /api/productsubsubs/[id] - Get single productsubsub with ownership check
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ProductSubResponse | ProductSubErrorResponse>> {
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

    // Use orgId for organization productsubs, fallback to userId for personal productsubs
    const ownerId = orgId || userId;

    // Validate productsub ID
    const { id } = validateProductSubId({ id: params.id });

    // Get productsub with ownership check
    const productsub = await getProductSubById(id, ownerId);

    if (!productsub) {
      return NextResponse.json(
        {
          success: false,
          error: 'ProductSub not found or access denied',
          code: 'NOT_FOUND',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: productsub,
    });
  } catch (error) {
    console.error('Error fetching productsub:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid productsub ID',
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
 * PUT /api/productsubsubs/[id] - Update productsubsub with ownership check
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ProductSubResponse | ProductSubErrorResponse>> {
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

    // Use orgId for organization productsubs, fallback to userId for personal productsubs
    const ownerId = orgId || userId;

    // Validate productsub ID
    const { id } = validateProductSubId({ id: params.id });

    // Validate update data
    const body = await request.json();
    const validatedData = validateUpdateProductSub(body);

    // Update productsub with ownership check
    const updatedProductSub = await updateProductSub(id, ownerId, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedProductSub,
      message: 'ProductSub updated successfully',
    });
  } catch (error) {
    console.error('Error updating productsub:', error);

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
      if (error.message === 'ProductSub not found or access denied') {
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
 * DELETE /api/productsubsubs/[id] - Delete productsubsub with ownership check
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<{ success: true; message: string } | ProductSubErrorResponse>> {
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

    // Use orgId for organization productsubs, fallback to userId for personal productsubs
    const ownerId = orgId || userId;

    // Validate productsub ID
    const { id } = validateProductSubId({ id: params.id });

    // Delete productsub with ownership check
    await deleteProductSub(id, ownerId);

    return NextResponse.json({
      success: true,
      message: 'ProductSub deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting productsub:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid productsub ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === 'ProductSub not found or access denied') {
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
