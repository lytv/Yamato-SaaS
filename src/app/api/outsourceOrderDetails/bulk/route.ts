/**
 * OutsourceOrderDetail Bulk API Route
 * Handles bulk creation of multiple order details
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  createOutsourceOrderDetail,
} from '@/libs/queries/outsourceOrderDetail';
import {
  validateCreateOutsourceOrderDetail,
} from '@/libs/validations/outsourceOrderDetail';
import type { CreateOutsourceOrderDetailInput } from '@/types/outsourceOrderDetail';

// POST /api/outsourceOrderDetails/bulk
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Check if body is an array
    if (!Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request body must be an array of order details',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }

    if (body.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Array cannot be empty',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }

    // Validate each item in the array
    const validatedItems: CreateOutsourceOrderDetailInput[] = [];
    const validationErrors: string[] = [];

    for (let i = 0; i < body.length; i++) {
      const item = body[i];

      if (!item || typeof item !== 'object') {
        validationErrors.push(`Item ${i + 1}: Invalid item format`);
        continue;
      }

      const validation = validateCreateOutsourceOrderDetail({
        ...item,
        ownerId,
        status: item.status || 'pending',
        completedQuantity: item.completedQuantity || 0,
      });

      if (!validation.success) {
        const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        validationErrors.push(`Item ${i + 1}: ${errors}`);
      } else {
        validatedItems.push(validation.data);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed for some items',
          code: 'VALIDATION_ERROR',
          details: validationErrors,
        },
        { status: 400 },
      );
    }

    // Create all items
    const createdItems = [];
    const errors = [];

    for (let i = 0; i < validatedItems.length; i++) {
      try {
        const item = validatedItems[i];
        if (!item) {
          continue;
        }

        const created = await createOutsourceOrderDetail(item);
        createdItems.push(created);
      } catch (error) {
        console.error(`Error creating item ${i + 1}:`, error);

        if (error instanceof Error) {
          if (error.message.includes('unique constraint')) {
            errors.push(`Item ${i + 1}: A detail with this combination already exists`);
          } else if (error.message.includes('foreign key constraint')) {
            errors.push(`Item ${i + 1}: Referenced entity not found`);
          } else if (error.message.includes('not found or access denied')) {
            errors.push(`Item ${i + 1}: ${error.message}`);
          } else {
            errors.push(`Item ${i + 1}: ${error.message}`);
          }
        } else {
          errors.push(`Item ${i + 1}: Unknown error occurred`);
        }
      }
    }

    // If some items failed but some succeeded
    if (errors.length > 0 && createdItems.length > 0) {
      return NextResponse.json({
        success: true,
        data: createdItems,
        message: `Created ${createdItems.length} out of ${validatedItems.length} items`,
        warnings: errors,
      }, { status: 201 });
    }

    // If all items failed
    if (errors.length > 0 && createdItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create any items',
          code: 'BULK_CREATION_ERROR',
          details: errors,
        },
        { status: 400 },
      );
    }

    // All items succeeded
    return NextResponse.json({
      success: true,
      data: createdItems,
      message: `Successfully created ${createdItems.length} order details`,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/outsourceOrderDetails/bulk error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
