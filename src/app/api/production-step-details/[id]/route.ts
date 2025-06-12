/**
 * ProductionStepDetails [id] API Routes - GET, PUT, DELETE
 * Following TDD Workflow Standards - Green Phase
 * Enhanced with authentication, validation, and error handling
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import {
  deleteProductionStepDetail,
  getProductionStepDetailById,
  updateProductionStepDetail,
} from '@/libs/queries/productionStepDetail';
import { validateUpdateProductionStepDetail } from '@/libs/validations/productionStepDetail';

type RouteParams = {
  params: { id: string };
};

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    // ✅ Handle authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // ✅ Validate ID parameter
    const id = Number.parseInt(params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return Response.json(
        { success: false, error: 'Invalid ID parameter', code: 'INVALID_ID' },
        { status: 400 },
      );
    }

    // ✅ Fetch record
    const ownerId = orgId || userId;
    const productionStepDetail = await getProductionStepDetailById(id, ownerId);

    if (!productionStepDetail) {
      return Response.json(
        { success: false, error: 'Production step detail not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      data: productionStepDetail,
    });
  } catch (error) {
    console.error('Error fetching production step detail:', error);

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    // ✅ Handle authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // ✅ Validate ID parameter
    const id = Number.parseInt(params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return Response.json(
        { success: false, error: 'Invalid ID parameter', code: 'INVALID_ID' },
        { status: 400 },
      );
    }

    // ✅ Check if record exists
    const ownerId = orgId || userId;
    const existingRecord = await getProductionStepDetailById(id, ownerId);

    if (!existingRecord) {
      return Response.json(
        { success: false, error: 'Production step detail not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    // ✅ Validate request body
    const body = await request.json();
    const validatedData = validateUpdateProductionStepDetail(body);

    // ✅ Update record
    const updatedRecord = await updateProductionStepDetail(id, ownerId, validatedData);

    return Response.json({
      success: true,
      data: updatedRecord,
      message: 'Production step detail updated successfully',
    });
  } catch (error) {
    console.error('Error updating production step detail:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { success: false, error: 'Invalid request data', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 },
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    // ✅ Handle authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // ✅ Validate ID parameter
    const id = Number.parseInt(params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return Response.json(
        { success: false, error: 'Invalid ID parameter', code: 'INVALID_ID' },
        { status: 400 },
      );
    }

    // ✅ Check if record exists
    const ownerId = orgId || userId;
    const existingRecord = await getProductionStepDetailById(id, ownerId);

    if (!existingRecord) {
      return Response.json(
        { success: false, error: 'Production step detail not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    // ✅ Delete record
    await deleteProductionStepDetail(id, ownerId);

    return Response.json({
      success: true,
      message: 'Production step detail deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting production step detail:', error);

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
