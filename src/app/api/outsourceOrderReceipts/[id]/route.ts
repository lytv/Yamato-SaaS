/**
 * OutsourceOrderReceipt Individual Item API Routes
 * Generated based on existing pattern from outsourceOrderDetails/[id]/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import {
  deleteOutsourceOrderReceipt,
  getOutsourceOrderReceiptById,
  updateOutsourceOrderReceipt,
} from '@/libs/queries/outsourceOrderReceipt';
import { validateUpdateOutsourceOrderReceipt } from '@/libs/validations/outsourceOrderReceipt';

// GET /api/outsourceOrderReceipts/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    const id = Number.parseInt(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const includeRelations = searchParams.get('includeRelations') === 'true';

    const outsourceOrderReceipt = await getOutsourceOrderReceiptById(id, ownerId, includeRelations);

    if (!outsourceOrderReceipt) {
      return NextResponse.json(
        { success: false, error: 'OutsourceOrderReceipt not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: outsourceOrderReceipt,
    });
  } catch (error) {
    console.error(`GET /api/outsourceOrderReceipts/${params.id} error:`, error);

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'NOT_FOUND' },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

// PUT /api/outsourceOrderReceipts/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    const id = Number.parseInt(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const body = await request.json();

    const validation = validateUpdateOutsourceOrderReceipt(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const updatedOutsourceOrderReceipt = await updateOutsourceOrderReceipt(id, validation.data, ownerId);

    return NextResponse.json({
      success: true,
      data: updatedOutsourceOrderReceipt,
      message: 'OutsourceOrderReceipt updated successfully',
    });
  } catch (error) {
    console.error(`PUT /api/outsourceOrderReceipts/${params.id} error:`, error);

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'NOT_FOUND' },
          { status: 404 },
        );
      }

      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'Receipt number already exists', code: 'DUPLICATE_ERROR' },
          { status: 409 },
        );
      }

      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { success: false, error: 'Referenced entity not found', code: 'REFERENCE_ERROR' },
          { status: 400 },
        );
      }

      if (error.message.includes('exceeds remaining quantity')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'BUSINESS_RULE_ERROR' },
          { status: 400 },
        );
      }

      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'VALIDATION_ERROR' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

// DELETE /api/outsourceOrderReceipts/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    const id = Number.parseInt(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    await deleteOutsourceOrderReceipt(id, ownerId);

    return NextResponse.json({
      success: true,
      message: 'OutsourceOrderReceipt deleted successfully',
    });
  } catch (error) {
    console.error(`DELETE /api/outsourceOrderReceipts/${params.id} error:`, error);

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'NOT_FOUND' },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
