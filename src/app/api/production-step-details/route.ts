/**
 * ProductionStepDetails API Routes - GET, POST
 * Following TDD Workflow Standards - Green Phase
 * Enhanced with authentication, validation, and error handling
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import {
  createProductionStepDetail,
  getPaginatedProductionStepDetails,
  getProductionStepDetailsByOwner,
} from '@/libs/queries/productionStepDetail';
import {
  validateCreateProductionStepDetail,
  validateProductionStepDetailListParams,
} from '@/libs/validations/productionStepDetail';
import type {
  ProductionStepDetailListParams,
  ProductionStepDetailListParamsWithOwner,
} from '@/types/productionStepDetail';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // ✅ Handle both sync/async auth
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // Handle NextRequest URL parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // ✅ Convert null to undefined (400 fix)
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      productId: searchParams.get('productId') || undefined,
      productionStepId: searchParams.get('productionStepId') || undefined,
    };

    // ✅ Validation with proper error handling
    const validatedParams = validateProductionStepDetailListParams(queryParams);

    // Add ownerId to the validated params
    const paramsWithOwner: ProductionStepDetailListParamsWithOwner = {
      page: validatedParams.page,
      limit: validatedParams.limit,
      search: validatedParams.search,
      sortBy: validatedParams.sortBy as ProductionStepDetailListParams['sortBy'],
      sortOrder: validatedParams.sortOrder as ProductionStepDetailListParams['sortOrder'],
      productId: validatedParams.productId,
      productionStepId: validatedParams.productionStepId,
      ownerId: orgId || userId,
    };

    const result = await getPaginatedProductionStepDetails(paramsWithOwner);

    return Response.json({
      success: true,
      data: result.productionStepDetails,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: result.pagination.total,
        hasMore: result.pagination.hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching production step details:', error);

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
    const validatedData = validateCreateProductionStepDetail(body);

    // ✅ Check for duplicate product-step combination
    const ownerId = orgId || userId;
    const existingAssignments = await getProductionStepDetailsByOwner({
      ownerId,
      productId: validatedData.productId,
      productionStepId: validatedData.productionStepId,
      page: 1,
      limit: 1,
    });

    if (existingAssignments.length > 0) {
      return Response.json(
        { success: false, error: 'Production step already assigned to this product', code: 'DUPLICATE_ASSIGNMENT' },
        { status: 409 },
      );
    }

    const productionStepDetail = await createProductionStepDetail({
      ...validatedData,
      ownerId,
    });

    return Response.json({
      success: true,
      data: productionStepDetail,
      message: 'Production step detail created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating production step detail:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { success: false, error: 'Invalid request data', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes('duplicate')) {
      return Response.json(
        { success: false, error: 'Production step already assigned to this product', code: 'DUPLICATE_ASSIGNMENT' },
        { status: 409 },
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
